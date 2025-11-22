import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://zyqdgevlhmsryuxknbly.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5cWRnZXZsaG1zcnl1eGtuYmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDQzNTUsImV4cCI6MjA3OTM4MDM1NX0.1QlTUxXzHjUWflVY-Bhwb-WkD_JipcuQDZixU87CY-4",
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
