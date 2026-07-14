import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

const PLAN_INFO = {
  standard: { price: 2500, name: 'Standard' },
  premium: { price: 6000, name: 'Premium' },
  pro: { price: 12000, name: 'Pro' },
  'pro-max': { price: 75000, name: 'Pro Max' }
};

export default function Payment() {
  const router = useRouter();
  const { plan } = router.query;
  const [user, setUser] = useState(null);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/');
      } else {
        setUser(data.user);
      }
    };
    getUser();
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadScreenshot = async () => {
    if (!image) {
      setMessage('❌ Veuillez sélectionner une image');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const fileName = `payments/${user.id}-${Date.now()}.jpg`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      // Récupérer URL publique
      const { data: publicData } = supabase.storage
        .from('screenshots')
        .getPublicUrl(fileName);

      // Créer le paiement
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          plan: plan,
          amount: PLAN_INFO[plan].price,
          orangeNumber: '237695703571',
          screenshotUrl: publicData.data.publicUrl
        })
      });

      if (response.ok) {
        setMessage('✅ Paiement enregistré ! En attente de validation par l\'admin.');
        setImage(null);
        setImagePreview(null);
        setTimeout(() => router.push('/chat'), 2000);
      } else {
        const data = await response.json();
        setMessage(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Erreur: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (!plan || !PLAN_INFO[plan]) {
    return <div className="flex items-center justify-center h-screen">Plan non trouvé</div>;
  }

  const planInfo = PLAN_INFO[plan];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">💳 Paiement</h1>
          <button
            onClick={() => router.push('/plans')}
            className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
          >
            ← Retour
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
          <h2 className="text-3xl font-bold text-white mb-8">Confirmer votre paiement</h2>

          {/* Plan Summary */}
          <div className="bg-slate-700 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-slate-400">Plan choisi</p>
                <p className="text-2xl font-bold text-white">{planInfo.name}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400">Montant à payer</p>
                <p className="text-3xl font-bold text-blue-400">{planInfo.price.toLocaleString()} FCFA</p>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-blue-300 mb-4">📱 Instructions de paiement</h3>
            <ol className="space-y-2 text-slate-300">
              <li>1️⃣ Envoyez <span className="font-bold text-blue-400">{planInfo.price.toLocaleString()} FCFA</span> sur Orange Money</li>
              <li>2️⃣ Numéro destinataire : <span className="font-bold text-orange-400">237695703571</span></li>
              <li>3️⃣ Prenez une capture d'écran de la confirmation</li>
              <li>4️⃣ Uploadez la capture ci-dessous</li>
              <li>5️⃣ L'admin validera sous 24h</li>
            </ol>
          </div>

          {/* Image Upload */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-300 mb-4">
              📸 Uploadez votre capture d'écran
            </label>

            {!imagePreview ? (
              <label className="border-2 border-dashed border-slate-600 rounded-lg p-8 cursor-pointer hover:border-blue-500 hover:bg-slate-700 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="text-center">
                  <p className="text-2xl mb-2">📤</p>
                  <p className="text-slate-300">Cliquez pour choisir une image</p>
                  <p className="text-sm text-slate-400 mt-1">ou glissez-déposez</p>
                </div>
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full rounded-lg max-h-96 object-cover"
                  />
                </div>
                <button
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                  className="w-full py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
                >
                  Changer d'image
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={uploadScreenshot}
            disabled={uploading || !image}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {uploading ? '⏳ Upload en cours...' : '✅ Envoyer la preuve de paiement'}
          </button>

          {message && (
            <div className={`mt-4 p-4 rounded-lg text-center ${
              message.startsWith('✅')
                ? 'bg-green-900 bg-opacity-30 border border-green-500 text-green-200'
                : 'bg-red-900 bg-opacity-30 border border-red-500 text-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-8 p-4 bg-slate-700 rounded text-sm text-slate-400 text-center">
            🔒 Vos données sont sécurisées et chiffrées
          </div>
        </div>
      </div>
    </div>
  );
}
