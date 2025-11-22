// ---- Anonymous ID Setup ----
let anonId = localStorage.getItem("anon_id");
if (!anonId) {
  anonId = "anon_" + Math.floor(Math.random() * 1000000);
  localStorage.setItem("anon_id", anonId);
}


// ---- Load Posts ----
async function loadPosts() {
  console.log("Loading posts...");

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error loading posts:", error);
    return;
  }

  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  if (!data || data.length === 0) {
    feed.innerHTML = "<p>No posts yet.</p>";
    return;
  }

  data.forEach(post => {
    const div = document.createElement("div");
    div.style = "border:1px solid #ccc;padding:8px;margin:8px 0;";
    div.innerHTML = `
      <strong>${post.user_id}</strong><br>
      ${post.text_content}
    `;
    feed.appendChild(div);
  });
}


// ---- Post a Whisper ----
async function postWhisper() {
  const text = document.getElementById("whisperBox").value.trim();
  if (!text) {
    console.warn("Empty message — not posting.");
    return;
  }

  const expires = new Date(Date.now() + 86400000).toISOString(); // 24 hours

  console.log("Posting whisper:", text);

  const { data, error } = await supabase
    .from("posts")
    .insert({
      type: "whisper",
      text_content: text,
      user_id: anonId,
      expires_at: expires
    });

  console.log("Insert DATA:", data);
  console.error("Insert ERROR:", error);

  if (error) {
    alert("Error posting: " + error.message);
    return;
  }

  document.getElementById("whisperBox").value = "";
  loadPosts();
}


// ---- Initial load ----
loadPosts();

// Refresh feed every 5 seconds
setInterval(loadPosts, 5000);
