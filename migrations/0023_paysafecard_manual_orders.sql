PRAGMA foreign_keys = ON;

-- EPL v21.3.1: manual PaysafeCard code workflow.
-- While an order is WAITING/UNDER_REVIEW, pin_cipher stores the submitted 16-digit code for Full Admin review.
-- No PAYSAFE_PIN_KEY is required. After APPROVED/REJECTED, the complete code is erased and only the last 4 digits remain.
CREATE TABLE IF NOT EXISTS paysafe_orders (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_kind TEXT NOT NULL CHECK(order_kind IN ('SHOP_ITEM','COIN_PACK')),
  item_id INTEGER REFERENCES shop_items(id) ON DELETE SET NULL,
  pack_id TEXT,
  coins INTEGER NOT NULL DEFAULT 0,
  amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  pin_cipher TEXT,
  pin_fingerprint TEXT NOT NULL,
  pin_last4 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'WAITING' CHECK(status IN ('WAITING','UNDER_REVIEW','PAID','REJECTED','CANCELLED')),
  review_after TEXT NOT NULL,
  code_viewed_at TEXT,
  code_viewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  handled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  handled_at TEXT,
  admin_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_paysafe_orders_user_created ON paysafe_orders(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paysafe_orders_status_created ON paysafe_orders(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paysafe_orders_fingerprint ON paysafe_orders(pin_fingerprint);
