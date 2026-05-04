import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";

export function useRealtime() {
    const currentChannel = useStore((s) => s.currentChannel);
    const prependPost = useStore((s) => s.prependPost);
    const channelRef = useRef(null);

    const user = useStore((s) => s.user);
    const activeDMRecipient = useStore((s) => s.activeDMRecipient);
    const prependDMPost = useStore((s) => s.prependDMPost);
    const dmChannelRef = useRef(null);

    // Channel Subscription
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

    // DM Subscription
    useEffect(() => {
        if (dmChannelRef.current) {
            supabase.removeChannel(dmChannelRef.current);
        }

        if (!user || !activeDMRecipient) return;

        const ids = [user.id, activeDMRecipient.uid].sort();
        const dmChannel = `dm_${ids[0]}_${ids[1]}`;

        dmChannelRef.current = supabase
            .channel("dm-" + dmChannel)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "posts",
                    filter: `channel=eq.${dmChannel}`,
                },
                (payload) => prependDMPost(payload.new)
            )
            .subscribe();

        return () => {
            if (dmChannelRef.current) {
                supabase.removeChannel(dmChannelRef.current);
            }
        };
    }, [user, activeDMRecipient, prependDMPost]);
}