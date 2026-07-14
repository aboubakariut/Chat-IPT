import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Créer un paiement
    const { userId, plan, amount, orangeNumber, screenshotUrl } = req.body;

    if (!userId || !plan || !amount || !orangeNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('payments')
        .insert({
          user_id: userId,
          plan,
          amount,
          orange_number: orangeNumber,
          screenshot_url: screenshotUrl || null,
          status: 'pending',
        })
        .select();

      if (error) throw error;

      return res.status(201).json({ 
        message: 'Payment created',
        payment: data[0]
      });
    } catch (error) {
      console.error('Erreur paiement:', error);
      return res.status(500).json({ error: error.message });
    }
  } 
  
  else if (req.method === 'GET') {
    // Récupérer les paiements de l'utilisateur
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ payments: data });
    } catch (error) {
      console.error('Erreur récupération paiements:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
