import { TaskItem } from '@src/features/dashboard/components/TaskRow';
import { CalendarActivityItem } from '@src/features/dashboard/components/CalendarActivityCard';
import { BirthdayItem } from '@src/features/dashboard/components/BirthdayCard';

export const formatUiTaskToDbUpdates = (updates: Partial<TaskItem>, currentTask?: TaskItem) => {
  const dbUpdates: any = {};

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.updated_at !== undefined) dbUpdates.updated_at = updates.updated_at;

  if (updates.completed !== undefined) {
    dbUpdates.status = updates.completed ? 'Done' : (updates.status || (currentTask?.status === 'Done' ? 'Pending' : currentTask?.status) || 'Pending');
  }

  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.assigned_to !== undefined) dbUpdates.assigned_to = updates.assigned_to;
  if (updates.processed_by !== undefined) dbUpdates.processed_by = updates.processed_by;

  return dbUpdates;
};

export const mapDbTaskToUiTask = (
  t: any,
  sourceTable?: 'client_servicing_tasks' | 'tasks'
): TaskItem => {
  let notes = t.notes || '';
  let category = t.category || 'Others';
  let assigned_to = t.assigned_to || null;
  let processed_by = t.processed_by || null;

  try {
    const rawJsonString = t.description || (t.notes && t.notes.trim().startsWith('{') ? t.notes : null);
    if (rawJsonString && rawJsonString.trim().startsWith('{')) {
      const parsed = JSON.parse(rawJsonString);
      if (!notes || notes === rawJsonString) notes = parsed.notes || '';
      if (category === 'Others') category = parsed.category || 'Others';
      if (!assigned_to) assigned_to = parsed.assigned_to || null;
      if (!processed_by) processed_by = parsed.processed_by || null;
    } else if (t.description && (!notes || notes === t.description)) {
      notes = t.description;
    }
  } catch (e) {
    if (t.description && (!notes || notes === t.description)) {
      notes = t.description;
    }
  }

  return {
    id: t.id,
    title: t.title || 'Untitled Task',
    notes,
    category,
    status: t.status || 'Pending',
    completed: t.status === 'Done',
    assigned_to,
    processed_by,
    created_at: t.created_at,
    updated_at: t.updated_at,
    _sourceTable: sourceTable,
  };
};

export const mapDbTaskToCalendarActivity = (
  t: any,
  sourceTable?: 'client_servicing_tasks' | 'tasks'
): CalendarActivityItem => {
  let parsed: any = {};
  try {
    const rawJsonString = t.description || (t.notes && t.notes.trim().startsWith('{') ? t.notes : null);
    if (rawJsonString && rawJsonString.trim().startsWith('{')) {
      parsed = JSON.parse(rawJsonString);
    }
  } catch (e) { }

  const act = parsed.activityData || {};
  return {
    id: t.id,
    title: t.title || 'Untitled Activity',
    date: act.date || t.created_at?.split('T')[0] || '',
    time: act.time,
    mode: act.mode || 'Online',
    location: act.location || '',
    category: parsed.category || 'Others',
    assignedRole: act.assignedRole || 'Advisor',
    notes: parsed.notes,
    createdAt: t.created_at || new Date().toISOString(),
    _sourceTable: sourceTable,
    onlinePlatform: act.onlinePlatform,
    onlineMeetingLink: act.onlineMeetingLink,
    meeting_link_raw: act.meeting_link_raw,
    onlineMeetingId: act.onlineMeetingId,
    onlinePasscode: act.onlinePasscode,
    onsiteVenue: act.onsiteVenue || act.venue_name,
    venue_name: act.venue_name || act.onsiteVenue,
    venue_address: act.venue_address,
    venue_place_id: act.venue_place_id,
    venue_lat: act.venue_lat ?? act.latitude,
    venue_lng: act.venue_lng ?? act.longitude,
    venue_maps_url: act.venue_maps_url || act.googleMapsUrl,
    onsiteBuilding: act.onsiteBuilding,
    onsiteStreet: act.onsiteStreet,
    onsiteBarangay: act.onsiteBarangay,
    onsiteCity: act.onsiteCity,
    onsiteProvince: act.onsiteProvince,
    onsiteZip: act.onsiteZip,
    onsiteIslandGroup: act.onsiteIslandGroup,
    onsiteRegion: act.onsiteRegion,
    region: act.region,
    latitude: act.latitude ?? act.venue_lat,
    longitude: act.longitude ?? act.venue_lng,
    googleMapsUrl: act.googleMapsUrl || act.venue_maps_url
  };
};

export function parseFlexDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const s = String(val).trim();
  if (!s) return null;

  const d1 = new Date(s);
  if (!isNaN(d1.getTime())) return d1;

  const parts = s.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const p3 = parseInt(parts[2], 10);
    if (p1 > 0 && p2 > 0 && p3 > 1900) {
      const d2 = new Date(p3, p1 - 1, p2);
      if (!isNaN(d2.getTime())) return d2;
    }
  }

  return null;
}

function extractAdvisor(client: any): { advisorId?: string; advisorName?: string } {
  const advisorObj = Array.isArray(client.advisor) ? client.advisor[0] : client.advisor;
  return {
    advisorId: client.advisor_id || advisorObj?.id || undefined,
    advisorName: advisorObj?.advisor_name || undefined,
  };
}

export function getBirthdaysAroundNow(clients: any[]): BirthdayItem[] {
  const now = new Date();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const getMonthDayStr = (d: Date) => {
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${m}-${day}`;
  };

  const yesterdayStr = getMonthDayStr(yesterday);
  const todayStr = getMonthDayStr(now);
  const tomorrowStr = getMonthDayStr(tomorrow);

  const matched: BirthdayItem[] = [];

  if (clients && Array.isArray(clients)) {
    for (const client of clients) {
      const bdateVal = client.birthdate || client.birth_date || client.dob || client.birthday;
      if (!bdateVal) continue;

      const bDate = parseFlexDate(bdateVal);
      if (!bDate) continue;

      const bStr = getMonthDayStr(bDate);

      let when: 'today' | 'yesterday' | 'tomorrow' | null = null;
      const labelDate = bDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (bStr === todayStr) {
        when = 'today';
      } else if (bStr === yesterdayStr) {
        when = 'yesterday';
      } else if (bStr === tomorrowStr) {
        when = 'tomorrow';
      }

      if (when) {
        let age: number | undefined;
        if (bDate) {
          const birthYear = bDate.getFullYear();
          const currentYear = now.getFullYear();
          if (birthYear > 1900 && birthYear <= currentYear) {
            age = currentYear - birthYear;
          }
        }

        const { advisorId, advisorName } = extractAdvisor(client);

        matched.push({
          id: String(client.id || crypto.randomUUID()),
          name: client.client_name || client.name || 'Client',
          date: labelDate,
          when,
          age,
          advisorId: advisorId ?? '',
          advisorName: advisorName ?? '',
        });
      }
    }
  }

  const priority: Record<string, number> = { yesterday: 0, today: 1, tomorrow: 2 };
  matched.sort((a, b) => (priority[a.when] ?? 99) - (priority[b.when] ?? 99));

  return matched;
}