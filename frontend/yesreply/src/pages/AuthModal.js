import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AuthModal({ isOpen, onClose, isDark }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError('');
    
    // Validate fields
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const formData = {
      email,
      password
    };
    
    fetch(process.env.REACT_APP_BACKEND_API_PATH + '/api/users/login', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(async response => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      return data;
    })
    .then(data => {
      console.log('Login response:', data);
      // Store the access token in localStorage
      localStorage.setItem('access_token', data.access_token);
      // Close modal and redirect to dashboard
      onClose();
      navigate('/dashboard');
    })
    .catch(error => {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className={`w-full max-w-md ${
        isDark ? 'bg-slate-800' : 'bg-white'
      } p-10 border ${
        isDark ? 'border-slate-700' : 'border-slate-200'
      } relative`}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-6 right-6 p-2 ${
            isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-10">
          <div className={`flex items-center gap-3 mb-8 text-xl font-medium ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            <div className={`p-2 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <Mail size={20} />
            </div>
            yesreply
          </div>
          
          <h2 className={`text-2xl font-light tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Welcome Back
          </h2>
          <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Log in to continue to your dashboard
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`mb-8 p-4 border ${
            isDark 
              ? 'bg-red-900/20 border-red-800' 
              : 'bg-red-50 border-red-200'
          } flex items-start gap-3`}>
            <X className={isDark ? 'text-red-400' : 'text-red-600'} size={18} />
            <div className="flex-1">
              <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                {error}
              </p>
            </div>
            <button 
              onClick={() => setError('')}
              className={isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className={`block text-sm font-medium mb-2 uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Email Address
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`} size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-11 pr-4 py-3 text-base border ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                } focus:outline-none focus:border-blue-500`}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className={`block text-sm font-medium mb-2 uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Password
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`} size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-11 pr-4 py-3 text-base border ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                } focus:outline-none focus:border-blue-500`}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-4 border text-base font-medium flex items-center justify-center gap-2 transition-all ${
              isDark 
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
            }`}
          >
            Login
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Sign up link */}
        <div className={`mt-8 text-center text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Don't have an account?{' '}
          <button
            onClick={() => {
              onClose();
              navigate('/signup');
            }}
            className={`font-medium ${
              isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
            } transition-colors`}
          >
            Sign up here
          </button>
        </div>
      </div>
    </div>
  );
}
