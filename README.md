# 💬 ChatBot SaaS - Groq + Gemini + Supabase

Un chatbot SaaS moderne avec système d'abonnement par Orange Money.

## 🎯 Caractéristiques

- **IA Dual-Engine** : Groq (primary) + Gemini (fallback)
- **5 Plans tarifaires** : Essai gratuit, Standard, Premium, Pro, Pro Max
- **Paiement Orange Money** : Capture de preuve + validation admin
- **Dashboard Admin** : Valider/rejeter les paiements
- **Tracking Quota** : Quotas journaliers (Essai) et mensuels (Payants)
- **Historique Chat** : Sauvegarde complète des conversations

## 📋 Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase
- Clés API : Groq, Gemini

## 🚀 Installation

### 1. Cloner le projet
```bash
npm install
```

### 2. Configurer les variables d'environnement
```bash
cp .env.local.example .env.local
```

Puis remplissez `.env.local` avec vos clés API :
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Créer la base de données Supabase

Exécutez ce SQL dans Supabase SQL Editor :

```sql
-- Table utilisateurs
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE NOT NULL,
  plan VARCHAR DEFAULT 'essai',
  role VARCHAR DEFAULT 'user',
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table usage quotidien
CREATE TABLE daily_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  request_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Table usage mensuel
CREATE TABLE monthly_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  request_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Table paiements
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR NOT NULL,
  amount INT NOT NULL,
  orange_number VARCHAR NOT NULL,
  screenshot_url VARCHAR,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  validated_at TIMESTAMP
);

-- Table historique chat
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  tokens_used INT,
  provider VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Créer le bucket Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('screenshots', 'screenshots', true);

-- Policy pour uploads
CREATE POLICY "Users can upload screenshots"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'screenshots');
```

### 4. Lancer le serveur
```bash
npm run dev
```

L'app est disponible à `http://localhost:3000`

## 📁 Structure du projet

```
/pages
  /api
    /admin
      payments.js      → API admin pour valider paiements
    chat.js            → API chatbot
    quota.js           → API quota utilisateur
    payments.js        → API paiements
  /admin
    dashboard.js       → Dashboard admin
  index.js             → Page login/signup
  chat.js              → Chat principal
  plans.js             → Plans tarifaires
  payment.js           → Paiement + upload

/lib
  supabase.js          → Client Supabase

/styles
  globals.css          → Styles global
```

## 💳 Plans tarifaires

| Plan | Requêtes | Prix | IA |
|---|---|---|---|
| Essai | 50/jour | 0 | Groq |
| Standard | 10,000/mois | 2,500 FCFA | Groq |
| Premium | 30,000/mois | 6,000 FCFA | Groq |
| Pro | 60,000/mois | 12,000 FCFA | Groq + Fallback |
| Pro Max | 100,000/mois | 75,000 FCFA | Gemini Pro |

## 🔐 Sécurité

- ✅ JWT Auth via Supabase
- ✅ Row-Level Security (RLS)
- ✅ Clés API côté serveur uniquement
- ✅ Uploads validés côté serveur

## 📞 Support

Pour toute question, contactez : admin@votrechatbot.com

## 📄 License

MIT
