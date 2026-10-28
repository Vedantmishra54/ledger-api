import { useState } from 'react';
import { api } from '../api';
import { formatMoney, newReference } from '../format';
import Message from './Message';

export default function TransactionForm({ accountId, onDone }) {
  const [type, setType] = useState('credit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState(() => newReference());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.addTransaction(accountId, {
        type,
        amount: amount === '' ? undefined : Number(amount),
        description: description || undefined,
        reference_id: reference,
      });
      setSuccess(
        `${type === 'credit' ? 'Credited' : 'Debited'} ${formatMoney(result.transaction.amount)}. ` +
        `New balance: ${formatMoney(result.balance)}`
      );
      setAmount('');
      setDescription('');
      setReference(newReference());
      onDone();
    } catch (err) {
      setError(
        err.code === 'DUPLICATE_TRANSACTION'
          ? 'Duplicate reference_id: this transaction already exists. Balance was not changed.'
          : err.message
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>Add transaction</h2>
      <form onSubmit={submit}>
        <div className="row">
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="credit">Credit (add money)</option>
              <option value="debit">Debit (remove money)</option>
            </select>
          </label>
          <label>
            Amount
            <input type="number" step="0.01" min="0" value={amount}
              onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </label>
        </div>
        <label>
          Description
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="optional" />
        </label>
        <label>
          Reference ID (must be unique for this account)
          <div className="inline">
            <input value={reference} onChange={(e) => setReference(e.target.value)} />
            <button type="button" className="secondary" onClick={() => setReference(newReference())}>
              Generate
            </button>
          </div>
        </label>
        <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Submit transaction'}</button>
      </form>
      <Message kind="error">{error}</Message>
      <Message kind="success">{success}</Message>
    </section>
  );
}