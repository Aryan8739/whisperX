import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_PASSWORD,
  JWT_SECRET,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_PASSWORD || !JWT_SECRET) {
  console.warn("[WARN] Missing env vars. Check backend/.env");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://10.83.26.154:3000"
    ],
    credentials: true
  })
);


// ---------- Helper: auth middleware ----------
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "admin") {
      return res.status(403).json({ error: "Not admin" });
    }
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ---------- LOGIN ----------
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;

  if (!password) return res.status(400).json({ error: "Password required" });

  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, {
      expiresIn: "12h",
    });
    return res.json({ token });
  }

  return res.status(401).json({ error: "Invalid password" });
});

// ---------- POSTS ----------
app.get("/api/admin/posts", requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ posts: data });
});

app.delete("/api/admin/posts/:id", requireAdmin, async (req, res) => {
  const id = req.params.id;

  const { error } = await supabaseAdmin.from("posts").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
});

// ---------- USERS ----------
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("users").select("*");

  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data });
});

// edit nickname
app.patch("/api/admin/users/:uid/nickname", requireAdmin, async (req, res) => {
  const uid = req.params.uid;
  const { nickname } = req.body;

  const { error } = await supabaseAdmin
    .from("users")
    .update({ nickname })
    .eq("uid", uid);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ban user (requires users table to have columns: banned (bool), ban_reason (text), banned_at (timestamp))
app.post("/api/admin/ban-user", requireAdmin, async (req, res) => {
  const { uid, reason } = req.body;
  const { error } = await supabaseAdmin
    .from("users")
    .update({
      banned: true,
      ban_reason: reason || null,
      banned_at: new Date().toISOString(),
    })
    .eq("uid", uid);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// unban
app.post("/api/admin/unban-user", requireAdmin, async (req, res) => {
  const { uid } = req.body;
  const { error } = await supabaseAdmin
    .from("users")
    .update({
      banned: false,
      ban_reason: null,
      banned_at: null,
    })
    .eq("uid", uid);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ---------- CHANNELS ----------
// assumes a 'channels' table with at least: id, name, topic (text)
app.get("/api/admin/channels", requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("channels")
    .select("*")
    .order("id", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ channels: data });
});

app.post("/api/admin/channels", requireAdmin, async (req, res) => {
  const { name, topic } = req.body;

  const { error } = await supabaseAdmin
    .from("channels")
    .insert([{ name, topic: topic || "" }]);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.patch("/api/admin/channels/:id", requireAdmin, async (req, res) => {
  const id = req.params.id;
  const { name, topic } = req.body;

  const { error } = await supabaseAdmin
    .from("channels")
    .update({ name, topic })
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/admin/channels/:id", requireAdmin, async (req, res) => {
  const id = req.params.id;

  const { error } = await supabaseAdmin.from("channels").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
});

// ---------- ANALYTICS ----------
app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
  const now = new Date();
  const yesterdayIso = new Date(
    now.getTime() - 24 * 60 * 60 * 1000
  ).toISOString();

  const [{ count: postCount }, { count: userCount }, { count: channelCount }] =
    await Promise.all([
      supabaseAdmin.from("posts").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("channels").select("*", {
        count: "exact",
        head: true,
      }),
    ]);

  const { count: postsLast24h } = await supabaseAdmin
    .from("posts")
    .select("*", { count: "exact", head: true })
    .gte("created_at", yesterdayIso);

  res.json({
    totals: {
      posts: postCount || 0,
      users: userCount || 0,
      channels: channelCount || 0,
      postsLast24h: postsLast24h || 0,
    },
  });
});

// ---------- START ----------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Admin backend running on http://localhost:${PORT}`);
});
