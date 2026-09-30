import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://caqddyjfiopqihuldriv.supabase.co';

const supabasePublishableKey =
  'sb_publishable_Xe3jpzD0Jec9QEol5zn71g_bwmtAp9S';

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);
