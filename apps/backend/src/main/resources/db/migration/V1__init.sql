CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_type VARCHAR(20) DEFAULT 'FREE',
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE rooms (
  id VARCHAR(8) PRIMARY KEY,
  name VARCHAR(100),
  host_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  max_members INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id VARCHAR(8) REFERENCES rooms(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(10) NOT NULL,
  joined_at TIMESTAMP DEFAULT now(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE code_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id VARCHAR(8) REFERENCES rooms(id),
  user_id UUID REFERENCES users(id),
  code_snapshot TEXT,
  language VARCHAR(20),
  saved_at TIMESTAMP DEFAULT now()
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id VARCHAR(8) REFERENCES rooms(id),
  user_id UUID REFERENCES users(id),
  code TEXT,
  language VARCHAR(20),
  output TEXT,
  status VARCHAR(20),
  executed_at TIMESTAMP DEFAULT now()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  amount INT,
  currency VARCHAR(5) DEFAULT 'INR',
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE voice_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id VARCHAR(8) REFERENCES rooms(id),
  user_id UUID REFERENCES users(id),
  is_muted BOOLEAN DEFAULT false,
  muted_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(room_id, user_id)
);
