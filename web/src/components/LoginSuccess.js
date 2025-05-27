import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* global chrome */

const LoginSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('LoginSuccess: Token retrieved:', token ? 'exists' : 'not found');
    
    if (typeof chrome !== 'undefined' && chrome.runtime && token) {
      console.log('LoginSuccess: Attempting to send token to extension');
      try {
        chrome.runtime.sendMessage(
          'emffpmipdfpfhkbhobooeehipjmjjgmh',
          { 
            type: 'AUTH_TOKEN',
            token: token
          },
          (response) => {
            console.log('LoginSuccess: Response from extension:', response);
            if (chrome.runtime.lastError) {
              console.log('LoginSuccess: Extension error:', chrome.runtime.lastError);
            } else if (response && response.success) {
              console.log('LoginSuccess: Token successfully stored in extension');
            }
            // Add a small delay before redirecting
            setTimeout(() => {
              navigate('/profile');
            }, 1000);
          }
        );
      } catch (error) {
        console.log('LoginSuccess: Error communicating with extension:', error);
        navigate('/profile');
      }
    } else {
      console.log('LoginSuccess: Chrome runtime not available or no token');
      navigate('/profile');
    }
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Login Successful!</h2>
      <p>Connecting to extension...</p>
    </div>
  );
};

export default LoginSuccess; 