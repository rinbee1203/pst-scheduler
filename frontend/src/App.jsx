// src/App.jsx
// Root component. Wraps the app in AuthProvider and decides
// whether to show the AuthScreen or the MainApp.

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AuthScreen from './pages/AuthScreen.jsx';
import MainApp from './pages/MainApp.jsx';

function AppContent() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#060910',
        fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#818cf8',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏫</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>PST Scheduler</div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 8 }}>Loading…</div>
        </div>
      </div>
    );
  }

  return currentUser ? <MainApp /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
