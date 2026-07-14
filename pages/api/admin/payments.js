import { supabaseAdmin } from '@/lib/supabase';

// Middleware pour vérifier si c'est un admin
async function isAdmin(userId) {
  const { data } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  return data?.role === 'admin';
}

export default async function handler(req, res) {
  const { adminId } = req.headers;

  if (!adminId || !(await isAdmin(adminId))) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // Lister tous les paiements en attente
    try {
      const { data, error } = await supabaseAdmin
        .from('payments')
        .select('*, users(email, plan)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;

      return res.status(200).json({ payments: data });
    } catch (error) {
      console.error('Erreur:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  else if (req.method === 'PUT') {
    // Valider ou rejeter un paiement
    const { paymentId, action } = req.body;

    if (!paymentId || !['validate', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    try {
      // Récupérer le paiement
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .maybeSingle();

      if (paymentError) throw paymentError;
      if (!payment) return res.status(404).json({ error: 'Payment not found' });

      if (action === 'validate') {
        // Mettre à jour le statut du paiement
        await supabaseAdmin
          .from('payments')
          .update({ status: 'validated', validated_at: new Date().toISOString() })
          .eq('id', paymentId);

        // Mettre à jour le plan de l'utilisateur
        await supabaseAdmin
          .from('users')
          .update({ plan: payment.plan })
          .eq('id', payment.user_id);

        return res.status(200).json({ 
          message: 'Payment validated',
          plan: payment.plan
        });
      } else {
        // Rejeter
        await supabaseAdmin
          .from('payments')
          .update({ status: 'rejected' })
          .eq('id', paymentId);

        return res.status(200).json({ message: 'Payment rejected' });
      }
    } catch (error) {
      console.error('Erreur:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
