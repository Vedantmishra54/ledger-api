import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatMoney, newReference } from '../format';
import Message from './Message';

export default function TransferForm({ accounts, defaultFromId, onDone }) {
  const [from, setFrom] = useState(defaultFromId || '');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState(() => newReference('tr'));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { setFrom(defaultFromId || ''); }, [defaultFromId]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.createTransfer({
        from_account_id: from,
        to_account_id: to,
        amount: amount === '' ? undefined : Number(amount),
        description: description || undefined,
        reference_id: reference,
      });
      const name = (id) => (accounts.find((a) => a.id === id) || {}).name || 'account';
      setSuccess(
        `Transferred ${formatMoney(amount)} from ${name(from)} to ${name(to)}. ` +
        `New balances: ${name(from)} ${formatMoney(result.balances[from])}, ${name(to)} ${formatMoney(result.balances[to])}`
      );
      setAmount('');
      setDescription('');
      setReference(newReference('tr'));
      onDone();
    } catch (err) {
      setError(
        err.code === 'DUPLICATE_TRANSACTION'
          ? 'Duplicate reference_id: this transfer already exists. Nothing was changed.'
          : err.message
      );
    } finally {
      setBusy(false);
    }
  }

  const options = (
    <>
      <option value="">Select account…</option>
      {accounts.map((a) => (
        <option key={a.id} value={a.id}>{a.name} ({formatMoney(a.balance)})</option>
      ))}
    </>
  );

  return (
    <section className="card">
      <h2>Transfer money</h2>
      <form onSubmit={submit}>
        <div className="row">
          <label>From<select value={from} onChange={(e) => setFrom(e.target.value)}>{options}</select></label>
          <label>To<select value={to} onChange={(e) => setTo(e.target.value)}>{options}</select></label>
        </div>
        <div className="row">
          <label>
            Amount
            <input type="number" step="0.01" min="0" value={amount}
              onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </label>
          <label>
            Description
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="optional" />
          </label>
        </div>
        <label>
          Reference ID
          <div className="inline">
            <input value={reference} onChange={(e) => setReference(e.target.value)} />
            <button type="button" className="secondary" onClick={() => setReference(newReference('tr'))}>
              Generate
            </button>
          </div>
        </label>
        <button type="submit" disabled={busy}>{busy ? 'Transferring…' : 'Transfer'}</button>
      </form>
      <Message kind="error">{error}</Message>
      <Message kind="success">{success}</Message>
    </section>
  );
}