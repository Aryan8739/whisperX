import { supabase } from "./supabase.js"; // your existing client :contentReference[oaicite:1]{index=1}

let currentUser = null;
let currentNickname = null;
let realtimeChannel = null;

/* --------- helpers --------- */

function timeAgo(dateString) {
  const now = new Date();
  const then = new Date(dateString);
  const diffSec = (now - then) / 1000;

  if (diffSec < 60) return `${Math.floor(diffSec)} sec ago`;
  const diffMin = diffSec / 60;
  if (diffMin < 60) return `${Math.floor(diffMin)} min ago`;
  const diffHours = diffMin / 60;
  if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`;
  const diffDays = diffHours / 24;
  return `${Math.floor(diffDays)} days ago`;
}

function updatePrompt() {
  const nick = currentNickname || "anon";
  document.getElementById("prompt").textContent = `${nick}@campus:~$`;
}

function showNicknameModal() {
  document.getElementById("nickname-modal").classList.remove("hidden");
}

function hideNicknameModal() {
  document.getElementById("nickname-modal").classList.add("hidden");
}

/* --------- auth + users --------- */

async function ensureAuth() {
  let { data, error } = await supabase.auth.getUser();
  if (error) console.log("getUser error", error);

  if (data?.user) return data.user;

  const { data: signData, error: signErr } = await supabase.auth.signInAnonymously();
  if (signErr) {
    console.error("anon sign-in error", signErr);
    return null;
  }

  return signData.user;
}

async function getOrCreateUserRow(uid) {
  let { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("uid", uid)
    .maybeSingle();

  if (error) console.log("users select error", error);
  if (data) return data;

  const { data: inserted, error: insErr } = await supabase
    .from("users")
    .insert({ uid })
    .select()
    .single();

  if (insErr) {
    console.error("users insert error", insErr);
    return null;
  }

  return inserted;
}

/* --------- posts rendering --------- */

function renderPost(post) {
  const wrapper = document.createElement("div");
  wrapper.className = "post";

  const header = document.createElement("div");
  header.className = "post-header";

  const nick = post.nickname || "anon";
  const when = post.created_at ? timeAgo(post.created_at) : "";

  header.textContent = `${nick}@campus ➤ [${when}]`;

  const body = document.createElement("div");
  body.className = "post-text";
  body.textContent = post.text_content || "";

  wrapper.appendChild(header);
  wrapper.appendChild(body);

  return wrapper;
}

function addPostToTop(post) {
  const feed = document.getElementById("feed");
  const node = renderPost(post);
  feed.insertBefore(node, feed.firstChild);
}

/* --------- load + realtime --------- */

async function loadPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("loadPosts error", error);
    return;
  }

  const feed = document.getElementById("feed");
  feed.innerHTML = "";
  data.forEach(p => feed.appendChild(renderPost(p)));
}

function setupRealtime() {
  if (realtimeChannel) return; // already subscribed

  realtimeChannel = supabase
    .channel("posts-channel")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "posts" },
      payload => {
        addPostToTop(payload.new);
      }
    )
    .subscribe();
}

/* --------- posting --------- */

let isPosting = false;

async function postWhisper(text) {
  if (!currentUser || isPosting) return;
  isPosting = true;

  const expires = new Date(Date.now() + 86400000).toISOString(); // 24h
  const nickname = currentNickname || "anon";

  const { error } = await supabase
    .from("posts")
    .insert({
      type: "whisper",
      text_content: text,
      audio_url: null,
      user_id: currentUser.id,
      nickname,
      expires_at: expires
    });

  if (error) {
    console.error("insert error", error);
  }

  isPosting = false;
}

/* --------- nickname save --------- */

async function saveNicknameFromModal() {
  const input = document.getElementById("nickname-input");
  const nick = input.value.trim();
  if (!nick || !currentUser) return;

  const { error } = await supabase
    .from("users")
    .update({ nickname: nick })
    .eq("uid", currentUser.id);

  if (error) {
    console.error("nickname update error", error);
    return;
  }

  currentNickname = nick;
  localStorage.setItem("nickname", nick);
  updatePrompt();
  hideNicknameModal();
}

/* --------- init --------- */

async function init() {
  // attach input handler
  const input = document.getElementById("terminal-input");
  input.addEventListener("keydown", async e => {
    if (e.key === "Enter") {
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      await postWhisper(text);
      // UI will update via realtime
    }
  });

  document.getElementById("save-nickname-btn")
    .addEventListener("click", saveNicknameFromModal);

  // top menu actions
  document.getElementById("home-btn").onclick = () => loadPosts();
  document.getElementById("channels-btn").onclick = () => {
    alert("Channels coming soon :)");
  };
  document.getElementById("nickname-btn").onclick = () => {
    document.getElementById("nickname-input").value = currentNickname || "";
    showNicknameModal();
  };
  document.getElementById("settings-btn").onclick = () => {
    alert("Settings coming soon :)");
  };

  // auth
  const user = await ensureAuth();
  if (!user) return;
  currentUser = user;

  // user row & nickname
  const userRow = await getOrCreateUserRow(user.id);
  currentNickname =
    localStorage.getItem("nickname") ||
    userRow?.nickname ||
    null;

  if (!currentNickname) {
    showNicknameModal();
  }

  updatePrompt();
  await loadPosts();
  setupRealtime();
}

init();
