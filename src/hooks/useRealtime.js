import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { playBlip } from "@/lib/audio";

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
                (payload) => {
                    prependPost(payload.new);
                    if (payload.new.user_id !== user?.id) playBlip();
                }
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
                (payload) => {
                    prependDMPost(payload.new);
                    if (payload.new.user_id !== user?.id) playBlip();
                }
            )
            .subscribe();

        return () => {
            if (dmChannelRef.current) {
                supabase.removeChannel(dmChannelRef.current);
            }
        };
    }, [user, activeDMRecipient, prependDMPost]);

    // Presence Subscription
    const setOnlineUsers = useStore((s) => s.setOnlineUsers);
    const nickname = useStore((s) => s.nickname);

    useEffect(() => {
        if (!user) return;

        const presenceChannel = supabase.channel("global_presence");

        presenceChannel
            .on("presence", { event: "sync" }, () => {
                const state = presenceChannel.presenceState();
                const onlineObj = {};
                for (const id in state) {
                    if (state[id].length > 0) {
                        const presenceData = state[id][0];
                        onlineObj[presenceData.uid] = presenceData;
                    }
                }
                setOnlineUsers(onlineObj);
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await presenceChannel.track({
                        uid: user.id,
                        channel: currentChannel,
                        nickname: nickname
                    });
                }
            });

        return () => {
            presenceChannel.untrack();
            supabase.removeChannel(presenceChannel);
        };
    }, [user, currentChannel, nickname, setOnlineUsers]);
}