import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatDate, formatMoney } from '../format';

// Uses GET /accounts/:id/balance, refetched whenever `version` changes.
export default function BalanceCard({ account, version }) {
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.getBalance(account.id)
      .then((d) => { if (!cancelled) { setBalance(d.balance); setError(''); } })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [account.id, version]);

  return (
    <section className="card balance-card">
      <div>
        <h2>{account.name}</h2>
        <p className="muted small">ID: {account.id}</p>
        <p className="muted small">Created: {formatDate(account.created_at)}</p>
      </div>
      <div className="balance">
        <span className="muted small">Current balance</span>
        <strong data-testid="balance">{error ? '—' : balance === null ? '…' : formatMoney(balance)}</strong>
      </div>
    </section>
  );
}