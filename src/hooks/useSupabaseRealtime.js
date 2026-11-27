import { useEffect, useContext } from 'react';
import { QueryClientContext } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export function useSupabaseRealtime(queryClient) {
    const contextClient = useContext(QueryClientContext);
    const client = queryClient || contextClient;
    
    useEffect(() => {
        if (!supabase || !client) return;

        const channel = supabase.channel('simdesta-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public'
                },
                () => {
                    client.invalidateQueries();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, client]);
}

export function SupabaseRealtimeSync() {
    useSupabaseRealtime();
    return null;
}