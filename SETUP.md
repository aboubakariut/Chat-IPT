# 🚀 Guide d'installation complet

## Étape 1 : Cloner et installer

```bash
# Copier tous les fichiers du projet
cp -r chatbot-project ~/Desktop/chatbot
cd ~/Desktop/chatbot

# Installer les dépendances
npm install
```

## Étape 2 : Configurer Supabase

### 2.1 Créer un projet Supabase
1. Aller sur https://supabase.com
2. Créer nouveau projet
3. Copier l'URL et les clés API

### 2.2 Ajouter la table d'authentification
Supabase crée automatiquement une table `auth.users` lors de la création du projet. Rien à faire.

### 2.3 Créer les tables personnalisées

Dans Supabase SQL Editor, exécutez :

```sql
-- Table utilisateurs (lié à auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- RLS sur les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Policies utilisateurs
CREATE POLICY "Users can see their own data"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can see their own usage"
ON daily_usage FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can see their monthly usage"
ON monthly_usage FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can see their own payments"
ON payments FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert payments"
ON payments FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can see their chat history"
ON chat_history FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert chat history"
ON chat_history FOR INSERT
WITH CHECK (user_id = auth.uid());
```

### 2.4 Activer l'authentification Email
1. Dans Supabase, aller dans **Authentication** → **Providers**
2. Activer **Email**
3. Copier les paramètres SMTP (optionnel pour production)

## Étape 3 : Configurer les variables d'environnement

### 3.1 Copier le fichier exemple
```bash
cp .env.local.example .env.local
```

### 3.2 Récupérer les clés

**Supabase** (https://supabase.com/dashboard) :
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Groq** (https://console.groq.com) :
```
GROQ_API_KEY=gsk_...
```

**Gemini** (https://aistudio.google.com/app/apikey) :
```
GEMINI_API_KEY=AIzaSy...
```

### 3.3 Remplir .env.local
```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_NAME=ChatBot SaaS
ADMIN_EMAIL=admin@example.com
```

## Étape 4 : Lancer le serveur

```bash
npm run dev
```

Allez sur http://localhost:3000

## Étape 5 : Créer un compte admin

1. S'inscrire normalement sur l'app
2. Dans Supabase, dans la table `users`, modifier votre ligne :
   - Mettre `role = 'admin'`
   - Mettre `plan = 'pro-max'`
3. Accéder au dashboard admin : http://localhost:3000/admin/dashboard

## ✅ Checklist final

- [ ] npm install réussi
- [ ] Supabase configuré (URL + clés)
- [ ] Tables SQL créées
- [ ] Storage bucket 'screenshots' créé
- [ ] .env.local rempli
- [ ] npm run dev fonctionne
- [ ] Compte créé et testé
- [ ] Admin role attribué

## 🧪 Test rapide

1. **Signup** → http://localhost:3000
2. **Chat** → Envoyer un message
3. **Plans** → /plans
4. **Payment** → /payment?plan=standard
5. **Admin** → /admin/dashboard

## 📞 Troubleshooting

**Erreur "Cannot find module"**
```bash
npm install
```

**Supabase connection error**
- Vérifier les clés API dans .env.local
- Vérifier que le projet Supabase est actif

**Groq/Gemini error**
- Vérifier les clés API
- Vérifier que les comptes ont du crédit/accès

## 🎉 C'est bon !

Votre chatbot SaaS est prêt à déployer sur Vercel, Netlify, ou Railway.
