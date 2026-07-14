import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

const PLANS = [
  {
    id: 'essai',
    name: 'Essai',
    price: 0,
    currency: 'FCFA',
    period: 'jour',
    requests: 50,
    features: [
      '50 messages/jour',
      'Groq AI',
      'Historique limité',
      'Support communauté'
    ]
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 2500,
    currency: 'FCFA',
    period: 'mois',
    requests: 10000,
    features: [
      '10,000 messages/mois',
      'Groq AI',
      'Historique complet',
      'Support email'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 6000,
    currency: 'FCFA',
    period: 'mois',
    requests: 30000,
    features: [
      '30,000 messages/mois',
      'Groq AI',
      'Historique illimité',
      'Support prioritaire'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 12000,
    currency: 'FCFA',
    period: 'mois',
    requests: 60000,
    features: [
      '60,000 messages/mois',
      'Groq AI + Fallback Gemini',
      'Export données',
      'API access'
    ]
  },
  {
    id: 'pro-max',
    name: 'Pro Max',
    price: 75000,
    currency: 'FCFA',
    period: 'mois',
    requests: 100000,
    features: [
      '100,000 messages/mois',
      'Gemini Pro',
      'Priority support 24/7',
      'Custom integrations',
      'Dedicated account'
    ],
    highlight: true
  }
];

export default function Plans() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  const handleUpgrade = (planId) => {
    if (!user) {
      router.push('/');
      return;
    }
    router.push(`/payment?plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">💬 Plans</h1>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Choisissez votre plan</h2>
          <p className="text-slate-400 text-lg">
            Escaladez selon vos besoins. Annulez à tout moment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg overflow-hidden transition transform hover:scale-105 ${
                plan.highlight
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 ring-2 ring-blue-400 md:col-span-1 lg:col-span-1 md:row-span-2 lg:row-span-2'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 text-sm font-bold rounded-bl">
                  POPULAIRE
                </div>
              )}

              <div className="p-6 flex flex-col h-full">
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-slate-100'}`}>
                  {plan.name}
                </h3>

                <div className="mb-6">
                  <div className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-slate-100'}`}>
                    {plan.price.toLocaleString()} <span className="text-lg">{plan.currency}</span>
                  </div>
                  <p className={`text-sm ${plan.highlight ? 'text-blue-100' : 'text-slate-400'}`}>
                    par {plan.period}
                  </p>
                </div>

                <div className={`mb-6 p-3 rounded ${plan.highlight ? 'bg-blue-500 bg-opacity-30' : 'bg-slate-700'}`}>
                  <p className={`text-sm font-semibold ${plan.highlight ? 'text-blue-100' : 'text-slate-300'}`}>
                    📊 {plan.requests.toLocaleString()} messages
                  </p>
                </div>

                <ul className="flex-1 space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className={`text-sm flex items-start ${plan.highlight ? 'text-blue-50' : 'text-slate-300'}`}>
                      <span className="mr-2">✅</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full py-2 rounded font-medium transition ${
                    plan.highlight
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.id === 'essai' ? 'Commencer' : 'Mettre à niveau'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
