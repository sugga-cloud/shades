
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wgiuubiflletlmzuriwi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnaXV1YmlmbGxldGxtenVyaXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjU1NTgsImV4cCI6MjA2NzEwMTU1OH0.pDuXhfgJ70GRJHHgfcjwp_rPYgQrXgpTbNm2M8DBDgI'
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase;