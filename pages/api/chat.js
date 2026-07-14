import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '@/lib/supabase';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, message, plan } = req.body;

  if (!userId || !message || !plan) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1️⃣ Vérifier quota
    const { canMakeRequest, remaining } = await checkQuota(userId, plan);
    if (!canMakeRequest) {
      return res.status(429).json({ 
        error: 'Quota dépassé',
        remaining: 0
      });
    }

    let aiResponse;
    let tokensUsed = 0;
    let provider = 'groq';

    try {
      // 2️⃣ Essayer Groq d'abord
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: message }],
        max_tokens: 1024,
      });

      aiResponse = response.choices[0].message.content;
      tokensUsed = response.usage.total_tokens;
    } catch (groqError) {
      console.log('Groq erreur, basculer vers Gemini...');
      
      // 3️⃣ Fallback sur Gemini
      const geminiModel = genai.getGenerativeModel({ 
        model: plan === 'pro-max' ? 'gemini-1.5-pro' : 'gemini-1.5-flash' 
      });
      
      const geminiResponse = await geminiModel.generateContent(message);
      aiResponse = geminiResponse.response.text();
      tokensUsed = 200; // Estimation
      provider = 'gemini';
    }

    // 4️⃣ Incrémenter quota
    await incrementQuota(userId, plan);

    // 5️⃣ Stocker historique
    await supabaseAdmin.from('chat_history').insert({
      user_id: userId,
      message,
      response: aiResponse,
      tokens_used: tokensUsed,
      provider,
    });

    return res.status(200).json({ 
      response: aiResponse, 
      tokensUsed,
      remaining: remaining - 1,
      provider
    });
  } catch (error) {
    console.error('Erreur chat:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Vérifier quota
async function checkQuota(userId, plan) {
  if (plan === 'essai') {
    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await supabaseAdmin
      .from('daily_usage')
      .select('request_count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    const count = data?.request_count || 0;
    return { 
      canMakeRequest: count < 50,
      remaining: Math.max(0, 50 - count)
    };
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

    const limits = { standard: 10000, premium: 30000, pro: 60000, 'pro-max': 100000 };
    const count = data?.request_count || 0;
    const limit = limits[plan] || 10000;
    
    return { 
      canMakeRequest: count < limit,
      remaining: Math.max(0, limit - count)
    };
  }
}

// Incrémenter quota
async function incrementQuota(userId, plan) {
  if (plan === 'essai') {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existing } = await supabaseAdmin
      .from('daily_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from('daily_usage')
        .update({ request_count: existing.request_count + 1 })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin
        .from('daily_usage')
        .insert({ user_id: userId, date: today, request_count: 1 });
    }
  } else {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0];

    const { data: existing } = await supabaseAdmin
      .from('monthly_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month', monthStart)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from('monthly_usage')
        .update({ request_count: existing.request_count + 1 })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin
        .from('monthly_usage')
        .insert({ user_id: userId, month: monthStart, request_count: 1 });
    }
  }
}
