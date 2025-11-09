import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, FileText, ArrowRight, Sun, Moon } from 'lucide-react';

export default function SignUp() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.description) {
      setError('Please fill in all required fields');
      return false;
    }
    if (formData.username && !/^[a-z0-9_-]+$/.test(formData.username)) {
      setError('Username can only contain lowercase letters, numbers, hyphens and underscores');
      return false;
    }
    if (formData.username && formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const registerData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        description: formData.description
      };
      
      // Add username if provided
      if (formData.username) {
        registerData.username = formData.username.toLowerCase();
      }

      const API_BASE_URL = process.env.REACT_APP_BACKEND_API_PATH || 'http://localhost:8000';
      const registerResponse = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      // Auto-login after registration
      const loginResponse = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      if (!loginResponse.ok) {
        throw new Error('Auto-login failed');
      }

      const loginData = await loginResponse.json();
      localStorage.setItem('access_token', loginData.access_token);
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-white'} flex items-center justify-center p-4`}>
      
      {/* Theme Toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className={`fixed top-4 right-4 p-2 ${
          isDark
            ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-2xl">
        <div className={`${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        } border p-8`}>
          
          {/* Header */}
          <div className="mb-6">
            <div className={`flex items-center gap-2 mb-4 text-xl font-medium ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <div className={`p-2 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <Mail size={20} />
              </div>
              yesreply
            </div>
            
            <h1 className={`text-xl font-light tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Create Account
            </h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`mb-4 p-3 border text-sm ${
              isDark 
                ? 'bg-red-900/20 border-red-800 text-red-400' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Email
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`} size={14} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2.5 text-sm border ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  } focus:outline-none focus:border-blue-500`}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Username (Optional) */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Username <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>(optional - for your @yesreply.tech email)</span>
              </label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`} size={14} />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
                  className={`w-full pl-10 pr-3 py-2.5 text-sm border ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  } focus:outline-none focus:border-blue-500`}
                  placeholder="johndoe (lowercase, no spaces)"
                  pattern="[a-z0-9_-]*"
                />
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                If not provided, it will be auto-generated from your email
              </p>
            </div>

            {/* Password & Confirm in One Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`} size={14} />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2.5 text-sm border ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    } focus:outline-none focus:border-blue-500`}
                    placeholder="8+ characters"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Confirm
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`} size={14} />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2.5 text-sm border ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    } focus:outline-none focus:border-blue-500`}
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>
            </div>

            {/* First & Last Name in One Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  First Name
                </label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`} size={14} />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2.5 text-sm border ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    } focus:outline-none focus:border-blue-500`}
                    placeholder="John"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Last Name
                </label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`} size={14} />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2.5 text-sm border ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    } focus:outline-none focus:border-blue-500`}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Description
              </label>
              <div className="relative">
                <FileText className={`absolute left-3 top-2.5 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`} size={14} />
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                  className={`w-full pl-10 pr-3 py-2.5 text-sm border resize-none ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  } focus:outline-none focus:border-blue-500`}
                  placeholder="Tell us about yourself..."
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 mt-2 border text-sm font-medium transition-all ${
                isDark 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
              } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className={`mt-5 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Already have an account?{' '}
            <button
              onClick={() => navigate('/')}
              className={`font-medium ${
                isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              } transition-colors`}
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
