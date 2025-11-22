// ---- Anonymous ID ----
let anonId = localStorage.getItem("anon_id");
if (!anonId) {
  anonId = "anon_" + Math.floor(Math.random() * 1000000);
  localStorage.setItem("anon_id", anonId);
}

// ---- Add post to feed ----
function addPostToFeed(post) {
  const feed = document.getElementById("feed");

  const div = document.createElement("div");
  div.style = "border:1px solid #ccc;padding:8px;margin:8px 0;";
  div.innerHTML = `
    <strong>${post.user_id}</strong><br>
    ${post.text_content}
  `;

  feed.prepend(div);
}

// ---- Load initial posts ----
async function loadPosts() {
  console.log("Loading posts...");

  const { data, error } = await window.supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error loading posts:", error);
    document.getElementById("feed").innerHTML =
      "<p style='color:red;'>Failed to load posts.</p>";
    return;
  }

  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  if (!data || data.length === 0) {
    feed.innerHTML = "<p>No posts yet.</p>";
    return;
  }

  data.forEach(post => addPostToFeed(post));
}

// ---- Export postWhisper ----
export async function postWhisper() {
  const text = document.getElementById("whisperBox").value.trim();
  if (!text) return;

  const expires = new Date(Date.now() + 86400000).toISOString();

  const { error } = await window.supabase
    .from("posts")
    .insert({
      type: "whisper",
      text_content: text,
      user_id: anonId,
      expires_at: expires
    });

  if (error) {
    console.error("Insert ERROR:", error);
    alert("Error posting: " + error.message);
    return;
  }

  document.getElementById("whisperBox").value = "";
}

// ---- Realtime listener ----
function enableRealtime() {
  window.supabase
    .channel("posts-channel")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "posts" },
      (payload) => {
        console.log("Realtime new post:", payload.new);
        addPostToFeed(payload.new);
      }
    )
    .subscribe();
}

// ---- EXPORT initApp ----
export function initApp() {
  loadPosts();
  enableRealtime();
}
