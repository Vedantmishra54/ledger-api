import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import AccountList from './components/AccountList';
import BalanceCard from './components/BalanceCard';
import CreateAccount from './components/CreateAccount';
import Message from './components/Message';
import TransactionForm from './components/TransactionForm';
import TransactionHistory from './components/TransactionHistory';
import TransferForm from './components/TransferForm';

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Bumped after every successful write so lists, balance and history refetch.
  const [version, setVersion] = useState(0);

  const loadAccounts = useCallback(async () => {
    try {
      setAccounts(await api.listAccounts());
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts, version]);

  const refresh = () => setVersion((v) => v + 1);
  const selected = accounts.find((a) => a.id === selectedId);

  function handleCreated(account) {
    setSelectedId(account.id);
    refresh();
  }

  return (
    <div className="app">
      <header>
        <h1>Transaction Ledger</h1>
        <p className="muted">Accounts, credits, debits and transfers</p>
      </header>

      <Message kind="error">{error}</Message>

      <div className="layout">
        <aside>
          <CreateAccount onCreated={handleCreated} />
          <AccountList accounts={accounts} selectedId={selectedId} onSelect={setSelectedId} loading={loading} />
        </aside>

        <main>
          {selected ? (
            <>
              <BalanceCard account={selected} version={version} />
              {/* key = accountId resets each form/history when another account is picked */}
              <TransactionForm key={`tx-${selected.id}`} accountId={selected.id} onDone={refresh} />
              <TransactionHistory key={`h-${selected.id}`} accountId={selected.id} version={version} />
            </>
          ) : (
            <section className="card"><p className="muted">Select an account on the left, or create a new one.</p></section>
          )}
          {accounts.length >= 2 && (
            <TransferForm accounts={accounts} defaultFromId={selectedId} onDone={refresh} />
          )}
        </main>
      </div>
    </div>
  );
}