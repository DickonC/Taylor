import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Handles login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        // Store the token in localStorage
        localStorage.setItem('token', data.token);
        navigate('/login-success');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 80 }}>
      <div style={{ textAlign: 'center', maxWidth: 350, width: '100%' }}>
        <h2>Login</h2>
        <form onSubmit={handleLogin} style={{ marginTop: 30 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 10, marginBottom: 10, fontSize: 16 }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 10, marginBottom: 10, fontSize: 16 }}
          />
          {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              padding: 10, 
              fontSize: 16, 
              background: '#0077ff', 
              color: 'white',
              border: 'none', 
              cursor: 'pointer',
              marginBottom: 10,
              borderRadius: 4
            }}
          >
            Log In
          </button>
        </form>
        <button 
          onClick={() => navigate('/signup')} 
          style={{ 
            width: '100%', 
            padding: 10, 
            fontSize: 16, 
            background: '#eee',
            border: 'none', 
            cursor: 'pointer',
            borderRadius: 4
          }}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}

export default Login;