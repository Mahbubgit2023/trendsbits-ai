-- Run this in your Supabase SQL editor

CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username            TEXT UNIQUE NOT NULL,
  email               TEXT UNIQUE NOT NULL,
  password_hash       TEXT NOT NULL,
  role                TEXT NOT NULL DEFAULT 'user',   -- 'user' | 'admin'
  plan                TEXT DEFAULT NULL,              -- 'starter' | 'pro'
  active              BOOLEAN NOT NULL DEFAULT false,
  access_expires_at   TIMESTAMPTZ DEFAULT NULL,
  stripe_customer_id  TEXT DEFAULT NULL,
  device_ids          TEXT[] DEFAULT '{}',  -- list of allowed device IDs
  max_devices         INT DEFAULT 1,        -- 1 = single, 2 = dual
  gemini_enabled      BOOLEAN DEFAULT false, -- true on 'all tools' plans
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  model         TEXT NOT NULL,   -- 'chatgpt' | 'claude' | 'gemini'
  message_count INT DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Make yourself admin (run after registering your account)
-- UPDATE users SET role = 'admin' WHERE email = 'mahbub.dm2023@gmail.com';
