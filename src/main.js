import { supabase } from "./supabase.js";

let currentUser = null;
let currentNickname = null;
let currentChannel = localStorage.getItem("currentChannel") || "general";
let realtimeChannel = null;

/* ---------------- TIME AGO ---------------- */

function timeAgo(dateString) {
  const now = new Date();
  const then = new Date(dateString);
  const diff = (now - then) / 1000;

  if (diff < 60) return `${Math.floor(diff)} sec ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

/* ---------------- UI HELPERS ---------------- */

function updatePrompt() {
  const nick = currentNickname || "anon";
  document.getElementById("prompt").textContent = `${nick}@${currentChannel}:~$`;
}

function showNicknameModal() {
  document.getElementById("nickname-modal").classList.remove("hidden");
}

function hideNicknameModal() {
  document.getElementById("nickname-modal").classList.add("hidden");
}

/* ---------------- AUTH + GET USER ROW ---------------- */

async function ensureAuth() {
  let { data } = await supabase.auth.getUser();
  if (data?.user) return data.user;

  const { data: signData } = await supabase.auth.signInAnonymously();
  return signData.user;
}

async function getOrCreateUserRow(uid) {
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
}

/* ---------------- RENDER POSTS ---------------- */

function renderPost(post) {
  const wrapper = document.createElement("div");
  wrapper.className = "post";

  const header = document.createElement("div");
  header.className = "post-header";

  const nick = post.nickname || "anon";
  header.textContent = `${nick}@${post.channel} ➤ [${timeAgo(post.created_at)}]`;

  const body = document.createElement("div");
  body.className = "post-text";
  body.textContent = post.text_content || "";

  wrapper.appendChild(header);
  wrapper.appendChild(body);

  return wrapper;
}

function addPostToTop(post) {
  const feed = document.getElementById("feed");
  feed.insertBefore(renderPost(post), feed.firstChild);
}

/* ---------------- LOAD POSTS ---------------- */

async function loadPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("channel", currentChannel)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return console.error(error);

  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  data.forEach(p => feed.appendChild(renderPost(p)));
}

/* ---------------- REALTIME ---------------- */

function setupRealtime() {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);

  realtimeChannel = supabase
    .channel("channel-" + currentChannel)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "posts",
        filter: `channel=eq.${currentChannel}`
      },
      payload => addPostToTop(payload.new)
    )
    .subscribe();
}

/* ---------------- POSTING ---------------- */

let isPosting = false;

async function postWhisper(text) {
  if (!currentUser || isPosting) return;
  isPosting = true;

  const expires = new Date(Date.now() + 86400000).toISOString();
  const nickname = currentNickname || "anon";

  const { error } = await supabase.from("posts").insert({
    type: "whisper",
    text_content: text,
    audio_url: null,
    user_id: currentUser.id,
    nickname,
    expires_at: expires,
    channel: currentChannel
  });

  if (error) console.error("insert error", error);

  isPosting = false;
}

/* ---------------- NICKNAME ---------------- */

async function saveNicknameFromModal() {
  const input = document.getElementById("nickname-input");
  const nick = input.value.trim();
  if (!nick) return;

  const { error } = await supabase
    .from("users")
    .update({ nickname: nick })
    .eq("uid", currentUser.id);

  if (error) return console.error(error);

  currentNickname = nick;
  localStorage.setItem("nickname", nick);
  updatePrompt();
  hideNicknameModal();
}

/* ---------------- CHANNEL SWITCHING ---------------- */

function setupChannelDropdown() {
  document.getElementById("channels-btn").onclick = () => {
    document.getElementById("channel-dropdown").classList.toggle("hidden");
  };

  document.querySelectorAll(".dropdown-item").forEach(item => {
    item.onclick = async () => {
      currentChannel = item.dataset.channel;
      localStorage.setItem("currentChannel", currentChannel);
      document.getElementById("channel-dropdown").classList.add("hidden");

      updatePrompt();
      await loadPosts();
      setupRealtime();
    };
  });
}



async function init() {

  const input = document.getElementById("terminal-input");
  input.addEventListener("keydown", async e => {
    if (e.key === "Enter") {
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      await postWhisper(text);
    }
  });

  // nickname modal
  document.getElementById("save-nickname-btn")
    .addEventListener("click", saveNicknameFromModal);

  // menu actions
  document.getElementById("home-btn").onclick = () => loadPosts();
  document.getElementById("nickname-btn").onclick = () => {
    document.getElementById("nickname-input").value = currentNickname || "";
    showNicknameModal();
  };
  document.getElementById("settings-btn").onclick = () =>
    alert("Settings coming soon!");

  setupChannelDropdown();

  // authentication
  const user = await ensureAuth();
  currentUser = user;

  // fetch user row
  const userRow = await getOrCreateUserRow(user.id);

  // nickname priority: localStorage → db → ask user
  currentNickname =
    localStorage.getItem("nickname") ||
    userRow?.nickname ||
    null;

  if (!currentNickname) showNicknameModal();

  updatePrompt();

  await loadPosts();
  setupRealtime();
}

init();
