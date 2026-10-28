import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatDate, formatMoney } from '../format';
import Message from './Message';

const LIMIT = 10;

// Server does filtering, sorting (latest first) and pagination; we just render it.
export default function TransactionHistory({ accountId, version }) {
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ rows: [], pagination: null, loading: true, error: '' });

  useEffect(() => {
    let cancelled = false; // ignore stale responses if the user clicks fast
    setState((s) => ({ ...s, loading: true, error: '' }));
    api.listTransactions(accountId, { type, page, limit: LIMIT })
      .then(({ data, pagination }) => {
        if (!cancelled) setState({ rows: data, pagination, loading: false, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setState({ rows: [], pagination: null, loading: false, error: err.message });
      });
    return () => { cancelled = true; };
  }, [accountId, type, page, version]);

  const { rows, pagination, loading, error } = state;
  const totalPages = pagination ? Math.max(pagination.total_pages, 1) : 1;

  function changeType(value) {
    setType(value);
    setPage(1);
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2>Transaction history</h2>
        <select value={type} onChange={(e) => changeType(e.target.value)} aria-label="Filter by type">
          <option value="">All</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
      </div>

      <Message kind="error">{error}</Message>
      {loading && <p className="muted">Loading…</p>}
      {!loading && !error && rows.length === 0 && <p className="muted">No transactions found.</p>}

      {rows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Type</th><th className="num">Amount</th><th>Description</th><th>Reference</th></tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>{formatDate(t.created_at)}</td>
                  <td><span className={`badge ${t.type}`}>{t.type}</span></td>
                  <td className="num">{formatMoney(t.amount)}</td>
                  <td>{t.description || '—'}</td>
                  <td className="mono">{t.reference_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && (
        <div className="pager">
          <button type="button" className="secondary" disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {pagination.current_page} of {totalPages} · {pagination.total_records} records</span>
          <button type="button" className="secondary" disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </section>
  );
}