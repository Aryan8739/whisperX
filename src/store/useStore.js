import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export const useStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────────────
  user: null,
  nickname: localStorage.getItem("nickname") || null,
  setUser: (user) => set({ user }),
  setNickname: (nickname) => {
    localStorage.setItem("nickname", nickname);
    set({ nickname });
  },

  // ── Channel ───────────────────────────────────────────
  currentChannel: localStorage.getItem("currentChannel") || "general",
  setChannel: (channel) => {
    localStorage.setItem("currentChannel", channel);
    set({ currentChannel: channel, posts: [] });
  },

  // ── Posts ─────────────────────────────────────────────
  posts: [],
  isLoadingPosts: false,
  setPosts: (posts) => set({ posts }),
  prependPost: (post) => set((s) => ({ posts: [post, ...s.posts] })),
  setLoadingPosts: (v) => set({ isLoadingPosts: v }),

  // ── UI ────────────────────────────────────────────────
  showNicknameModal: false,
  setShowNicknameModal: (v) => set({ showNicknameModal: v }),

  isPosting: false,
  setIsPosting: (v) => set({ isPosting: v }),

  // ── Actions ───────────────────────────────────────────
  async ensureAuth() {
    try {
      let { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        set({ user: data.user });
        return data.user;
      }
      const { data: signData, error: signError } = await supabase.auth.signInAnonymously();
      if (signError) throw signError;
      set({ user: signData?.user });
      return signData?.user;
    } catch (e) {
      console.error("Auth error:", e);
      return null;
    }
  },

  async getOrCreateUserRow(uid) {
    let { data } = await supabase
      .from("users")
      .select("*")
      .eq("uid", uid)
      .maybeSingle();

    if (data) return data;

    const { data: inserted } = await supabase
      .from("users")
      .insert({ uid })
      .select()
      .single();

    return inserted;
  },

  async loadPosts() {
    const { currentChannel } = get();
    set({ isLoadingPosts: true });

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("channel", currentChannel)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error) set({ posts: data });
    set({ isLoadingPosts: false });
  },

  async postWhisper(text) {
    const { user, nickname, currentChannel, isPosting } = get();
    if (!user || isPosting) return;

    set({ isPosting: true });
    await supabase.from("posts").insert({
      type: "whisper",
      text_content: text,
      audio_url: null,
      user_id: user.id,
      nickname: nickname || "anon",
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      channel: currentChannel,
    });
    set({ isPosting: false });
  },

  async saveNickname(nick) {
    const { user } = get();
    if (!nick || !user) return;

    const { error } = await supabase
      .from("users")
      .update({ nickname: nick })
      .eq("uid", user.id);

    if (!error) {
      localStorage.setItem("nickname", nick);
      set({ nickname: nick, showNicknameModal: false });
    }
  },
}));
