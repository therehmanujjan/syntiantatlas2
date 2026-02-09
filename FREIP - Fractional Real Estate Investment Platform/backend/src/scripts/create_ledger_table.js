import { query } from '../config/database.js';

const createLedgerTable = async () => {
    try {
        console.log('Creating ledger_entries table...');
        await query(`
      CREATE TABLE IF NOT EXISTS ledger_entries (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        amount DECIMAL(15, 2) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
        description TEXT,
        balance_after DECIMAL(15, 2),
        reference_id VARCHAR(255),
        reference_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Add index for faster lookups
        await query('CREATE INDEX IF NOT EXISTS idx_ledger_user_id ON ledger_entries(user_id);');

        console.log('✅ Ledger table created successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating ledger table:', error);
        process.exit(1);
    }
};

createLedgerTable();
