export default function Message({ kind = 'error', children }) {
  if (!children) return null;
  return (
    <div className={`msg ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}