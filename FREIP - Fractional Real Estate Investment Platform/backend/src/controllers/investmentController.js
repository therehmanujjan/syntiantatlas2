import { getClient, query } from '../config/database.js'; // Import query for fallback
import { Investment, Property, User } from '../models/index.js';

export const investInProperty = async (req, res) => {
  const client = await getClient();
  const executeQuery = client ? (text, params) => client.query(text, params) : query;

  try {
    if (client) await client.query('BEGIN'); // Start Transaction

    const { property_id, amount } = req.body;

    // 1. Lock the property row for update (if real DB)
    const propertyRes = await executeQuery(
      client ? 'SELECT * FROM properties WHERE id = $1 FOR UPDATE' : 'SELECT * FROM properties WHERE id = $1',
      [property_id]
    );
    const property = propertyRes.rows[0];

    if (!property) {
      if (client) await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Property not found' });
    }

    // 2. Validate Investment Constraints
    if (amount < property.min_investment || amount > property.max_investment) {
      if (client) await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Investment must be between PKR ${property.min_investment} and PKR ${property.max_investment}`
      });
    }

    // Check if property is already fully funded
    if (property.funding_raised >= property.funding_target) {
      if (client) await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Property is already fully funded' });
    }

    // Check if new amount exceeds funding target
    if ((Number(property.funding_raised) + Number(amount)) > property.funding_target) {
      if (client) await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Investment exceeds remaining funding needed' });
    }

    // 3. Lock and Check User Wallet
    const userRes = await executeQuery(
      client ? 'SELECT * FROM users WHERE id = $1 FOR UPDATE' : 'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = userRes.rows[0];

    if (user.wallet_balance < amount) {
      if (client) await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    // 4. Calculate new values
    const shares = (amount / property.total_value) * 100;
    const ownership = (amount / property.funding_target) * 100;

    // 5. Create Investment Record
    const investmentRes = await executeQuery(
      `INSERT INTO investments (user_id, property_id, amount_invested, shares_owned, ownership_percentage, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [req.user.id, property_id, amount, shares, ownership]
    );
    const investment = investmentRes.rows[0];

    // 6. Update Property Funding
    await executeQuery(
      'UPDATE properties SET funding_raised = funding_raised + $1, updated_at = NOW() WHERE id = $2',
      [amount, property_id]
    );

    // 7. Deduct from User Wallet
    await executeQuery(
      'UPDATE users SET wallet_balance = wallet_balance - $1, updated_at = NOW() WHERE id = $2',
      [amount, req.user.id]
    );

    // 8. Create Ledger Entry (Debiting User)
    await executeQuery(
      `INSERT INTO ledger_entries (user_id, amount, type, description, balance_after, created_at)
         VALUES ($1, $2, 'debit', $3, $4, NOW())`,
      [req.user.id, amount, `Investment in Property #${property_id}`, user.wallet_balance - amount]
    ).catch(e => console.warn("Ledger insert failed (table might be missing):", e.message));

    // 9. Log Transaction (Audit)
    await executeQuery(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address) 
         VALUES ($1, 'investment', 'investment', $2, $3, $4)`,
      [req.user.id, investment.id, JSON.stringify({ amount, property_id }), req.ip]
    );

    if (client) await client.query('COMMIT'); // Commit Transaction

    res.status(201).json({
      message: 'Investment successful',
      investment: {
        ...investment,
        shares: shares,
        ownership_percentage: ownership
      }
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Investment Transaction Failed:', error);
    res.status(500).json({ error: 'Investment failed due to system error' });
  } finally {
    if (client) client.release();
  }
};

export const getInvestorPortfolio = async (req, res) => {
  try {
    const investments = await Investment.findByUser(req.user.id);

    let totalInvested = 0;
    let totalReturns = 0;

    const portfolioItems = await Promise.all(
      investments.map(async (inv) => {
        const property = await Property.findById(inv.property_id);
        totalInvested += Number(inv.amount_invested);
        totalReturns += Number(inv.returns_earned || 0);

        return {
          ...inv,
          property: {
            title: property.title,
            city: property.city,
            status: property.status
          }
        };
      })
    );

    res.json({
      total_invested: totalInvested,
      total_returns: totalReturns,
      current_value: totalInvested + totalReturns,
      investment_count: investments.length,
      portfolio: portfolioItems
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPropertyInvestments = async (req, res) => {
  try {
    const { property_id } = req.params;

    const property = await Property.findById(property_id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const investments = await Investment.findByProperty(property_id);

    res.json({
      property_id,
      investor_count: investments.length,
      total_raised: investments.reduce((sum, inv) => sum + Number(inv.amount_invested), 0),
      funding_target: property.funding_target,
      funding_percentage: (investments.reduce((sum, inv) => sum + Number(inv.amount_invested), 0) / property.funding_target) * 100,
      investments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
