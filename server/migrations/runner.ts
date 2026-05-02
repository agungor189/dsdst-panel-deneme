import Database from "better-sqlite3";

interface Migration {
  version: number;
  name: string;
  up(db: Database.Database): void;
}

// Each migration runs exactly once. Never modify an existing migration — add a new one.
const migrations: Migration[] = [
  {
    version: 1,
    name: "add_type_to_stock_movements",
    up(db) {
      try { db.exec("ALTER TABLE stock_movements ADD COLUMN type TEXT DEFAULT 'ADJUST'"); } catch (_) {}
    },
  },
  {
    version: 2,
    name: "add_updated_at_to_sales",
    up(db) {
      try { db.exec("ALTER TABLE sales ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP"); } catch (_) {}
    },
  },
  {
    version: 3,
    name: "add_user_id_to_activity_logs",
    up(db) {
      try { db.exec("ALTER TABLE activity_logs ADD COLUMN user_id TEXT"); } catch (_) {}
      try { db.exec("CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id)"); } catch (_) {}
    },
  },
  {
    version: 4,
    name: "add_income_transaction_ref_to_sales",
    up(db) {
      // Link sales to their auto-created income transaction
      try { db.exec("ALTER TABLE sales ADD COLUMN income_transaction_id TEXT"); } catch (_) {}
    },
  },
  {
    version: 5,
    name: "add_return_support_to_sales",
    up(db) {
      try { db.exec("ALTER TABLE sales ADD COLUMN return_reason TEXT"); } catch (_) {}
      try { db.exec("ALTER TABLE sales ADD COLUMN returned_at DATETIME"); } catch (_) {}
    },
  },
  {
    version: 6,
    name: "add_users_extra_columns",
    up(db) {
      // is_active flag + last_login tracking
      try { db.exec("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1"); } catch (_) {}
      try { db.exec("ALTER TABLE users ADD COLUMN last_login_at DATETIME"); } catch (_) {}
      try { db.exec("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0"); } catch (_) {}
      try { db.exec("ALTER TABLE users ADD COLUMN locked_until DATETIME"); } catch (_) {}
    },
  },
  {
    version: 7,
    name: "add_permissions_to_users",
    up(db) {
      // JSON column for fine-grained per-user module permissions (overrides role defaults)
      try { db.exec("ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '{}'"); } catch (_) {}
      try { db.exec("ALTER TABLE users ADD COLUMN notes TEXT"); } catch (_) {}
    },
  },
  {
    version: 8,
    name: "add_pricing_history_table",
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS pricing_history (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL,
          purchase_price_usd REAL,
          purchase_cost REAL,
          sale_price REAL,
          buffer_percentage REAL,
          profit_percentage REAL,
          exchange_rate_used REAL,
          price_locked INTEGER,
          changed_by TEXT,
          change_reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_pricing_history_product ON pricing_history(product_id);
      `);
    },
  },
  {
    version: 9,
    name: "add_indexes_for_performance",
    up(db) {
      try { db.exec("CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status)"); } catch (_) {}
      try { db.exec("CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at)"); } catch (_) {}
      try { db.exec("CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id)"); } catch (_) {}
      try { db.exec("CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id)"); } catch (_) {}
      try { db.exec("CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at)"); } catch (_) {}
      try { db.exec("CREATE INDEX IF NOT EXISTS idx_cash_transactions_account ON cash_transactions(account_id)"); } catch (_) {}
    },
  },
  {
    version: 10,
    name: "normalize_pipe_size_column",
    up(db) {
      // Ensure normalized_pipe_size is always filled from normalized_size as fallback
      try {
        db.exec(`
          UPDATE products
          SET normalized_pipe_size = normalized_size
          WHERE normalized_pipe_size IS NULL AND normalized_size IS NOT NULL
        `);
      } catch (_) {}
    },
  },
  {
    version: 11,
    name: "add_sale_items_line_profit",
    up(db) {
      // shipping/commission apportioned per line for accurate per-item reporting
      try { db.exec("ALTER TABLE sale_items ADD COLUMN commission_amount REAL DEFAULT 0"); } catch (_) {}
      try { db.exec("ALTER TABLE sale_items ADD COLUMN shipping_share REAL DEFAULT 0"); } catch (_) {}
    },
  },
];

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version   INTEGER PRIMARY KEY,
      name      TEXT    NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const applied = new Set(
    (db.prepare("SELECT version FROM schema_migrations").all() as { version: number }[]).map(
      (r) => r.version,
    ),
  );

  const insertMigration = db.prepare(
    "INSERT INTO schema_migrations (version, name) VALUES (?, ?)",
  );

  const sorted = [...migrations].sort((a, b) => a.version - b.version);
  let applied_count = 0;

  for (const migration of sorted) {
    if (applied.has(migration.version)) continue;

    db.transaction(() => {
      migration.up(db);
      insertMigration.run(migration.version, migration.name);
    })();

    console.log(`[Migration] Applied v${migration.version}: ${migration.name}`);
    applied_count++;
  }

  if (applied_count > 0) {
    console.log(`[Migration] ${applied_count} migration(s) applied.`);
  }
}
