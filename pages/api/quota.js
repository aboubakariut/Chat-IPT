import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, plan } = req.query;

  if (!userId || !plan) {
    return res.status(400).json({ error: 'Missing userId or plan' });
  }

  try {
    let used = 0;
    let limit = 0;
    let period = '';

    if (plan === 'essai') {
      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabaseAdmin
        .from('daily_usage')
        .select('request_count')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      used = data?.request_count || 0;
      limit = 50;
      period = 'day';
    } else {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0];

      const { data } = await supabaseAdmin
        .from('monthly_usage')
        .select('request_count')
        .eq('user_id', userId)
        .eq('month', monthStart)
        .maybeSingle();

      used = data?.request_count || 0;
      const limits = { standard: 10000, premium: 30000, pro: 60000, 'pro-max': 100000 };
      limit = limits[plan] || 10000;
      period = 'month';
    }

    const remaining = Math.max(0, limit - used);
    const percentage = Math.round((used / limit) * 100);

    return res.status(200).json({
      used,
      limit,
      remaining,
      percentage,
      period
    });
  } catch (error) {
    console.error('Erreur quota:', error);
    return res.status(500).json({ error: error.message });
  }
}
