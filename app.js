// we use the global supabase made in supabase.js
const supabase = window.supabase;

let currentUid = null;
let currentNickname = null;

// ---------- Auth & User ----------

async function ensureAnonymousLogin() {
  let { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("Anonymous login error:", error);
      return null;
    }
    authData = { user: data.user };
  }

  return authData.user;
}

async function getOrCreateUser(uid) {
  // try read
  let { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("uid", uid)
    .maybeSingle();

  if (error) {
    console.error("users select error:", error);
  }

  if (data) return data;

  // create if missing
  const insert = await supabase
    .from("users")
    .insert({ uid })
    .select()
    .single();

  if (insert.error) {
    console.error("users insert error:", insert.error);
    return null;
  }

  return insert.data;
}

// ---------- Nickname ----------

function showNicknameModal() {
  const modal = document.getElementById("nicknameModal");
  modal.style.display = "flex";
}

function hideNicknameModal() {
  const modal = document.getElementById("nicknameModal");
  modal.style.display = "none";
}

export async function saveNickname() {
  const input = document.getElementById("nicknameInput");
  const nickname = input.value.trim();
  if (!nickname || !currentUid) return;

  const { error } = await supabase
    .from("users")
    .update({ nickname })
    .eq("uid", currentUid);

  if (error) {
    console.error("nickname update error:", error);
    return;
  }

  currentNickname = nickname;
  hideNicknameModal();
}

// ---------- Posts ----------

function renderPost(post) {
  const wrapper = document.createElement("div");
  wrapper.style = "border:1px solid #ccc;margin:4px 0;padding:6px;";

  const nick = post.nickname || "Anon";
  const time = post.created_at
    ? new Date(post.created_at).toLocaleString()
    : "";

  wrapper.innerHTML = `
    <strong>${nick} • ${time}</strong><br/>
    ${post.text_content || ""}
  `;

  return wrapper;
}

function prependPostToUI(post) {
  const container = document.getElementById("posts");
  const node = renderPost(post);
  container.prepend(node);
}

let isPosting = false;

export async function postWhisper() {
  if (isPosting) return;  // Prevent spam clicks
  isPosting = true;

  const btn = document.getElementById("postButton");
  btn.disabled = true;
  btn.textContent = "Posting...";

  const input = document.getElementById("whisperInput");
  const text = input.value.trim();
  if (!text || !currentUid) {
    isPosting = false;
    btn.disabled = false;
    btn.textContent = "Post";
    return;
  }

  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("posts")
    .insert({
      type: "whisper",
      text_content: text,
      audio_url: null,
      user_id: currentUid,
      nickname: currentNickname,
      expires_at: expires,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert error:", error);
  } else {
    input.value = "";
    prependPostToUI(data);
  }

  // Re-enable button
  isPosting = false;
  btn.disabled = false;
  btn.textContent = "Post";
}


async function loadPosts() {
  const container = document.getElementById("posts");
  container.innerHTML = "Loading posts...";

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("loadPosts error:", error);
    container.innerHTML = "Failed to load posts.";
    return;
  }

  container.innerHTML = "";
  data.forEach(post => container.appendChild(renderPost(post)));
}

let realtimeChannel = null;

function setupRealtime() {
  if (realtimeChannel) {
    // Already subscribed
    return;
  }

  realtimeChannel = supabase
    .channel("posts-channel")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "posts" },
      payload => {
        prependPostToUI(payload.new);
      }
    )
    .subscribe();
}


// ---------- INIT ----------

export async function initApp() {
  // login
  const user = await ensureAnonymousLogin();
  if (!user) return;
  currentUid = user.id;

  // user row + nickname
  const userRow = await getOrCreateUser(currentUid);
  currentNickname = userRow?.nickname || null;

  if (!currentNickname) {
    showNicknameModal();
  }

  await loadPosts();
  setupRealtime();
}
