import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export const useStore = create((set, get) => ({
  // Auth
  user: null,
  nickname: localStorage.getItem("nickname") || null,
  setUser: (user) => set({ user }),
  setNickname: (nickname) => {
    localStorage.setItem("nickname", nickname);
    set({ nickname });
  },

  // Channel
  currentChannel: localStorage.getItem("currentChannel") || "general",
  setChannel: (channel) => {
    localStorage.setItem("currentChannel", channel);
    set({ currentChannel: channel, posts: [] });
  },

  // Presence
  onlineUsers: {},
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),

  //Posts 
  posts: [],
  isLoadingPosts: false,
  setPosts: (posts) => set({ posts }),
  prependPost: (post) => set((s) => ({ posts: [post, ...s.posts] })),
  setLoadingPosts: (v) => set({ isLoadingPosts: v }),

  // UI 
  showNicknameModal: false,
  setShowNicknameModal: (v) => set({ showNicknameModal: v }),

  isPosting: false,
  setIsPosting: (v) => set({ isPosting: v }),

  // DM State
  users: [],
  activeDMRecipient: null,
  dmPosts: [],
  isLoadingDMPosts: false,
  isSidePanelOpen: false,
  setUsers: (users) => set({ users }),
  setActiveDMRecipient: (user) => {
    set({ activeDMRecipient: user, dmPosts: [], isSidePanelOpen: true });
    if (user) {
      get().loadDMPosts();
    }
  },
  setDMPosts: (dmPosts) => set({ dmPosts }),
  prependDMPost: (post) => set((s) => ({ dmPosts: [post, ...s.dmPosts] })),
  toggleSidePanel: () => set((s) => ({ isSidePanelOpen: !s.isSidePanelOpen })),

  // Actions
  async ensureAuth() {
    let { data } = await supabase.auth.getUser();
    if (data?.user) {
      set({ user: data.user });
      return data.user;
    }
    const { data: signData } = await supabase.auth.signInAnonymously();
    set({ user: signData.user });
    return signData.user;
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
      .gt("expires_at", new Date().toISOString())
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

  async loadUsers() {
    const { data } = await supabase.from("users").select("*");
    if (data) set({ users: data });
  },

  async loadDMPosts() {
    const { user, activeDMRecipient } = get();
    if (!user || !activeDMRecipient) return;

    set({ isLoadingDMPosts: true });
    
    // Ensure consistent channel name
    const ids = [user.id, activeDMRecipient.uid].sort();
    const dmChannel = `dm_${ids[0]}_${ids[1]}`;

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("channel", dmChannel)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error) set({ dmPosts: data });
    set({ isLoadingDMPosts: false });
  },

  async postDM(text) {
    const { user, nickname, activeDMRecipient, isPosting } = get();
    if (!user || !activeDMRecipient || isPosting || !text.trim()) return;

    set({ isPosting: true });
    
    const ids = [user.id, activeDMRecipient.uid].sort();
    const dmChannel = `dm_${ids[0]}_${ids[1]}`;

    await supabase.from("posts").insert({
      type: "dm",
      text_content: text,
      audio_url: null,
      user_id: user.id,
      nickname: nickname || "anon",
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      channel: dmChannel,
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
