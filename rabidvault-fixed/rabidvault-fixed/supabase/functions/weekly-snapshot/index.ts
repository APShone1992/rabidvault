// supabase/functions/weekly-snapshot/index.ts
// Records each user's collection value weekly for trend charts
//
// Schedule in Supabase SQL Editor after deploying:
//   select cron.schedule('weekly-value-snapshot','0 0 * * 0',$$
//     select net.http_post(
//       url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-snapshot',
//       headers:='{"Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
//     )$$);

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: users, error } = await supabase.from('profiles').select('id')
    if (error) throw error
    if (!users?.length) return new Response(JSON.stringify({ snapped: 0 }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    })

    let snapped = 0
    for (const user of users) {
      try {
        const { data: items } = await supabase
          .from('collection').select('current_value, paid_price').eq('user_id', user.id)
        if (!items?.length) continue

        const total_value = items.reduce((s, c) => s + Number(c.current_value || 0), 0)
        const total_spent = items.reduce((s, c) => s + Number(c.paid_price    || 0), 0)

        // Skip if value unchanged since last snapshot
        const { data: last } = await supabase
          .from('value_snapshots').select('total_value')
          .eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(1)
        if (last?.[0]?.total_value === total_value) continue

        await supabase.from('value_snapshots').insert({
          user_id: user.id, total_value, total_spent, comic_count: items.length,
        })
        snapped++
      } catch (_) { continue }
    }

    return new Response(JSON.stringify({ users: users.length, snapped }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
