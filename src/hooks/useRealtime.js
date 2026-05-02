import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";

export function useRealtime() {
    const currentChannel = useStore((s) => s.currentChannel);
    const prependPost = useStore((s) => s.prependPost);
    const channelRef = useRef(null);

    useEffect(() => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        channelRef.current = supabase
            .channel("channel-" + currentChannel)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "posts",
                    filter: `channel=eq.${currentChannel}`,
                },
                (payload) => prependPost(payload.new)
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [currentChannel, prependPost]);
}