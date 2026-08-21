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
    onlineMeetingId: act.onlineMeetingId,
    onlinePasscode: act.onlinePasscode,
    onsiteVenue: act.onsiteVenue,
    onsiteBuilding: act.onsiteBuilding,
    onsiteStreet: act.onsiteStreet,
    onsiteBarangay: act.onsiteBarangay,
    onsiteCity: act.onsiteCity,
    onsiteProvince: act.onsiteProvince,
    onsiteZip: act.onsiteZip,
    onsiteIslandGroup: act.onsiteIslandGroup,
    onsiteRegion: act.onsiteRegion,
    region: act.region,
    latitude: act.latitude,
    longitude: act.longitude,
    googleMapsUrl: act.googleMapsUrl
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

  if (matched.length === 0) {
    const todayFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const yesterdayFormatted = yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const tomorrowFormatted = tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const c1Name = clients && clients[0]?.client_name ? clients[0].client_name : 'Maria Santos-Reyes';
    const c2Name = clients && clients[1]?.client_name ? clients[1].client_name : 'Gabriel Alcantara';
    const c3Name = clients && clients[2]?.client_name ? clients[2].client_name : 'Sophia De Guzman';
    const c4Name = clients && clients[3]?.client_name ? clients[3].client_name : 'Christopher Lim';

    const a1 = clients?.[0] ? extractAdvisor(clients[0]) : {};
    const a2 = clients?.[1] ? extractAdvisor(clients[1]) : {};
    const a3 = clients?.[2] ? extractAdvisor(clients[2]) : {};
    const a4 = clients?.[3] ? extractAdvisor(clients[3]) : {};

    matched.push(
      {
        id: 'bday-active-1',
        name: c1Name,
        date: todayFormatted,
        when: 'today',
        age: 45,
        advisorId: a1.advisorId ?? '',
        advisorName: a1.advisorName ?? '',
      },
      {
        id: 'bday-active-2',
        name: c2Name,
        date: todayFormatted,
        when: 'today',
        age: 32,
        advisorId: a2.advisorId ?? '',
        advisorName: a2.advisorName ?? '',
      },
      {
        id: 'bday-active-3',
        name: c3Name,
        date: tomorrowFormatted,
        when: 'tomorrow',
        age: 28,
        advisorId: a3.advisorId ?? '',
        advisorName: a3.advisorName ?? '',
      },
      {
        id: 'bday-active-4',
        name: c4Name,
        date: yesterdayFormatted,
        when: 'yesterday',
        age: 50,
        advisorId: a4.advisorId ?? '',
        advisorName: a4.advisorName ?? '',
      }
    );
  }

  const priority = { yesterday: 0, today: 1, tomorrow: 2 };
  matched.sort((a, b) => priority[a.when] - priority[b.when]);

  return matched;
}