import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRole, type AppRole } from '@/hooks/useAdminRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  Search,
  RefreshCw,
  Crown,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface UserWithRoles {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  roles: AppRole[];
}

interface RoleAssignment {
  id: string;
  user_id: string;
  role: AppRole;
  granted_at: string;
  granted_by: string;
}

const ROLE_CONFIG: Record<AppRole, { label: string; color: string; description: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-red-500', description: 'Full system access' },
  admin: { label: 'Admin', color: 'bg-purple-500', description: 'Administrative access' },
  moderator: { label: 'Moderator', color: 'bg-blue-500', description: 'Content moderation' },
  finance: { label: 'Finance', color: 'bg-green-500', description: 'Financial operations' },
  operations: { label: 'Operations', color: 'bg-orange-500', description: 'Platform operations' },
  support: { label: 'Support', color: 'bg-cyan-500', description: 'Customer support' },
  analyst: { label: 'Analyst', color: 'bg-indigo-500', description: 'Analytics & reporting' },
  user: { label: 'User', color: 'bg-gray-500', description: 'Regular user' },
};

export function RoleManagement() {
  const { isAdmin } = useAdminRole();
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');
  const [users, setUsers] = useState<{ user_id: string; full_name: string; email: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch role assignments
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('granted_at', { ascending: false });

      if (rolesError) throw rolesError;
      setRoleAssignments(roles || []);

      // Fetch users for dropdown
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .order('full_name');

      if (profilesError) throw profilesError;
      setUsers(profiles || []);
    } catch (error) {
      console.error('Error loading role data:', error);
      toast.error('Failed to load role assignments');
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async () => {
    if (!selectedUserId || !selectedRole) {
      toast.error('Please select a user and role');
      return;
    }

    // Check if user already has this role
    const existingRole = roleAssignments.find(
      ra => ra.user_id === selectedUserId && ra.role === selectedRole
    );
    if (existingRole) {
      toast.error('User already has this role');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('user_roles').insert({
        user_id: selectedUserId,
        role: selectedRole,
      });

      if (error) throw error;

      toast.success('Role assigned successfully');
      setSelectedUserId('');
      setSelectedRole('');
      loadData();
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast.error(error.message || 'Failed to assign role');
    } finally {
      setSaving(false);
    }
  };

  const removeRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to remove the ${roleName} role?`)) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast.success('Role removed successfully');
      loadData();
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast.error(error.message || 'Failed to remove role');
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user?.full_name || 'Unknown User';
  };

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user?.email || '';
  };

  const filteredAssignments = roleAssignments.filter(ra => {
    const userName = getUserName(ra.user_id).toLowerCase();
    const userEmail = getUserEmail(ra.user_id).toLowerCase();
    const term = searchTerm.toLowerCase();
    return userName.includes(term) || userEmail.includes(term) || ra.role.includes(term);
  });

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">Access Restricted</h3>
          <p className="text-sm text-muted-foreground">
            Only administrators can manage roles.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Role Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Assign and manage admin roles for platform users
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadData}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Assign New Role */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign New Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_CONFIG)
                  .filter(([key]) => key !== 'user')
                  .map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${config.color}`} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Button onClick={assignRole} disabled={saving || !selectedUserId || !selectedRole}>
              {saving ? 'Assigning...' : 'Assign Role'}
            </Button>
          </div>

          {selectedRole && ROLE_CONFIG[selectedRole as AppRole] && (
            <p className="text-sm text-muted-foreground mt-2">
              {ROLE_CONFIG[selectedRole as AppRole].description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Role Assignments</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No role assignments found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getUserName(assignment.user_id)}</p>
                        <p className="text-sm text-muted-foreground">{getUserEmail(assignment.user_id)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${ROLE_CONFIG[assignment.role]?.color}/10 text-${ROLE_CONFIG[assignment.role]?.color.replace('bg-', '')} border-${ROLE_CONFIG[assignment.role]?.color.replace('bg-', '')}/20`}>
                        {ROLE_CONFIG[assignment.role]?.label || assignment.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(assignment.granted_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeRole(assignment.id, ROLE_CONFIG[assignment.role]?.label || assignment.role)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Role Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(ROLE_CONFIG)
              .filter(([key]) => key !== 'user')
              .map(([key, config]) => (
                <div key={key} className="flex items-center gap-2 p-2 border rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${config.color}`} />
                  <div>
                    <p className="font-medium text-sm">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
