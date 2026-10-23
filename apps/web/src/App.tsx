export function App() {
  return (
    <div
      role="region"
      aria-label="Taskbar strip"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        background: '#1b1b24',
        color: '#f2f2f7',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      Taskbar Hero
    </div>
  );
}
