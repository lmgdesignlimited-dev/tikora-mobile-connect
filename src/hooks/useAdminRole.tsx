import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type AppRole = 'admin' | 'moderator' | 'analyst' | 'user';

interface UseAdminRoleReturn {
  roles: AppRole[];
  isAdmin: boolean;
  isModerator: boolean;
  isAnalyst: boolean;
  hasAnyAdminRole: boolean;
  loading: boolean;
  checkRole: (role: AppRole) => boolean;
  refetch: () => Promise<void>;
  bootstrapAdmin: () => Promise<boolean>;
}

export function useAdminRole(): UseAdminRoleReturn {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_roles', { _user_id: user.id });

      if (error) {
        console.error('Error fetching roles:', error);
        setRoles([]);
      } else {
        setRoles(data || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const bootstrapAdmin = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('bootstrap_first_admin');
      if (error) {
        console.error('Bootstrap admin error:', error);
        return false;
      }
      if (data) {
        await fetchRoles();
      }
      return data || false;
    } catch (error) {
      console.error('Bootstrap admin error:', error);
      return false;
    }
  }, [user, fetchRoles]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const checkRole = useCallback((role: AppRole) => {
    return roles.includes(role);
  }, [roles]);

  const isAdmin = roles.includes('admin');
  const isModerator = roles.includes('moderator');
  const isAnalyst = roles.includes('analyst');
  const hasAnyAdminRole = isAdmin || isModerator || isAnalyst;

  return {
    roles,
    isAdmin,
    isModerator,
    isAnalyst,
    hasAnyAdminRole,
    loading,
    checkRole,
    refetch: fetchRoles,
    bootstrapAdmin,
  };
}
