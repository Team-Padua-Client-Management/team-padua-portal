import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@src/lib/supabase/client';

export interface SearchResultItem {
  id: string;
  label: string;
  subtitle: string;
  type: 'CPST Client' | 'Request' | 'Activity' | 'Task' | string;
  href: string;
}

export interface GroupedSearchResults {
  clients: SearchResultItem[];
  requests: SearchResultItem[];
  activities: SearchResultItem[];
  tasks: SearchResultItem[];
  others: SearchResultItem[];
}

export function useAdminSearch(delayMs: number = 300) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // 300ms debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, delayMs);

    return () => clearTimeout(handler);
  }, [query, delayMs]);

  // Execute search query when debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setIsError(false);

    const performSearch = async () => {
      try {
        const { data, error } = await supabase.rpc('search_admin', {
          query: debouncedQuery,
        });

        if (!isMounted) return;

        if (!error && data && data.length > 0) {
          setResults(data as SearchResultItem[]);
          return;
        }

        // Fallback: Direct Supabase Queries if RPC unavailable or empty
        const fallbackResults: SearchResultItem[] = [];
        const term = `%${debouncedQuery}%`;

        // Level 1: CPST Clients
        const { data: clientsData } = await supabase
          .from('cpst_clients')
          .select('id, client_name, name, advisor')
          .or(`client_name.ilike.${term},name.ilike.${term},advisor.ilike.${term}`)
          .limit(6);

        if (clientsData) {
          clientsData.forEach((c: any) => {
            fallbackResults.push({
              id: c.id,
              label: c.client_name || c.name || 'CPST Client',
              subtitle: c.advisor ? `Advisor: ${c.advisor}` : 'CPST Client',
              type: 'CPST Client',
              href: '/admin/cpst',
            });
          });
        }

        // Level 2: Client Servicing Requests (ACR, CPC/BCR, FST, MNGT/FWR, PPU/ACA)
        const { data: acrData } = await supabase
          .from('acr_requests')
          .select('id, client_name, status')
          .ilike('client_name', term)
          .limit(4);

        if (acrData) {
          acrData.forEach((r: any) => {
            fallbackResults.push({
              id: r.id,
              label: r.client_name || 'ACR Client',
              subtitle: `ACR — ${r.status || 'Pending'}`,
              type: 'Request',
              href: '/admin/acr',
            });
          });
        }

        const { data: cpcData } = await supabase
          .from('cpc_records')
          .select('id, client_name, status')
          .ilike('client_name', term)
          .limit(4);

        if (cpcData) {
          cpcData.forEach((r: any) => {
            fallbackResults.push({
              id: r.id,
              label: r.client_name || 'BCR Client',
              subtitle: `BCR — ${r.status || 'Pending'}`,
              type: 'Request',
              href: '/admin/cpc',
            });
          });
        }

        // Level 3: Activities
        const { data: calData } = await supabase
          .from('calendar_events')
          .select('id, title, location_name')
          .or(`title.ilike.${term},location_name.ilike.${term}`)
          .limit(4);

        if (calData) {
          calData.forEach((e: any) => {
            fallbackResults.push({
              id: e.id,
              label: e.title || 'Activity',
              subtitle: e.location_name || 'Calendar Activity',
              type: 'Activity',
              href: '/admin/calendar',
            });
          });
        }

        // Level 4: Tasks & To-dos
        const { data: tasksData } = await supabase
          .from('client_servicing_tasks')
          .select('id, title, status')
          .ilike('title', term)
          .limit(4);

        if (tasksData) {
          tasksData.forEach((t: any) => {
            fallbackResults.push({
              id: t.id,
              label: t.title || 'Task',
              subtitle: `Task — ${t.status || 'Pending'}`,
              type: 'Task',
              href: '/admin/dashboard',
            });
          });
        }

        const { data: todoData } = await supabase
          .from('todo_tasks')
          .select('id, title')
          .ilike('title', term)
          .limit(4);

        if (todoData) {
          todoData.forEach((t: any) => {
            fallbackResults.push({
              id: t.id,
              label: t.title || 'To-do',
              subtitle: 'To-do Item',
              type: 'Task',
              href: '/admin/dashboard',
            });
          });
        }

        if (!isMounted) return;
        setResults(fallbackResults);
      } catch (err) {
        if (!isMounted) return;
        console.error('Exception in performSearch:', err);
        setIsError(true);
        setResults([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    performSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Group search results cleanly by category
  const groupedResults = useMemo<GroupedSearchResults>(() => {
    const grouped: GroupedSearchResults = {
      clients: [],
      requests: [],
      activities: [],
      tasks: [],
      others: [],
    };

    results.forEach((item) => {
      switch (item.type) {
        case 'CPST Client':
          grouped.clients.push(item);
          break;
        case 'Request':
          grouped.requests.push(item);
          break;
        case 'Activity':
          grouped.activities.push(item);
          break;
        case 'Task':
          grouped.tasks.push(item);
          break;
        default:
          grouped.others.push(item);
          break;
      }
    });

    return grouped;
  }, [results]);

  return {
    query,
    setQuery,
    results,
    groupedResults,
    isLoading,
    isError,
    hasResults: results.length > 0,
  };
}

export default useAdminSearch;
