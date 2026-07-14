import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [quota, setQuota] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Récupérer l'utilisateur
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
        fetchQuota(data.user.id);
      }
    };
    getUser();
  }, []);

  const fetchQuota = async (userId) => {
    try {
      // Récupérer le plan de l'utilisateur
      const { data: userData } = await supabase
        .from('users')
        .select('plan')
        .eq('id', userId)
        .maybeSingle();

      const plan = userData?.plan || 'essai';

      // Récupérer le quota
      const response = await fetch(`/api/quota?userId=${userId}&plan=${plan}`);
      const data = await response.json();
      setQuota(data);
    } catch (error) {
      console.error('Erreur quota:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    const userMessage = input;
    setInput('');

    // Ajouter le message utilisateur
    setMessages([...messages, { role: 'user', content: userMessage }]);

    try {
      // Récupérer le plan de l'utilisateur
      const { data: userData } = await supabase
        .from('users')
        .select('plan')
        .eq('id', user.id)
        .maybeSingle();

      const plan = userData?.plan || 'essai';

      // Envoyer au chatbot
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          message: userMessage,
          plan: plan
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        fetchQuota(user.id);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ Erreur: ${data.error}` }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Erreur: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">💬 Chatbot</h1>
          <div className="flex gap-4 items-center">
            {quota && (
              <div className="text-sm text-slate-400">
                {quota.period === 'day' ? '📅 Jour' : '📆 Mois'}: {quota.remaining}/{quota.limit}
              </div>
            )}
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-100'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 text-slate-100 px-4 py-2 rounded-lg">
                ⏳ Typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-slate-700 p-4 bg-slate-900">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrivez un message..."
            disabled={loading || quota?.remaining === 0}
            className="flex-1 px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || quota?.remaining === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Envoyer
          </button>
        </form>
        {quota?.remaining === 0 && (
          <p className="text-center mt-2 text-red-500">
            ⚠️ Quota atteint ! Mettez à niveau votre plan.
          </p>
        )}
      </div>
    </div>
  );
}
