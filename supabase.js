const SUPABASE_URL = "https://cogldzqlarovmedkqwoe.supabase.co";
const SUPABASE_KEY = "sb_publishable_mDvcyUZUEEzA8kzPrszsHw_OOEVmzAC";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
window.supabaseClient = supabaseClient;
