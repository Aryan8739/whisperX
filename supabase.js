// Load Supabase client library
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Your Supabase project details
const SUPABASE_URL = "https://zyqdgevlhmsryuxknbly.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5cWRnZXZsaG1zcnl1eGtuYmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDQzNTUsImV4cCI6MjA3OTM4MDM1NX0.1QlTUxXzHjUWflVY-Bhwb-WkD_JipcuQDZixU87CY-4";

// Create global client so app.js can access it
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
