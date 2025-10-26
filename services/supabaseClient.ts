import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gvhczqbwnvzbmmwnkuuc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2aGN6cWJ3bnZ6Ym1td25rdXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NTQxNjIsImV4cCI6MjA3NzAzMDE2Mn0.04YF0LHbBMiToq9WxTV9kX7wtAKnYlYAIUGylrljn_U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
