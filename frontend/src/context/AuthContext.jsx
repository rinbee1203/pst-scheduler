// src/context/AuthContext.jsx
// Provides global auth state (currentUser, token) to the entire app.
// Wrap your App with <AuthProvider> and use useAuth() in any component.

import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // checking stored token on mount

  // On app load: check if there's a token stored in memory (sessionStorage)
  // NOTE: We use sessionStorage so the session clears when the browser tab is closed.
  // You can switch to localStorage if you want persistent sessions.
  useEffect(() => {
    const storedToken = sessionStorage.getItem('pst_token');
    if (storedToken) {
      // Validate the token with the backend
      getMe(storedToken)
        .then(user => {
          setToken(storedToken);
          setCurrentUser(user);
        })
        .catch(() => {
          // Token is invalid or expired — clear it
          sessionStorage.removeItem('pst_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = (token, user) => {
    sessionStorage.setItem('pst_token', token);
    setToken(token);
    setCurrentUser(user);
  };

  const signOut = () => {
    sessionStorage.removeItem('pst_token');
    setToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Use this hook in any component to access auth state */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
