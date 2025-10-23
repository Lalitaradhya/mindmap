import React, { createContext, useContext, useState, useEffect } from 'react';

// Define allowed emails (client-side fallback)
const ALLOWED_EMAILS = ['lalitaradhya@gmail.com', 'ipsraju@gmail.com'];

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start (e.g., from localStorage)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Check if stored user is authorized
      setAuthorized(ALLOWED_EMAILS.includes(parsedUser.email));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    if (ALLOWED_EMAILS.includes(userData.email)) {
      setUser(userData);
      setAuthorized(true);
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      // Unauthorized: Don't set user or authorized
      setAuthorized(false);
      throw new Error('Access denied: Your email is not authorized.');
    }
  };

  const logout = () => {
    setUser(null);
    setAuthorized(false);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    authorized,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
