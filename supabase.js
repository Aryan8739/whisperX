import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://zyqdgevlhmsryuxknbly.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5cWRnZXZsaG1zcnl1eGtuYmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjU2NjAsImV4cCI6MjA3OTI4NTY2MH0.TUOKPBkZy0lZ0AXIh1ptgqtDqspufLGbaOhIhZG6OYQ",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: window.localStorage,
    }
  }
);

// expose globally so app.js can just use `window.supabase`
window.supabase = supabase;
