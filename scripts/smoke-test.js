// Quick end-to-end check of the assignment rules. Run the server first, then: npm run test:smoke
const BASE = process.env.BASE_URL || 'http://localhost:3000';
let pass = 0, fail = 0;

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, body: json };
}
function check(name, cond) {
  cond ? pass++ : fail++;
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}`);
}
const uid = () => Math.random().toString(36).slice(2, 9);
const newAccount = async (name = 'Test') => (await call('POST', '/accounts', { name })).body.data;
const tx = (id, type, amount, ref = uid()) =>
  call('POST', `/accounts/${id}/transactions`, { type, amount, description: 'test', reference_id: ref });
const balance = async (id) => (await call('GET', `/accounts/${id}/balance`)).body.data.balance;

(async () => {
  console.log('\n[Accounts]');
  let r = await call('POST', '/accounts', { name: 'Vedant', balance: 999 });
  check('create account -> 201, balance forced to 0', r.status === 201 && r.body.data.balance === 0);
  check('missing name -> 400', (await call('POST', '/accounts', {})).status === 400);
  check('bad JSON body -> 400', (await fetch(BASE + '/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' })).status === 400);

  console.log('\n[Credit / Debit / Balance consistency]');
  const a = await newAccount('A');
  await tx(a.id, 'credit', 100); await tx(a.id, 'credit', 50);
  await tx(a.id, 'debit', 30);   await tx(a.id, 'debit', 20);
  check('0 +100 +50 -30 -20 = 100', (await balance(a.id)) === 100);

  console.log('\n[Rejections]');
  r = await tx(a.id, 'debit', 150);
  check('debit > balance -> 422, balance unchanged', r.status === 422 && (await balance(a.id)) === 100);
  check('invalid type -> 400', (await tx(a.id, 'refund', 10)).status === 400);
  check('amount 0 -> 400', (await tx(a.id, 'credit', 0)).status === 400);
  check('negative amount -> 400', (await tx(a.id, 'credit', -5)).status === 400);
  check('string amount -> 400', (await tx(a.id, 'credit', '10')).status === 400);
  check('missing reference_id -> 400', (await call('POST', `/accounts/${a.id}/transactions`, { type: 'credit', amount: 5 })).status === 400);
  check('unknown account -> 404', (await tx('00000000-0000-4000-8000-000000000000', 'credit', 5)).status === 404);
  check('malformed account id -> 400', (await tx('abc', 'credit', 5)).status === 400);
  check('balance of unknown account -> 404', (await call('GET', '/accounts/00000000-0000-4000-8000-000000000000/balance')).status === 404);

  console.log('\n[Duplicate reference_id]');
  const b = await newAccount('B');
  await tx(a.id, 'credit', 10, 'dup-1');
  r = await tx(a.id, 'credit', 10, 'dup-1');
  check('same ref, same account -> 409, balance unchanged', r.status === 409 && (await balance(a.id)) === 110);
  r = await tx(b.id, 'credit', 10, 'dup-1');
  check('same ref, different account -> 201', r.status === 201);

  console.log('\n[History: filter, pagination, sorting]');
  const h = await newAccount('H');
  await tx(h.id, 'credit', 100); await tx(h.id, 'debit', 10); await tx(h.id, 'credit', 5);
  r = await call('GET', `/accounts/${h.id}/transactions?page=1&limit=2`);
  check('page 1 limit 2 -> 2 rows, total 3, pages 2', r.body.data.length === 2 && r.body.pagination.total_records === 3 && r.body.pagination.total_pages === 2);
  check('latest first', new Date(r.body.data[0].created_at) >= new Date(r.body.data[1].created_at) && r.body.data[0].amount === 5);
  r = await call('GET', `/accounts/${h.id}/transactions?type=debit`);
  check('filter type=debit -> 1 row', r.body.data.length === 1 && r.body.data[0].type === 'debit');
  check('invalid page -> 400', (await call('GET', `/accounts/${h.id}/transactions?page=0`)).status === 400);
  check('invalid limit -> 400', (await call('GET', `/accounts/${h.id}/transactions?limit=abc`)).status === 400);
  check('invalid type filter -> 400', (await call('GET', `/accounts/${h.id}/transactions?type=xyz`)).status === 400);

  console.log('\n[Immutability]');
  const txId = r.body.data[0].id;
  check('DELETE transaction -> 405', (await call('DELETE', `/accounts/${h.id}/transactions/${txId}`)).status === 405);
  check('PUT transaction -> 405', (await call('PUT', `/accounts/${h.id}/transactions/${txId}`, {})).status === 405);

  console.log('\n[Concurrency: 5 parallel debits of 30 on balance 100]');
  const c = await newAccount('C');
  await tx(c.id, 'credit', 100);
  const results = await Promise.all([1, 2, 3, 4, 5].map(() => tx(c.id, 'debit', 30)));
  const ok = results.filter((x) => x.status === 201).length;
  check('exactly 3 succeed', ok === 3);
  check('final balance 10 (never negative)', (await balance(c.id)) === 10);

  console.log('\n[Transfer]');
  const x = await newAccount('X'), y = await newAccount('Y');
  await tx(x.id, 'credit', 100); await tx(y.id, 'credit', 50);
  r = await call('POST', '/transfers', { from_account_id: x.id, to_account_id: y.id, amount: 30, reference_id: 'tr-' + uid() });
  check('transfer 30 -> 201', r.status === 201);
  check('X=70, Y=80', (await balance(x.id)) === 70 && (await balance(y.id)) === 80);
  r = await call('POST', '/transfers', { from_account_id: x.id, to_account_id: y.id, amount: 500, reference_id: 'tr-' + uid() });
  check('insufficient transfer -> 422, nothing changed', r.status === 422 && (await balance(x.id)) === 70 && (await balance(y.id)) === 80);
  r = await call('POST', '/transfers', { from_account_id: x.id, to_account_id: '00000000-0000-4000-8000-000000000000', amount: 10, reference_id: 'tr-' + uid() });
  check('unknown destination -> 404, source unchanged', r.status === 404 && (await balance(x.id)) === 70);
  r = await call('POST', '/transfers', { from_account_id: x.id, to_account_id: x.id, amount: 10, reference_id: 'tr-' + uid() });
  check('same account -> 400', r.status === 400);

  console.log(`\nResult: ${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})();
