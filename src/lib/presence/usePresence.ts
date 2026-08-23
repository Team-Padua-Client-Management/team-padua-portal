'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@src/lib/supabase/client';

export interface PresencePayload {
  user_id: string;
  online_at: string;
}

export function formatLastSeen(timestamp?: string | null): string {
  if (!timestamp) return 'Offline';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Offline';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'Active now';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return 'Active now';
  if (diffMin <= 1) return 'Last seen 1 min ago';
  if (diffMin < 60) return `Last seen ${diffMin} mins ago`;
  if (diffHours === 1) return 'Last seen 1 hour ago';
  if (diffHours < 24) return `Last seen ${diffHours} hours ago`;
  if (diffDays === 1) return 'Last seen yesterday';
  if (diffDays < 7) return `Last seen ${diffDays} days ago`;

  return `Last seen ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export function usePresence(currentUserId?: string) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [isReady, setIsReady] = useState(false);
  const channelRef = useRef<any>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateHeartbeat = useCallback(async () => {
    if (!currentUserId) return;
    try {
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', currentUserId);
    } catch {
      // Best-effort heartbeat update
    }
  }, [currentUserId]);

  useEffect(() => {
    const channelName = 'presence:members-global';
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUserId || 'anonymous-' + Math.random().toString(36).slice(2, 7),
        },
      },
    });

    channelRef.current = channel;

    const syncPresenceState = () => {
      const state = channel.presenceState<PresencePayload>();
      const onlineIds = new Set<string>();

      Object.keys(state).forEach((key) => {
        const presences = state[key];
        if (presences && presences.length > 0) {
          presences.forEach((p) => {
            if (p.user_id) onlineIds.add(p.user_id);
            else if (!key.startsWith('anonymous-')) onlineIds.add(key);
          });
        }
      });

      if (currentUserId) {
        onlineIds.add(currentUserId);
      }

      setOnlineUserIds(onlineIds);
      setIsReady(true);
    };

    let isSubscribed = false;
    channel
      .on('presence', { event: 'sync' }, () => {
        syncPresenceState();
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          if (key && !key.startsWith('anonymous-')) next.add(key);
          newPresences?.forEach((p: any) => {
            if (p?.user_id) next.add(p.user_id);
          });
          return next;
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        syncPresenceState();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribed = true;
          if (currentUserId) {
            await channel.track({
              user_id: currentUserId,
              online_at: new Date().toISOString(),
            });
            updateHeartbeat();
          }
          syncPresenceState();
        }
      });

    // Heartbeat every 60 seconds
    if (currentUserId) {
      heartbeatTimerRef.current = setInterval(() => {
        updateHeartbeat();
        if (channelRef.current && isSubscribed) {
          channelRef.current.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      }, 60000);
    }

    const handleBeforeUnload = () => {
      if (channelRef.current) {
        channelRef.current.untrack();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [currentUserId, updateHeartbeat]);

  const isUserOnline = useCallback(
    (userId: string) => {
      if (!userId) return false;
      if (currentUserId && userId === currentUserId) return true;
      return onlineUserIds.has(userId);
    },
    [onlineUserIds, currentUserId]
  );

  return {
    onlineUserIds,
    isUserOnline,
    isReady,
    formatLastSeen,
  };
}
