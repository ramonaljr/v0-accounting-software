-- Accunza Phase 1 - Core Infrastructure
-- Migration: Initialize core schema for multi-tenant accounting platform
-- Created: 2025-10-21

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Organizations table (tenant isolation root)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT CHECK (subscription_tier IN ('starter', 'pro', 'enterprise')) DEFAULT 'starter',
  subscription_status TEXT CHECK (subscription_status IN ('active', 'trial', 'suspended', 'cancelled')) DEFAULT 'trial',
  fiscal_year_start_month SMALLINT CHECK (fiscal_year_start_month BETWEEN 1 AND 12) DEFAULT 1,
  accounting_basis TEXT CHECK (accounting_basis IN ('accrual', 'cash')) DEFAULT 'accrual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on slug for fast lookup
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);

-- Organization members (multi-tenant access control)
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'accountant', 'staff', 'viewer')) NOT NULL DEFAULT 'staff',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- Create indexes for fast membership lookups
CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_org_members_role ON org_members(role);

-- User profiles (extended user information)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  locale TEXT DEFAULT 'en',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on email for fast lookup
CREATE INDEX idx_profiles_email ON profiles(email);

-- Invitations table (team invite management)
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'accountant', 'staff', 'viewer')) NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for invitations
CREATE INDEX idx_invitations_org_id ON invitations(org_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);

-- Audit logs (immutable audit trail)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for audit log queries
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Organizations RLS policies
CREATE POLICY "Users can view their own organizations"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners and admins can update their organizations"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Only owners can delete organizations"
  ON organizations FOR DELETE
  USING (
    id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Org members RLS policies
CREATE POLICY "Users can view members of their organizations"
  ON org_members FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can add members"
  ON org_members FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update members"
  ON org_members FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can remove members"
  ON org_members FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Profiles RLS policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Invitations RLS policies
CREATE POLICY "Users can view invitations for their organizations"
  ON invitations FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can delete invitations"
  ON invitations FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Audit logs RLS policies
CREATE POLICY "Users can view audit logs for their organizations"
  ON audit_logs FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'accountant')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- No update or delete policies for audit logs (immutable)

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is org member
CREATE OR REPLACE FUNCTION is_org_member(org_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = org_id_param
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role in org
CREATE OR REPLACE FUNCTION has_org_role(org_id_param UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM org_members
  WHERE org_id = org_id_param
  AND user_id = auth.uid();

  RETURN CASE required_role
    WHEN 'owner' THEN user_role = 'owner'
    WHEN 'admin' THEN user_role IN ('owner', 'admin')
    WHEN 'accountant' THEN user_role IN ('owner', 'admin', 'accountant')
    WHEN 'staff' THEN user_role IN ('owner', 'admin', 'accountant', 'staff')
    WHEN 'viewer' THEN user_role IN ('owner', 'admin', 'accountant', 'staff', 'viewer')
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current org_id (from session or context)
CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS UUID AS $$
BEGIN
  -- This will be populated by application context
  -- For now, return the first org the user is a member of
  RETURN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE organizations IS 'Tenant root table - all data is scoped by org_id';
COMMENT ON TABLE org_members IS 'Organization membership and role-based access control';
COMMENT ON TABLE profiles IS 'Extended user profile information';
COMMENT ON TABLE invitations IS 'Team member invitation management';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all sensitive actions';

COMMENT ON FUNCTION is_org_member IS 'Check if current user is a member of specified organization';
COMMENT ON FUNCTION has_org_role IS 'Check if current user has at least the specified role in organization';
COMMENT ON FUNCTION get_current_org_id IS 'Get the current organization ID from session context';
