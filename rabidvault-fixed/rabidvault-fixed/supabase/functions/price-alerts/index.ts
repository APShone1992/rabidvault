// supabase/functions/price-alerts/index.ts
// Checks wishlist items with alerts enabled and writes in-app notifications
// to the activity_feed table. No emails — pure in-app notifications.
//
// Deploy: supabase functions deploy price-alerts
//
// Schedule daily at 9am via Supabase SQL editor:
//   select cron.schedule('daily-price-alerts', '0 9 * * *', $$
//     select net.http_post(
//       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/price-alerts',
//       headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
//     )
//   $$);

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get all wishlist items with alerts on and a target price set
  const { data: alerts, error } = await supabase
    .from('wishlist')
    .select('id, title, issue_number, publisher, target_price, comicvine_id, user_id, cover_url')
    .eq('alert_enabled', true)
    .gt('target_price', 0)

  if (error || !alerts?.length) {
    return new Response(JSON.stringify({ message: 'No active alerts', error }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }

  let triggered = 0

  for (const alert of alerts) {
    if (!alert.comicvine_id) continue

    try {
      // Resolve the internal comic UUID from the ComicVine string ID
      const { data: comicRow } = await supabase
        .from('comics')
        .select('id')
        .eq('comicvine_id', alert.comicvine_id)
        .maybeSingle()

      if (!comicRow) continue

      // Get the latest price we have recorded for this comic
      const { data: history } = await supabase
        .from('price_history')
        .select('price')
        .eq('comic_id', comicRow.id)
        .order('recorded_at', { ascending: false })
        .limit(1)

      const currentPrice = history?.[0]?.price
      if (!currentPrice) continue

      // Trigger if current market price is at or below the user's target
      if (Number(currentPrice) <= Number(alert.target_price)) {

        // Check we haven't already notified this user about this item today
        const today = new Date().toISOString().split('T')[0]
        const { data: existing } = await supabase
          .from('activity_feed')
          .select('id')
          .eq('user_id', alert.user_id)
          .eq('type', 'price_alert')
          .filter('payload->wishlist_id', 'eq', alert.id)
          .gte('created_at', `${today}T00:00:00Z`)
          .limit(1)

        // Skip if already notified today
        if (existing?.length) continue

        // Write an in-app notification to the activity_feed
        await supabase.from('activity_feed').insert({
          user_id: alert.user_id,
          type:    'price_alert',
          payload: {
            wishlist_id:   alert.id,
            title:         alert.title,
            issue_number:  alert.issue_number || '',
            publisher:     alert.publisher    || '',
            cover_url:     alert.cover_url    || '',
            current_price: Number(currentPrice),
            target_price:  Number(alert.target_price),
          },
        })

        triggered++
      }
    } catch (_) { continue }
  }

  return new Response(
    JSON.stringify({ checked: alerts.length, triggered }),
    { headers: { ...CORS, 'Content-Type': 'application/json' } }
  )
})
