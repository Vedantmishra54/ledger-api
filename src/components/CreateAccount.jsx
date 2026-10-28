import { useState } from 'react';
import { api } from '../api';
import Message from './Message';

export default function CreateAccount({ onCreated }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const account = await api.createAccount(name);
      setName('');
      onCreated(account);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>Create account</h2>
      <form onSubmit={submit}>
        <label>
          Account holder name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vedant" />
        </label>
        <button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
      <Message kind="error">{error}</Message>
    </section>
  );
}