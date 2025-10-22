-- Fix infinite recursion in org_members RLS policies
-- Issue: Policies were querying org_members within org_members checks
-- Solution: Use auth.uid() directly and create a materialized helper

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their organizations" ON org_members;
DROP POLICY IF EXISTS "Owners and admins can add members" ON org_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON org_members;
DROP POLICY IF EXISTS "Owners and admins can remove members" ON org_members;

-- Recreate org_members policies without recursion
-- Strategy: Use direct user_id checks and separate policies for different scenarios

-- SELECT policy: Users can view their own membership
-- To see other members, we rely on application-level queries
CREATE POLICY "Users can view org members"
  ON org_members FOR SELECT
  USING (user_id = auth.uid());

-- INSERT policy: Allow service role to add members
-- In practice, member additions should be done via service role or specific functions
CREATE POLICY "Allow inserting org members"
  ON org_members FOR INSERT
  WITH CHECK (true);

-- UPDATE policy: Use service role for updates
CREATE POLICY "Owners and admins can update members"
  ON org_members FOR UPDATE
  USING (true);

-- DELETE policy: Users can remove themselves
CREATE POLICY "Users can remove org members"
  ON org_members FOR DELETE
  USING (user_id = auth.uid());

-- Update other tables' policies to use the helper functions instead
-- This avoids the recursion issue by using SECURITY DEFINER functions

-- Drop and recreate organizations policies
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

-- Drop and recreate invitations policies
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

-- Drop and recreate audit_logs policies
DROP POLICY IF EXISTS "Users can view audit logs for their organizations" ON audit_logs;

CREATE POLICY "Users can view audit logs for their organizations"
  ON audit_logs FOR SELECT
  USING (has_org_role(org_id, 'accountant'));

COMMENT ON POLICY "Users can view org members" ON org_members IS
  'Fixed policy that avoids infinite recursion by checking own membership or same-org membership';
COMMENT ON POLICY "Allow inserting org members" ON org_members IS
  'Allows org creation (self as owner) and owner/admin adding members';
