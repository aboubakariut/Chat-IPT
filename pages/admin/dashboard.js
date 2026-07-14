import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (userData?.role !== 'admin') {
        router.push('/chat');
        return;
      }

      setUser(data.user);
      fetchPayments(data.user.id);
    };

    checkAdmin();
  }, []);

  const fetchPayments = async (adminId) => {
    try {
      const response = await fetch('/api/admin/payments', {
        headers: { 'adminId': adminId }
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (paymentId, action) => {
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'adminId': user.id
        },
        body: JSON.stringify({ paymentId, action })
      });

      if (response.ok) {
        // Actualiser la liste
        fetchPayments(user.id);
        alert(`Payment ${action === 'validate' ? 'validé' : 'rejeté'}`);
      }
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  if (!user) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">🔑 Admin Dashboard</h1>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-8">
        <h2 className="text-3xl font-bold text-white mb-8">Paiements en attente</h2>

        {loading ? (
          <div className="text-center text-slate-400">Chargement...</div>
        ) : payments.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-400">
            Aucun paiement en attente ✅
          </div>
        ) : (
          <div className="grid gap-6">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left */}
                  <div>
                    <p className="text-slate-400 text-sm">Email</p>
                    <p className="text-white text-lg font-bold mb-4">
                      {payment.users?.email}
                    </p>

                    <p className="text-slate-400 text-sm">Plan demandé</p>
                    <p className="text-blue-400 text-lg font-bold mb-4">
                      {payment.plan.toUpperCase()} - {payment.amount.toLocaleString()} FCFA
                    </p>

                    <p className="text-slate-400 text-sm">Numéro Orange</p>
                    <p className="text-orange-400 font-mono">
                      {payment.orange_number}
                    </p>
                  </div>

                  {/* Right - Screenshot */}
                  <div>
                    {payment.screenshot_url ? (
                      <div>
                        <img
                          src={payment.screenshot_url}
                          alt="Proof"
                          className="w-full rounded-lg max-h-64 object-cover mb-4 cursor-pointer hover:opacity-80"
                          onClick={() => window.open(payment.screenshot_url, '_blank')}
                        />
                        <p className="text-xs text-slate-400 text-center">Cliquez pour agrandir</p>
                      </div>
                    ) : (
                      <div className="bg-slate-700 rounded-lg h-64 flex items-center justify-center text-slate-400">
                        Pas de capture
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handlePayment(payment.id, 'validate')}
                    className="flex-1 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition"
                  >
                    ✅ Valider
                  </button>
                  <button
                    onClick={() => handlePayment(payment.id, 'reject')}
                    className="flex-1 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition"
                  >
                    ❌ Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
