-- Create RPC function for Admin Global Search across 4 levels:
-- Level 1: CPST Clients
-- Level 2: Client Servicing Requests
-- Level 3: Activities
-- Level 4: Tasks

CREATE OR REPLACE FUNCTION public.search_admin(query text)
RETURNS TABLE (
  id text,
  label text,
  subtitle text,
  type text,
  href text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  search_term text;
BEGIN
  IF query IS NULL OR trim(query) = '' THEN
    RETURN;
  END IF;

  search_term := '%' || trim(query) || '%';

  RETURN QUERY
  -- LEVEL 1: CPST Clients
  SELECT 
    c.id::text AS id,
    c.client_name AS label,
    COALESCE('Advisor: ' || c.advisor, 'CPST Client') AS subtitle,
    'CPST Client' AS type,
    '/admin/cpst' AS href
  FROM public.clients c
  WHERE c.client_name ILIKE search_term OR c.advisor ILIKE search_term OR c.policy_number ILIKE search_term

  UNION ALL

  -- LEVEL 2: Client Servicing Requests
  SELECT 
    a.id::text AS id,
    a.client_name AS label,
    'ACR — ' || COALESCE(a.status, 'Pending') AS subtitle,
    'Request' AS type,
    '/admin/acr' AS href
  FROM public.acr_requests a
  WHERE a.client_name ILIKE search_term

  UNION ALL

  SELECT 
    b.id::text AS id,
    b.client_name AS label,
    'BCR — ' || COALESCE(b.status, 'Pending') AS subtitle,
    'Request' AS type,
    '/admin/cpc' AS href
  FROM public.cpc_records b
  WHERE b.client_name ILIKE search_term

  UNION ALL

  SELECT 
    f.id::text AS id,
    f.client_name AS label,
    'FSR — ' || COALESCE(f.status, 'Pending') AS subtitle,
    'Request' AS type,
    '/admin/fst' AS href
  FROM public.fst_requests f
  WHERE f.client_name ILIKE search_term

  UNION ALL

  SELECT 
    m.id::text AS id,
    m.client_name AS label,
    'FWR — ' || COALESCE(m.status, 'Pending') AS subtitle,
    'Request' AS type,
    '/admin/mngt' AS href
  FROM public.mngt_records m
  WHERE m.client_name ILIKE search_term

  UNION ALL

  SELECT 
    p.id::text AS id,
    p.client_name AS label,
    'ACA — ' || COALESCE(p.status, 'Pending') AS subtitle,
    'Request' AS type,
    '/admin/ppu' AS href
  FROM public.ppu_records p
  WHERE p.client_name ILIKE search_term

  UNION ALL

  -- LEVEL 3: Activities
  SELECT 
    ce.id::text AS id,
    ce.title AS label,
    COALESCE(ce.location, 'Calendar Activity') AS subtitle,
    'Activity' AS type,
    '/admin/calendar' AS href
  FROM public.calendar_events ce
  WHERE ce.title ILIKE search_term OR ce.location ILIKE search_term

  UNION ALL

  -- LEVEL 4: Tasks
  SELECT 
    cst.id::text AS id,
    cst.title AS label,
    'Task — ' || COALESCE(cst.status, 'Pending') AS subtitle,
    'Task' AS type,
    '/admin/dashboard' AS href
  FROM public.client_servicing_tasks cst
  WHERE cst.title ILIKE search_term OR cst.description ILIKE search_term

  UNION ALL

  SELECT 
    tt.id::text AS id,
    tt.title AS label,
    'To-do Item' AS subtitle,
    'Task' AS type,
    '/admin/dashboard' AS href
  FROM public.todo_tasks tt
  WHERE tt.title ILIKE search_term OR tt.description ILIKE search_term

  LIMIT 25;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_admin(text) TO authenticated, anon;
