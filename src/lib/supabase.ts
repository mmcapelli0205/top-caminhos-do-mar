import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pxvhrsxcyfmdvisulbbu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dmhyc3hjeWZtZHZpc3VsYmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4OTA4NzMsImV4cCI6MjA4MzQ2Njg3M30.RfNlYo7ccG8convx7P_5zWbv1pUVeJao_4UXnYAvfRA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
