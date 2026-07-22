import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [quota, setQuota] = useState(null);
  const [plan, setPlan] = useState('essai');
  const [showMenu, setShowMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
        
        // Récupérer le plan
        const { data: userData } = await supabase
          .from('users')
          .select('plan')
          .eq('id', data.user.id)
          .maybeSingle();
        
        const userPlan = userData?.plan || 'essai';
        setPlan(userPlan);
        fetchQuota(data.user.id, userPlan);
      }
    };
    getUser();
  }, []);

  const fetchQuota = async (userId, userPlan) => {
    try {
      const response = await fetch(`/api/quota?userId=${userId}&plan=${userPlan}`);
      const data = await response.json();
      setQuota(data);
    } catch (error) {
      console.error('Erreur quota:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    const userMessage = input;
    setInput('');

    // Ajouter le message utilisateur
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date()
    }]);

    try {
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
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response,
          provider: data.provider || 'groq',
          timestamp: new Date()
        }]);
        fetchQuota(user.id, plan);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `❌ ${data.error}`,
          error: true,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ Erreur: ${error.message}`,
        error: true,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Chargement...</p>
        </div>
      </div>
    );
  }

  const progressPercent = quota ? Math.round((quota.used / quota.limit) * 100) : 0;
  const planColors = {
    essai: 'from-amber-500 to-orange-500',
    standard: 'from-blue-500 to-cyan-500',
    premium: 'from-purple-500 to-pink-500',
    pro: 'from-indigo-500 to-purple-500',
    'pro-max': 'from-red-500 to-pink-500'
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-slate-700 bg-slate-900/50 backdrop-blur flex flex-col`}>
        <div className="p-4 border-b border-slate-700">
          <Link href="/plans" className="flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300">
            ⬆️ Mettre à niveau
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase">Conversations</h3>
          <div className="space-y-2">
            <div className="px-3 py-2 rounded bg-blue-600/20 border border-blue-500/30 text-sm cursor-pointer hover:bg-blue-600/30">
              💬 Conversation actuelle
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 space-y-2">
          <button className="w-full px-3 py-2 text-left text-sm hover:bg-slate-800 rounded transition">
            ⚙️ Paramètres
          </button>
          <button className="w-full px-3 py-2 text-left text-sm hover:bg-slate-800 rounded transition">
            ❓ Aide
          </button>
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-800 rounded transition text-slate-400 hover:text-slate-200"
              >
                ☰
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">🤖 ChatBot IA</h1>
                <p className="text-xs text-slate-400">Propulsé par Groq & Gemini</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* Plan Badge */}
              <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${planColors[plan]} text-white shadow-lg`}>
                {plan.toUpperCase()}
              </div>

              {/* Quota Info */}
              <div className="hidden sm:block text-right">
                <div className="text-xs text-slate-400">Quota {quota?.period === 'day' ? 'Jour' : 'Mois'}</div>
                <div className="text-sm font-bold text-white">
                  {quota?.remaining || 0} / {quota?.limit || 0}
                </div>
              </div>

              {/* Menu Button */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold hover:shadow-lg transition"
                >
                  {user?.email?.[0]?.toUpperCase()}
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-slate-700">
                      <p className="text-sm text-slate-400">Connecté en tant que</p>
                      <p className="text-sm font-semibold truncate">{user?.email}</p>
                    </div>
                    <Link href="/plans" className="block px-4 py-2 hover:bg-slate-700 transition text-sm">
                      📈 Voir les plans
                    </Link>
                    <button className="w-full text-left px-4 py-2 hover:bg-slate-700 transition text-sm">
                      ⚙️ Paramètres
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-slate-700 transition text-sm border-t border-slate-700 text-red-400">
                      🚪 Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quota Bar */}
          <div className="mt-4 hidden sm:block">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold">Quota utilisé</span>
              <span className="text-xs text-slate-400">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${progressPercent > 80 ? 'from-red-500 to-red-600' : planColors[plan]} transition-all duration-300`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold mb-2">Bienvenue!</h2>
              <p className="text-slate-400 mb-6 max-w-sm">
                Posez une question et je vais vous répondre. Je suis alimenté par les IA les plus puissantes.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-sm">
                {[
                  '💡 Parlez-moi de vous',
                  '🚀 Comment ça fonctionne?',
                  '📚 Donnez-moi un conseil',
                  '🎯 Répondez à une question'
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(suggestion);
                      setTimeout(() => inputRef.current?.focus(), 0);
                    }}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div
                className={`max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-2xl rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none shadow-lg'
                    : msg.error
                    ? 'bg-red-900/30 border border-red-700 text-red-200 rounded-bl-none'
                    : 'bg-slate-700/50 border border-slate-600 text-slate-100 rounded-bl-none'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.provider && (
                  <p className="text-xs text-slate-400 mt-2 italic">
                    ⚡ {msg.provider === 'groq' ? 'Groq (Llama)' : 'Gemini'}
                  </p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-700/50 border border-slate-600 text-slate-100 px-4 py-3 rounded-2xl rounded-bl-none">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-700 bg-slate-900/50 backdrop-blur-lg p-4">
          <form onSubmit={sendMessage} className="space-y-3">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                placeholder="Posez une question... (Maj+Entrée pour nouvelle ligne)"
                disabled={loading || quota?.remaining === 0}
                className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
              />
              <button
                type="submit"
                disabled={loading || quota?.remaining === 0 || !input.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? '⏳' : '➤'}
              </button>
            </div>

            {quota?.remaining === 0 && (
              <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                ⚠️ Quota atteint pour ce {quota?.period === 'day' ? 'jour' : 'mois'}.
                <Link href="/plans" className="font-semibold underline hover:text-red-100">
                  Mettre à niveau
                </Link>
              </div>
            )}

            <p className="text-xs text-slate-400 text-center">
              Appuyez sur Entrée pour envoyer • Maj+Entrée pour nouvelle ligne
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
