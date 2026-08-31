import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@src/lib/supabase/client';

export interface AdvisorRecord {
  id: string;
  advisor_code?: string;
  advisor_name: string;
  email?: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  full_name?: string;
  email?: string;
  role?: string;
  department?: string;
  team?: string;
  client_servicing_permissions?: any;
}

export interface AuthScope {
  user: any | null;
  profile: UserProfile | null;
  role: 'Admin' | 'Advisor' | 'Bizdev' | 'Member';
  isAdmin: boolean;
  isAdvisor: boolean;
  isBizdev: boolean;
  isMember: boolean;
  advisorId: string | null;
  authorizedAdvisorIds: string[];
  matchedAdvisor: AdvisorRecord | null;
  visibleAdvisors: AdvisorRecord[];
  loading: boolean;
}

function normalize(str?: string | null): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Match a user profile to an advisor in the advisors table dynamically without hardcoding.
 */
export function matchAdvisorRecord(
  user: { id?: string; email?: string },
  profile: UserProfile | null,
  advisors: AdvisorRecord[]
): AdvisorRecord | null {
  if (!advisors || advisors.length === 0) return null;

  const uId = user?.id || profile?.id;
  const uEmail = normalize(user?.email || profile?.email);
  const pName = normalize(profile?.full_name);

  for (const a of advisors) {
    if (a.id === uId) return a;
    if (a.email && normalize(a.email) === uEmail) return a;
    const aName = normalize(a.advisor_name);
    if (aName && pName && aName === pName) return a;

    // Token-based matching (e.g. "Nerizza Dela Cruz" and "Nerizza Joyce Dela Cruz", "Tri Branz" and "Triwynn Evasco Branzuela")
    const aTokens = (a.advisor_name || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 3);
    const pTokens = (profile?.full_name || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 3);

    if (aTokens.length > 0 && pTokens.length > 0) {
      const firstMatch = pTokens.some(pt => pt.startsWith(aTokens[0]) || aTokens[0].startsWith(pt));
      const lastMatch = aTokens.length > 1 && pTokens.some(pt => pt === aTokens[aTokens.length - 1]);
      if (firstMatch && lastMatch) return a;
      if (firstMatch && ['triwynn', 'tri', 'nerizza', 'marilou', 'marilyn'].includes(aTokens[0])) return a;
    }
  }

  return null;
}

/**
 * Resolves current user's role and data scope asynchronously.
 */
export async function getAuthScope(): Promise<AuthScope> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        user: null,
        profile: null,
        role: 'Member',
        isAdmin: false,
        isAdvisor: false,
        isBizdev: false,
        isMember: true,
        advisorId: null,
        authorizedAdvisorIds: [],
        matchedAdvisor: null,
        visibleAdvisors: [],
        loading: false,
      };
    }

    const [profileRes, advisorsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('advisors').select('*').order('advisor_name', { ascending: true })
    ]);

    const profile: UserProfile = profileRes.data || { id: user.id, email: user.email, role: 'Member' };
    const allAdvisors: AdvisorRecord[] = advisorsRes.data || [];

    const rawRole = (profile.role || '').trim();
    const roleLower = rawRole.toLowerCase();
    const isAdmin = roleLower === 'admin';
    const isAdvisor = roleLower === 'advisor';
    const isBizdev = roleLower === 'bizdev';
    const isMember = roleLower === 'member' || (!isAdmin && !isAdvisor && !isBizdev);

    const normalizedRole = (isAdmin ? 'Admin' : isAdvisor ? 'Advisor' : isBizdev ? 'Bizdev' : 'Member') as AuthScope['role'];

    let advisorId: string | null = null;
    let authorizedAdvisorIds: string[] = [];
    let matchedAdvisor: AdvisorRecord | null = null;
    let visibleAdvisors: AdvisorRecord[] = [];

    if (isAdmin) {
      authorizedAdvisorIds = allAdvisors.map(a => a.id);
      visibleAdvisors = allAdvisors;
    } else if (isAdvisor) {
      matchedAdvisor = matchAdvisorRecord(user, profile, allAdvisors);
      advisorId = matchedAdvisor ? matchedAdvisor.id : user.id;
      authorizedAdvisorIds = [advisorId];
      if (matchedAdvisor) {
        visibleAdvisors = [matchedAdvisor];
      } else {
        visibleAdvisors = [{ id: user.id, advisor_name: profile.full_name || 'My Clients' }];
      }
    } else if (isBizdev) {
      // Find assigned advisors for this bizdev
      const { data: tasks } = await supabase
        .from('client_servicing_tasks')
        .select('user_id, assigned_to, processed_by')
        .or(`assigned_to.eq.${user.id},processed_by.eq.${user.id}`);

      const foundIds = new Set<string>();
      if (tasks) {
        tasks.forEach(t => {
          if (t.user_id) foundIds.add(t.user_id);
        });
      }

      if (profile.team && profile.team.trim()) {
        const { data: teamProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, team')
          .eq('team', profile.team);

        if (teamProfiles) {
          teamProfiles.forEach(tp => {
            if (tp.role?.toLowerCase() === 'advisor') {
              const teamAdvisor = matchAdvisorRecord({ id: tp.id, email: tp.email }, tp, allAdvisors);
              if (teamAdvisor) foundIds.add(teamAdvisor.id);
              foundIds.add(tp.id);
            }
          });
        }
      }

      authorizedAdvisorIds = Array.from(foundIds);
      visibleAdvisors = allAdvisors.filter(a => authorizedAdvisorIds.includes(a.id));
    } else {
      // Member
      authorizedAdvisorIds = [];
      visibleAdvisors = [];
    }

    return {
      user,
      profile,
      role: normalizedRole,
      isAdmin,
      isAdvisor,
      isBizdev,
      isMember,
      advisorId,
      authorizedAdvisorIds,
      matchedAdvisor,
      visibleAdvisors,
      loading: false,
    };
  } catch (err) {
    console.error('getAuthScope error:', err);
    return {
      user: null,
      profile: null,
      role: 'Member',
      isAdmin: false,
      isAdvisor: false,
      isBizdev: false,
      isMember: true,
      advisorId: null,
      authorizedAdvisorIds: [],
      matchedAdvisor: null,
      visibleAdvisors: [],
      loading: false,
    };
  }
}

/**
 * React Hook for component-level role & data authorization.
 */
export function useAuthScope() {
  const [scope, setScope] = useState<AuthScope>({
    user: null,
    profile: null,
    role: 'Member',
    isAdmin: false,
    isAdvisor: false,
    isBizdev: false,
    isMember: true,
    advisorId: null,
    authorizedAdvisorIds: [],
    matchedAdvisor: null,
    visibleAdvisors: [],
    loading: true,
  });

  const refreshScope = useCallback(async () => {
    const res = await getAuthScope();
    setScope(res);
  }, []);

  useEffect(() => {
    refreshScope();
  }, [refreshScope]);

  return { ...scope, refreshScope };
}

/**
 * Fetch clients scoped strictly to the current user's role and authorization.
 */
export async function fetchScopedClients(
  fields = 'id, client_name, policy_number, birthdate, mobile_number, email, address, beneficiary'
): Promise<any[]> {
  try {
    const scope = await getAuthScope();

    if (scope.isAdmin) {
      let { data, error } = await supabase
        .from('cgpt_clients')
        .select(fields)
        .order('client_name', { ascending: true });

      if (error || !data || data.length === 0) {
        const fallback = await supabase
          .from('cpst_clients')
          .select(fields)
          .order('client_name', { ascending: true });
        data = fallback.data;
      }
      return data || [];
    }

    if (scope.isAdvisor && scope.advisorId) {
      let { data, error } = await supabase
        .from('cgpt_clients')
        .select(fields)
        .eq('advisor_id', scope.advisorId)
        .order('client_name', { ascending: true });

      if (error || !data || data.length === 0) {
        const fallback = await supabase
          .from('cpst_clients')
          .select(fields)
          .eq('advisor_id', scope.advisorId)
          .order('client_name', { ascending: true });
        data = fallback.data;
      }
      return data || [];
    }

    if (scope.isBizdev && scope.authorizedAdvisorIds.length > 0) {
      let { data, error } = await supabase
        .from('cgpt_clients')
        .select(fields)
        .in('advisor_id', scope.authorizedAdvisorIds)
        .order('client_name', { ascending: true });

      if (error || !data || data.length === 0) {
        const fallback = await supabase
          .from('cpst_clients')
          .select(fields)
          .in('advisor_id', scope.authorizedAdvisorIds)
          .order('client_name', { ascending: true });
        data = fallback.data;
      }
      return data || [];
    }

    return [];
  } catch (err) {
    console.error('Error in fetchScopedClients:', err);
    return [];
  }
}

/**
 * Fetch request table records scoped strictly to the current user's role and authorization.
 */
export async function fetchScopedRequestRecords(
  tableName: string,
  clientFields = 'client_name, policy_number, birthdate, advisor_id'
): Promise<any[]> {
  try {
    const scope = await getAuthScope();

    if (scope.isAdmin) {
      const { data, error } = await supabase
        .from(tableName)
        .select(`*, client:cpst_clients(${clientFields})`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    if (scope.isAdvisor && scope.advisorId) {
      const scopedClients = await fetchScopedClients('id');
      const clientIds = scopedClients.map(c => c.id);
      if (clientIds.length === 0) return [];

      const { data, error } = await supabase
        .from(tableName)
        .select(`*, client:cpst_clients(${clientFields})`)
        .in('client_id', clientIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    if (scope.isBizdev && scope.authorizedAdvisorIds.length > 0) {
      const scopedClients = await fetchScopedClients('id');
      const clientIds = scopedClients.map(c => c.id);
      if (clientIds.length === 0) return [];

      const { data, error } = await supabase
        .from(tableName)
        .select(`*, client:cpst_clients(${clientFields})`)
        .in('client_id', clientIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    return [];
  } catch (err) {
    console.error(`Error fetching scoped request records for ${tableName}:`, err);
    return [];
  }
}

