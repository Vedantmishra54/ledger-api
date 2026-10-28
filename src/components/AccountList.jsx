import { formatMoney } from '../format';

export default function AccountList({ accounts, selectedId, onSelect, loading }) {
  return (
    <section className="card">
      <h2>Accounts</h2>
      {loading && <p className="muted">Loading…</p>}
      {!loading && accounts.length === 0 && <p className="muted">No accounts yet. Create one above.</p>}
      <ul className="account-list">
        {accounts.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              className={`account-item ${a.id === selectedId ? 'active' : ''}`}
              onClick={() => onSelect(a.id)}
            >
              <span className="account-name">{a.name}</span>
              <span className="account-balance">{formatMoney(a.balance)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}