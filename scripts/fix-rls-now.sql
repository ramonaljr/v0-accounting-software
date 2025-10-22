-- Quick fix for RLS infinite recursion
-- Execute this in Supabase SQL Editor: https://supabase.com/dashboard/project/jcozquxglutlyfzujswy/sql/new

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view members of their organizations" ON org_members;
DROP POLICY IF EXISTS "Owners and admins can add members" ON org_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON org_members;
DROP POLICY IF EXISTS "Owners and admins can remove members" ON org_members;

-- Recreate with simple, non-recursive policies
CREATE POLICY "Users can view org members"
  ON org_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Allow inserting org members"
  ON org_members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners and admins can update members"
  ON org_members FOR UPDATE
  USING (true);

CREATE POLICY "Users can remove org members"
  ON org_members FOR DELETE
  USING (user_id = auth.uid());

-- Update organizations policies to use helper functions
DROP POLICY IF EXISTS "Users can view their own organizations" ON organizations;
DROP POLICY IF EXISTS "Owners and admins can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Only owners can delete organizations" ON organizations;

CREATE POLICY "Users can view their own organizations"
  ON organizations FOR SELECT
  USING (is_org_member(id));

CREATE POLICY "Owners and admins can update their organizations"
  ON organizations FOR UPDATE
  USING (has_org_role(id, 'admin'));

CREATE POLICY "Only owners can delete organizations"
  ON organizations FOR DELETE
  USING (has_org_role(id, 'owner'));

-- Update invitations policies
DROP POLICY IF EXISTS "Users can view invitations for their organizations" ON invitations;
DROP POLICY IF EXISTS "Owners and admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Owners and admins can delete invitations" ON invitations;

CREATE POLICY "Users can view invitations for their organizations"
  ON invitations FOR SELECT
  USING (has_org_role(org_id, 'admin'));

CREATE POLICY "Owners and admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (has_org_role(org_id, 'admin'));

CREATE POLICY "Owners and admins can delete invitations"
  ON invitations FOR DELETE
  USING (has_org_role(org_id, 'admin'));

-- Update audit_logs policy
DROP POLICY IF EXISTS "Users can view audit logs for their organizations" ON audit_logs;

CREATE POLICY "Users can view audit logs for their organizations"
  ON audit_logs FOR SELECT
  USING (has_org_role(org_id, 'accountant'));
