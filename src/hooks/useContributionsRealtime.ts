import { useEffect } from 'react';

import { getSupabaseClient, isSupabaseConfigured } from '@/src/lib/supabase';
import { useAppStore } from '@/src/store';
import type { Contribution } from '@/src/types';

/**
 * Realtime sketch for `public.contributions`.
 * No-op when EXPO_PUBLIC_SUPABASE_URL / ANON_KEY are missing (default local demo).
 */
export function useContributionsRealtime(groupId: string | undefined): void {
  const ingestContribution = useAppStore((s) => s.ingestContribution);

  useEffect(() => {
    if (!groupId || !isSupabaseConfigured()) return;

    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel(`contrib:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contributions',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown> | undefined;
          if (!row?.id) return;
          const contribution: Contribution = {
            id: String(row.id),
            groupId: String(row.group_id ?? groupId),
            userId: String(row.user_id ?? ''),
            amountCents: Number(row.amount_cents) || 0,
            note: row.note == null ? null : String(row.note),
            createdAt: String(row.created_at ?? new Date().toISOString()),
          };
          ingestContribution(contribution);
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [groupId, ingestContribution]);
}
