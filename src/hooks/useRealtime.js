import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { playBlip } from "@/lib/audio";

export function useRealtime() {
    const currentChannel = useStore((s) => s.currentChannel);
    const prependPost = useStore((s) => s.prependPost);
    const addSystemMessage = useStore((s) => s.addSystemMessage);
    const user = useStore((s) => s.user);
    const channelRef = useRef(null);

    // Channel Messages Subscription
    useEffect(() => {
        if (!user) return;

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channelName = "channel-" + currentChannel;
        channelRef.current = supabase
            .channel(channelName)
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
                    if (payload.new.user_id !== user?.id) {
                        playBlip();
                    }
                }
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [currentChannel, user, prependPost, addSystemMessage]);

    // DM Messages Subscription
    const activeDMRecipient = useStore((s) => s.activeDMRecipient);
    const prependDMPost = useStore((s) => s.prependDMPost);
    const dmChannelRef = useRef(null);

    useEffect(() => {
        if (!user || !activeDMRecipient) return;

        if (dmChannelRef.current) {
            supabase.removeChannel(dmChannelRef.current);
        }

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
                    if (payload.new.user_id !== user?.id) {
                        playBlip();
                    }
                }
            )
            .subscribe();

        return () => {
            if (dmChannelRef.current) {
                supabase.removeChannel(dmChannelRef.current);
            }
        };
    }, [user, activeDMRecipient, prependDMPost]);

    // Global Presence Subscription
    const setOnlineUsers = useStore((s) => s.setOnlineUsers);
    const setTypingUsers = useStore((s) => s.setTypingUsers);
    const nickname = useStore((s) => s.nickname);
    const isLocalTyping = useStore((s) => s.isLocalTyping);
    const presenceRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        const presenceChannel = supabase.channel("global_presence");
        presenceRef.current = presenceChannel;

        presenceChannel
            .on("presence", { event: "sync" }, () => {
                const state = presenceChannel.presenceState();
                const onlineObj = {};
                const typingObj = {};
                for (const id in state) {
                    if (state[id].length > 0) {
                        const presenceData = state[id][0];
                        onlineObj[presenceData.uid] = presenceData;
                        if (presenceData.isTyping) {
                            typingObj[presenceData.uid] = true;
                        }
                    }
                }
                setOnlineUsers(onlineObj);
                setTypingUsers(typingObj);
            })
            .subscribe();

        return () => {
            presenceChannel.untrack();
            supabase.removeChannel(presenceChannel);
            presenceRef.current = null;
        };
    }, [user, setOnlineUsers, setTypingUsers]);

    // Separate effect for tracking updates to avoid re-subscribing
    useEffect(() => {
        if (presenceRef.current && user) {
            presenceRef.current.track({
                uid: user.id,
                channel: currentChannel,
                nickname: nickname || "anon",
                isTyping: isLocalTyping
            });
        }
    }, [user, currentChannel, nickname, isLocalTyping]);
}