import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export const useStore = create((set, get) => ({
  user: null,
  nickname: localStorage.getItem("nickname") || null,
  theme: localStorage.getItem("theme") || "green",
  isAudioEnabled: localStorage.getItem("isAudioEnabled") !== "false",
  setUser: (user) => set({ user }),
  setNickname: (nickname) => {
    localStorage.setItem("nickname", nickname);
    set({ nickname });
  },
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    set({ theme });
  },
  toggleAudio: () => set((s) => {
    const newVal = !s.isAudioEnabled;
    localStorage.setItem("isAudioEnabled", newVal);
    return { isAudioEnabled: newVal };
  }),
  currentChannel: localStorage.getItem("currentChannel") || "general",
  setChannel: (channel) => {
    localStorage.setItem("currentChannel", channel);
    set({ currentChannel: channel, posts: [] });
  },
  onlineUsers: {},
  typingUsers: {},
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  setTypingUsers: (typingUsers) => set({ typingUsers }),

  isLocalTyping: false,
  setIsLocalTyping: (v) => set({ isLocalTyping: v }),
  activeOverlay: null,
  setActiveOverlay: (v) => set({ activeOverlay: v }),
  selectedProfileUser: null,
  setSelectedProfileUser: (v) => set({ selectedProfileUser: v }),
  posts: [],
  isLoadingPosts: false,
  setPosts: (posts) => set({ posts }),
  prependPost: (post) => set((s) => {
    if (s.posts.find(p => p.id === post.id)) return s;
    return { posts: [post, ...s.posts] };
  }),
  setLoadingPosts: (v) => set({ isLoadingPosts: v }),
  showNicknameModal: false,
  setShowNicknameModal: (v) => set({ showNicknameModal: v }),

  showSettingsModal: false,
  setShowSettingsModal: (v) => set({ showSettingsModal: v }),

  isPosting: false,
  setIsPosting: (v) => set({ isPosting: v }),
  users: [],
  recentConversations: [],
  activeDMRecipient: null,
  dmPosts: [],
  isLoadingDMPosts: false,
  isSidePanelOpen: false,
  systemLogs: [],
  setUsers: (users) => set({ users }),
  setActiveDMRecipient: (user) => {
    set({ activeDMRecipient: user, dmPosts: [], isSidePanelOpen: true });
    if (user) {
      get().loadDMPosts();
    }
  },
  setDMPosts: (dmPosts) => set({ dmPosts }),
  prependDMPost: (post) => set((s) => {
    if (s.dmPosts.find(p => p.id === post.id)) return s;
    return { dmPosts: [post, ...s.dmPosts] };
  }),
  toggleSidePanel: () => set((s) => ({ isSidePanelOpen: !s.isSidePanelOpen })),
  addSystemMessage: (text) => {
    const newMessage = {
      id: `sys-${Date.now()}`,
      type: "system",
      text_content: text,
      created_at: new Date().toISOString(),
      nickname: "SYSTEM"
    };
    set((s) => ({ systemLogs: [...s.systemLogs, newMessage] }));
  },
  clearLocalLogs: () => set({ systemLogs: [], posts: [] }),
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
    if (!user || isPosting || !text.trim()) return;

    const optimisticPost = {
      id: `temp-${Date.now()}`,
      type: "whisper",
      text_content: text,
      user_id: user.id,
      nickname: nickname || "anon",
      created_at: new Date().toISOString(),
      channel: currentChannel,
      is_optimistic: true
    };
    
    set((s) => ({ posts: [optimisticPost, ...s.posts] }));
    set({ isPosting: true });

    const { data, error } = await supabase.from("posts").insert({
      type: "whisper",
      text_content: text,
      user_id: user.id,
      nickname: nickname || "anon",
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      channel: currentChannel,
    }).select().single();

    if (error) {
      set((s) => ({ posts: s.posts.filter(p => p.id !== optimisticPost.id) }));
      get().addSystemMessage("Failed to send whisper.");
    } else if (data) {
      set((s) => ({ 
        posts: s.posts.map(p => p.id === optimisticPost.id ? data : p) 
      }));
    }
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
    
    const ids = [user.id, activeDMRecipient.uid].sort();
    const dmChannel = `dm_${ids[0]}_${ids[1]}`;

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("channel", dmChannel)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error) {
      set({ dmPosts: data });
      get().loadRecentConversations();
    }
    set({ isLoadingDMPosts: false });
  },

  async loadRecentConversations() {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from("posts")
      .select("channel, created_at, user_id, nickname")
      .filter("channel", "ilike", "dm_%")
      .or(`channel.ilike.%${user.id}%`)
      .order("created_at", { ascending: false });

    if (error || !data) return;

    const recent = [];
    const seenOtherIds = new Set();

    for (const post of data) {
      const ids = post.channel.replace("dm_", "").split("_");
      const otherId = ids.find(id => id !== user.id);
      
      if (otherId && !seenOtherIds.has(otherId)) {
        seenOtherIds.add(otherId);
        
        recent.push({
          uid: otherId,
          lastActivity: post.created_at,
          nickname: post.user_id === otherId ? post.nickname : null 
        });
      }
    }

    const { data: userDetails } = await supabase
      .from("users")
      .select("*")
      .in("uid", Array.from(seenOtherIds));

    if (userDetails) {
      const merged = recent.map(r => {
        const detail = userDetails.find(u => u.uid === r.uid);
        return detail ? { ...detail, lastActivity: r.lastActivity } : r;
      });
      set({ recentConversations: merged });
    }
  },

  async postDM(text) {
    const { user, nickname, activeDMRecipient, isPosting } = get();
    if (!user || !activeDMRecipient || isPosting || !text.trim()) return;

    const ids = [user.id, activeDMRecipient.uid].sort();
    const dmChannel = `dm_${ids[0]}_${ids[1]}`;

    const optimisticPost = {
      id: `temp-dm-${Date.now()}`,
      type: "dm",
      text_content: text,
      user_id: user.id,
      nickname: nickname || "anon",
      created_at: new Date().toISOString(),
      channel: dmChannel,
      is_optimistic: true
    };

    set((s) => ({ dmPosts: [optimisticPost, ...s.dmPosts] }));
    set({ isPosting: true });
    
    const { data, error } = await supabase.from("posts").insert({
      type: "dm",
      text_content: text,
      user_id: user.id,
      nickname: nickname || "anon",
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      channel: dmChannel,
    }).select().single();

    if (error) {
        set((s) => ({ dmPosts: s.dmPosts.filter(p => p.id !== optimisticPost.id) }));
        get().addSystemMessage("Failed to send DM.");
    } else if (data) {
        set((s) => ({ 
            dmPosts: s.dmPosts.map(p => p.id === optimisticPost.id ? data : p) 
        }));
    }

    set({ isPosting: false });
    get().loadRecentConversations();
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
      get().addSystemMessage(`Nickname updated to: ${nick}`);
    }
  },

  async updateUserStatus(status) {
    const { user } = get();
    if (!user) return;

    const { error } = await supabase
      .from("users")
      .update({ status_message: status })
      .eq("uid", user.id);

    if (!error) {
      get().addSystemMessage(`Status updated: ${status || "cleared"}`);
      get().loadUsers();
    }
  },
  async getIdentityKey() {
    const storageKey = Object.keys(localStorage).find(k => k.includes("-auth-token"));
    if (!storageKey) return null;

    const sessionData = localStorage.getItem(storageKey);
    if (!sessionData) return null;

    const nickname = localStorage.getItem("nickname");
    
    const packageData = JSON.stringify({
        session: JSON.parse(sessionData),
        nickname: nickname
    });

    return btoa(packageData);
  },
  async restoreIdentity(key) {
    try {
      const packageData = JSON.parse(atob(key));
      const sessionData = JSON.stringify(packageData.session);
      const nickname = packageData.nickname;

      let storageKey = Object.keys(localStorage).find(k => k.includes("-auth-token"));
      if (!storageKey) {
          storageKey = `sb-${import.meta.env.VITE_SUPABASE_URL.split('.')[0].replace('https://', '')}-auth-token`;
      }

      localStorage.setItem(storageKey, sessionData);
      if (nickname) {
          localStorage.setItem("nickname", nickname);
      }
      return true;
    } catch (e) {
      console.error("Deep migration failed", e);
      return false;
    }
  },
}));
