import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://znusjaonzptwlrpkbjaf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudXNqYW9uenB0d2xycGtiamFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyODUxNjEsImV4cCI6MjA4MDg2MTE2MX0.DOhxvl48AnJgydGk15WT4B-YWRDi-VsQ-qCkVQkkCXI'

export const supabase = createClient(supabaseUrl, supabaseKey)