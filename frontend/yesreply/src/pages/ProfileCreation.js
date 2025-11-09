import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, ChevronLeft, User, Briefcase, Target, Link as LinkIcon, 
  Check, Mail, Sparkles, Rocket, TrendingUp, Users, Globe, 
  Award, Zap, Heart, MessageCircle, Star, Building2, ArrowRight, Sun, Moon
} from 'lucide-react';

export default function ProfileCreation() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [particles, setParticles] = useState([]);
  const [isDark, setIsDark] = useState(true);

  // Form data state
  const [formData, setFormData] = useState({
    // Account credentials
    email: '',
    password: '',
    confirmPassword: '',
    // Basic info
    firstName: '',
    lastName: '',
    jobTitle: '',
    company: '',
    location: '',
    // Professional details
    industry: '',
    experienceLevel: '',
    companySize: '',
    areasOfInterest: [],
    // About
    bio: '',
    expertise: '',
    lookingFor: [],
    // Social links
    linkedinUrl: '',
    twitterUrl: '',
    websiteUrl: '',
    calendlyUrl: ''
  });

  const steps = [
    {
      id: 0,
      title: 'Account & Profile',
      icon: User,
      gradient: 'from-blue-600 to-blue-500',
      description: 'Create your account and basic information'
    },
    {
      id: 1,
      title: 'Professional Background',
      icon: Briefcase,
      gradient: 'from-blue-600 to-blue-500',
      description: 'Your industry and experience'
    },
    {
      id: 2,
      title: 'About & Objectives',
      icon: Target,
      gradient: 'from-blue-600 to-blue-500',
      description: 'Your expertise and goals'
    },
    {
      id: 3,
      title: 'Connect',
      icon: LinkIcon,
      gradient: 'from-blue-600 to-blue-500',
      description: 'Your professional profiles'
    }
  ];

  const industries = [
    { value: 'Venture Capital', icon: TrendingUp },
    { value: 'Technology', icon: Zap },
    { value: 'Healthcare', icon: Heart },
    { value: 'Finance', icon: Award },
    { value: 'E-commerce', icon: Globe },
    { value: 'SaaS', icon: Rocket },
    { value: 'Real Estate', icon: Building2 },
    { value: 'Manufacturing', icon: Building2 },
    { value: 'Education', icon: Users },
    { value: 'Other', icon: Star }
  ];

  const experienceLevels = [
    { value: 'Entry Level (0-2 years)', label: 'Just Starting Out', subtitle: 'Beginning your journey' },
    { value: 'Mid Level (3-5 years)', label: 'Growing Professional', subtitle: 'Building expertise' },
    { value: 'Senior (6-10 years)', label: 'Seasoned Expert', subtitle: 'Established leader' },
    { value: 'Executive (10+ years)', label: 'Industry Veteran', subtitle: 'Visionary leader' }
  ];

  const companySizes = [
    'Solo/Founder',
    '2-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '500+ employees'
  ];

  const interestOptions = [
    { value: 'Fundraising', icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
    { value: 'Networking', icon: Users, color: 'from-blue-500 to-cyan-500' },
    { value: 'Partnerships', icon: MessageCircle, color: 'from-purple-500 to-pink-500' },
    { value: 'Mentorship', icon: Award, color: 'from-orange-500 to-red-500' },
    { value: 'Investment Opportunities', icon: Rocket, color: 'from-indigo-500 to-blue-500' },
    { value: 'Market Insights', icon: TrendingUp, color: 'from-teal-500 to-green-500' },
    { value: 'Talent Acquisition', icon: Users, color: 'from-violet-500 to-purple-500' },
    { value: 'Advisory Roles', icon: Star, color: 'from-yellow-500 to-orange-500' }
  ];

  const lookingForOptions = [
    { value: 'Investment Opportunities', icon: TrendingUp },
    { value: 'Co-founders', icon: Users },
    { value: 'Advisors', icon: Award },
    { value: 'Networking', icon: Globe },
    { value: 'Partnerships', icon: MessageCircle },
    { value: 'Mentorship', icon: Heart },
    { value: 'Job Opportunities', icon: Briefcase }
  ];

  // Floating particles effect
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 15 + Math.random() * 10,
        size: 2 + Math.random() * 4
      }));
      setParticles(newParticles);
    };
    generateParticles();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        if (!formData.email || !formData.password || !formData.confirmPassword) return false;
        if (formData.password !== formData.confirmPassword) return false;
        if (formData.password.length < 6) return false;
        return formData.firstName && formData.lastName && formData.jobTitle && formData.company;
      case 1:
        return formData.industry && formData.experienceLevel;
      case 2:
        return formData.bio && formData.lookingFor.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    try {
      // Register user with complete profile
      const registerData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        description: formData.bio || `${formData.jobTitle} at ${formData.company}`,
        // Professional fields
        job_title: formData.jobTitle,
        company: formData.company,
        location: formData.location,
        industry: formData.industry,
        bio: formData.bio,
        expertise: formData.expertise,
        looking_for: formData.lookingFor,
        // Social links
        linkedin_url: formData.linkedinUrl,
        twitter_url: formData.twitterUrl,
        website_url: formData.websiteUrl,
        calendly_url: formData.calendlyUrl
      };

      const registerResponse = await fetch(process.env.REACT_APP_BACKEND_API_PATH + '/api/users/register', {
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

      const userData = await registerResponse.json();
      
      // Auto-login after registration
      const loginResponse = await fetch(process.env.REACT_APP_BACKEND_API_PATH + '/api/users/login', {
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
      
      setShowConfetti(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error creating profile:', error);
      alert(error.message || 'Failed to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    }`}>
      {/* Animated Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse ${
          isDark ? 'bg-blue-600/20' : 'bg-blue-400/10'
        }`} />
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse ${
          isDark ? 'bg-purple-600/20' : 'bg-purple-400/10'
        }`} style={{ animationDelay: '1s' }} />
        <div className={`absolute top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse ${
          isDark ? 'bg-cyan-600/10' : 'bg-cyan-400/10'
        }`} style={{ animationDelay: '2s' }} />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full animate-float"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              width: `${particle.size}px`,
              height: `${particle.size}px`
            }}
          />
        ))}
      </div>

      {/* Success Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className={`backdrop-blur-sm rounded-2xl border p-8 shadow-2xl animate-fadeIn ${
            isDark 
              ? 'bg-slate-900/95 border-emerald-500/50' 
              : 'bg-white/95 border-emerald-500'
          }`}>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg mb-4">
                <Check size={32} className="text-white" />
              </div>
              <h3 className={`text-2xl font-light mb-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Account Created!</h3>
              <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                Redirecting to your dashboard...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="relative min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl">
          {/* Theme Toggle */}
          <div className="absolute top-4 right-4 md:top-8 md:right-8 z-10">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-3 rounded-full transition-all hover:scale-110 ${
                isDark
                  ? 'bg-slate-800/80 backdrop-blur-sm text-yellow-400 hover:bg-slate-700'
                  : 'bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-slate-100 shadow-lg'
              }`}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {/* Header with Animation */}
          <div className="text-center mb-8 md:mb-12 animate-fadeInDown">
            <div className="flex items-center justify-center gap-3 text-2xl font-medium mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur-lg opacity-75 animate-pulse" />
                <div className="relative p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-2xl">
                  <Mail className="text-white" size={24} />
                </div>
              </div>
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                yesreply
              </span>
            </div>
            <h1 className={`text-3xl md:text-4xl font-light mb-3 leading-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {currentStep === 0 && "Create Your Profile"}
              {currentStep === 1 && "Professional Background"}
              {currentStep === 2 && "About You"}
              {currentStep === 3 && "Connect Your Profiles"}
            </h1>
            <p className={`text-lg max-w-2xl mx-auto ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {steps[currentStep].description}
            </p>
          </div>

          {/* Progress Section */}
          <div className="mb-8 animate-fadeIn">
            {/* Step Indicators */}
            <div className="flex justify-between mb-6 relative">
              {steps.map((step, index) => (
                <div key={step.id} className="flex-1 relative">
                  <div className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-bold transition-all duration-500 transform ${
                        index < currentStep
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 scale-100 shadow-lg shadow-green-500/50'
                          : index === currentStep
                          ? `bg-gradient-to-br ${step.gradient} scale-110 shadow-2xl shadow-blue-500/50 animate-pulse-slow`
                          : 'bg-slate-800/50 backdrop-blur-sm scale-90'
                      }`}
                    >
                      {index < currentStep ? (
                        <Check size={24} className="text-white" />
                      ) : (
                        <step.icon size={24} className="text-white" />
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <p
                        className={`text-sm md:text-base font-medium transition-all ${
                          index === currentStep 
                            ? (isDark ? 'text-white' : 'text-slate-900') + ' scale-105'
                            : isDark ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-7 left-1/2 w-full h-1 -z-0">
                      <div className={`w-full h-full rounded-full overflow-hidden ${
                        isDark ? 'bg-slate-800' : 'bg-slate-300'
                      }`}>
                        <div
                          className={`h-full transition-all duration-500 ${
                            index < currentStep
                              ? 'w-full bg-gradient-to-r from-green-500 to-emerald-600'
                              : 'w-0' + (isDark ? ' bg-slate-700' : ' bg-slate-400')
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Animated Progress Bar */}
            <div className={`relative w-full h-3 backdrop-blur-sm rounded-full overflow-hidden shadow-inner ${
              isDark ? 'bg-slate-800/50' : 'bg-slate-200'
            }`}>
              <div
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-700 ease-out rounded-full shadow-lg"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-fast" />
              </div>
              <div
                className={`absolute top-0 right-0 h-full w-20 bg-gradient-to-l to-transparent pointer-events-none ${
                  isDark ? 'from-slate-800/50' : 'from-slate-200'
                }`}
              />
            </div>
            <div className={`flex justify-between mt-2 text-xs font-medium ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <span>{Math.round(progress)}% Complete</span>
              <span>{steps.length - currentStep - 1} steps remaining</span>
            </div>
          </div>

          {/* Form Card with Glassmorphism */}
          <div className="relative group">
            {/* Glow Effect */}
            <div className={`absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-3xl blur-2xl transition duration-500 ${
              isDark ? 'opacity-25 group-hover:opacity-40' : 'opacity-10 group-hover:opacity-20'
            }`} />
            
            <div className={`relative backdrop-blur-xl border rounded-3xl shadow-2xl overflow-hidden ${
              isDark ? 'bg-slate-900/80 border-slate-800/50' : 'bg-white/90 border-slate-200'
            }`}>
              {/* Content */}
              <div className="p-6 md:p-10">
                <div className="min-h-[500px]">
                  {/* Step 0: Basic Information */}
                  {currentStep === 0 && (
                    <div className="space-y-6 animate-slideInRight">
                      {/* Account Credentials */}
                      <div className={`bg-gradient-to-r rounded-xl p-6 mb-6 ${
                        isDark 
                          ? 'from-blue-600/10 to-purple-600/10 border border-blue-600/20' 
                          : 'from-blue-100/50 to-purple-100/50 border border-blue-200'
                      }`}>
                        <h3 className={`text-lg font-medium mb-4 flex items-center gap-2 ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          <Mail size={20} className="text-blue-500" />
                          Create Your Account
                        </h3>
                        <div className="space-y-4">
                          <div className="group">
                            <label className={`block text-sm font-semibold mb-3 ${
                              isDark ? 'text-slate-300' : 'text-slate-700'
                            }`}>
                              Email Address *
                            </label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className={`w-full px-5 py-4 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                isDark
                                  ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 group-hover:border-slate-600'
                                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 group-hover:border-slate-400'
                              }`}
                              placeholder="you@example.com"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="group">
                              <label className={`block text-sm font-semibold mb-3 ${
                                isDark ? 'text-slate-300' : 'text-slate-700'
                              }`}>
                                Password * <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>(min 6 characters)</span>
                              </label>
                              <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className={`w-full px-5 py-4 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                  isDark
                                    ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 group-hover:border-slate-600'
                                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 group-hover:border-slate-400'
                                }`}
                                placeholder="••••••••"
                              />
                            </div>
                            <div className="group">
                              <label className={`block text-sm font-semibold mb-3 ${
                                isDark ? 'text-slate-300' : 'text-slate-700'
                              }`}>
                                Confirm Password *
                              </label>
                              <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                className={`w-full px-5 py-4 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                                  formData.confirmPassword && formData.password !== formData.confirmPassword
                                    ? 'border-red-500 focus:ring-red-500'
                                    : isDark
                                    ? 'border-slate-700 focus:ring-blue-500 group-hover:border-slate-600'
                                    : 'border-slate-300 focus:ring-blue-500 group-hover:border-slate-400'
                                } ${
                                  isDark
                                    ? 'bg-slate-800/50 text-white placeholder-slate-500'
                                    : 'bg-white text-slate-900 placeholder-slate-400'
                                }`}
                                placeholder="••••••••"
                              />
                              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="text-red-400 text-xs mt-2">Passwords don't match</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group">
                          <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            <User size={16} className="text-blue-500" />
                            First Name *
                          </label>
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className={`w-full px-5 py-4 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                              isDark
                                ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 group-hover:border-slate-600'
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 group-hover:border-slate-400'
                            }`}
                            placeholder="John"
                          />
                        </div>
                        <div className="group">
                          <label className={`block text-sm font-semibold mb-3 ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            Last Name *
                          </label>
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className={`w-full px-5 py-4 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                              isDark
                                ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 group-hover:border-slate-600'
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 group-hover:border-slate-400'
                            }`}
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div className="group">
                        <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          <Briefcase size={16} className="text-purple-500" />
                          Job Title *
                        </label>
                        <input
                          type="text"
                          value={formData.jobTitle}
                          onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                          className={`w-full px-5 py-4 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                            isDark
                              ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 group-hover:border-slate-600'
                              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 group-hover:border-slate-400'
                          }`}
                          placeholder="e.g., Venture Capital Partner, CEO, Product Manager"
                        />
                      </div>

                      <div className="group">
                        <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          <Building2 size={16} className="text-cyan-500" />
                          Company *
                        </label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          className={`w-full px-5 py-4 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${
                            isDark
                              ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 group-hover:border-slate-600'
                              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 group-hover:border-slate-400'
                          }`}
                          placeholder="e.g., Acme Ventures, Self-Employed"
                        />
                      </div>

                      <div className="group">
                        <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          <Globe size={16} className="text-green-500" />
                          Location
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className={`w-full px-5 py-4 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                            isDark
                              ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 group-hover:border-slate-600'
                              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 group-hover:border-slate-400'
                          }`}
                          placeholder="e.g., San Francisco, CA"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 1: Professional Details */}
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-slideInRight">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                          <TrendingUp size={16} className="text-emerald-400" />
                          Industry * <span className="text-xs text-slate-500">(Choose your field)</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {industries.map((industry) => {
                            const Icon = industry.icon;
                            const isSelected = formData.industry === industry.value;
                            return (
                              <button
                                key={industry.value}
                                onClick={() => handleInputChange('industry', industry.value)}
                                className={`relative overflow-hidden px-4 py-4 rounded-xl border text-sm font-medium transition-all transform hover:scale-105 ${
                                  isSelected
                                    ? 'bg-gradient-to-br from-blue-600 to-cyan-600 border-blue-500 text-white shadow-lg shadow-blue-500/50'
                                    : 'bg-slate-800/50 backdrop-blur-sm border-slate-700 text-slate-300 hover:border-slate-600'
                                }`}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <Icon size={20} className={isSelected ? 'text-white' : 'text-slate-400'} />
                                  <span>{industry.value}</span>
                                </div>
                                {isSelected && (
                                  <div className="absolute top-2 right-2">
                                    <Check size={16} className="text-white" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                          <Award size={16} className="text-yellow-400" />
                          Experience Level *
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {experienceLevels.map((level) => {
                            const isSelected = formData.experienceLevel === level.value;
                            return (
                              <button
                                key={level.value}
                                onClick={() => handleInputChange('experienceLevel', level.value)}
                                className={`relative overflow-hidden px-6 py-5 rounded-xl border text-left transition-all transform hover:scale-105 ${
                                  isSelected
                                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-purple-500 shadow-lg shadow-purple-500/50'
                                    : 'bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-slate-600'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                      {level.label}
                                    </p>
                                    <p className={`text-sm mt-1 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                      {level.subtitle}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <Check size={20} className="text-white flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                          <Users size={16} className="text-indigo-400" />
                          Company Size
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {companySizes.map((size) => {
                            const isSelected = formData.companySize === size;
                            return (
                              <button
                                key={size}
                                onClick={() => handleInputChange('companySize', size)}
                                className={`px-4 py-4 rounded-xl border text-sm font-medium transition-all transform hover:scale-105 ${
                                  isSelected
                                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/50'
                                    : 'bg-slate-800/50 backdrop-blur-sm border-slate-700 text-slate-300 hover:border-slate-600'
                                }`}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                          <Star size={16} className="text-amber-400" />
                          Areas of Interest <span className="text-xs text-slate-500">(Select multiple)</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {interestOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = formData.areasOfInterest.includes(option.value);
                            return (
                              <button
                                key={option.value}
                                onClick={() => handleArrayToggle('areasOfInterest', option.value)}
                                className={`relative overflow-hidden px-4 py-4 rounded-xl border text-xs font-medium transition-all transform hover:scale-105 ${
                                  isSelected
                                    ? `bg-gradient-to-br ${option.color} border-transparent text-white shadow-lg`
                                    : 'bg-slate-800/50 backdrop-blur-sm border-slate-700 text-slate-300 hover:border-slate-600'
                                }`}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <Icon size={18} />
                                  <span className="text-center">{option.value}</span>
                                </div>
                                {isSelected && (
                                  <div className="absolute top-1 right-1">
                                    <Check size={14} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: About & Bio */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-slideInRight">
                      <div>
                        <label className={`block text-sm font-semibold mb-4 flex items-center gap-2 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          <MessageCircle size={16} className="text-blue-500" />
                          Professional Bio *
                        </label>
                        <div className="relative group">
                          <textarea
                            value={formData.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            rows={6}
                            maxLength={500}
                            className={`w-full px-5 py-4 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all ${
                              isDark
                                ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 group-hover:border-slate-600'
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 group-hover:border-slate-400'
                            }`}
                            placeholder="Describe your professional background, key achievements, and what you bring to the table. Focus on your expertise and the value you provide."
                          />
                          <div className={`absolute bottom-3 right-3 text-xs backdrop-blur-sm px-2 py-1 rounded ${
                            isDark ? 'text-slate-500 bg-slate-900/80' : 'text-slate-600 bg-white/80'
                          }`}>
                            {formData.bio.length}/500
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-4 flex items-center gap-2 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          <Zap size={16} className="text-yellow-500" />
                          Areas of Expertise
                        </label>
                        <input
                          type="text"
                          value={formData.expertise}
                          onChange={(e) => handleInputChange('expertise', e.target.value)}
                          className={`w-full px-5 py-4 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all ${
                            isDark
                              ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500'
                              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                          }`}
                          placeholder="e.g., SaaS Growth, B2B Sales, Product Strategy, AI/ML, Team Building"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                          <Target size={16} className="text-emerald-400" />
                          What are you looking for? * <span className="text-xs text-slate-500">(Select all that apply)</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {lookingForOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = formData.lookingFor.includes(option.value);
                            return (
                              <button
                                key={option.value}
                                onClick={() => handleArrayToggle('lookingFor', option.value)}
                                className={`relative overflow-hidden px-5 py-5 rounded-xl border text-sm font-medium transition-all transform hover:scale-105 ${
                                  isSelected
                                    ? 'bg-gradient-to-br from-emerald-600 to-teal-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                                    : 'bg-slate-800/50 backdrop-blur-sm border-slate-700 text-slate-300 hover:border-slate-600'
                                }`}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <Icon size={20} />
                                  <span className="text-center text-xs">{option.value}</span>
                                </div>
                                {isSelected && (
                                  <div className="absolute top-2 right-2">
                                    <Check size={16} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Social Links */}
                  {currentStep === 3 && (
                    <div className="space-y-6 animate-slideInRight">
                      <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-600 to-rose-600 shadow-lg shadow-pink-500/50 mb-4">
                          <Globe size={36} className="text-white" />
                        </div>
                        <p className="text-slate-400 text-lg">
                          Link your professional profiles for enhanced networking
                        </p>
                      </div>

                      <div className="space-y-5">
                        <div className="group">
                          <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            <LinkIcon size={16} className="text-blue-500" />
                            LinkedIn Profile
                          </label>
                          <input
                            type="url"
                            value={formData.linkedinUrl}
                            onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                            className={`w-full px-5 py-4 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                              isDark
                                ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 group-hover:border-slate-600'
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 group-hover:border-slate-400'
                            }`}
                            placeholder="https://linkedin.com/in/yourprofile"
                          />
                        </div>

                        <div className="group">
                          <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            <MessageCircle size={16} className="text-cyan-500" />
                            Twitter/X Profile
                          </label>
                          <input
                            type="url"
                            value={formData.twitterUrl}
                            onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                            className={`w-full px-5 py-4 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${
                              isDark
                                ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 group-hover:border-slate-600'
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 group-hover:border-slate-400'
                            }`}
                            placeholder="https://twitter.com/yourhandle"
                          />
                        </div>

                        <div className="group">
                          <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            <Globe size={16} className="text-purple-500" />
                            Personal Website
                          </label>
                          <input
                            type="url"
                            value={formData.websiteUrl}
                            onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                            className={`w-full px-5 py-4 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                              isDark
                                ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 group-hover:border-slate-600'
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 group-hover:border-slate-400'
                            }`}
                            placeholder="https://yourwebsite.com"
                          />
                        </div>

                        <div className="group">
                          <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            <Zap size={16} className="text-orange-500" />
                            Calendly Link <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>(Optional)</span>
                          </label>
                          <input
                            type="url"
                            value={formData.calendlyUrl}
                            onChange={(e) => handleInputChange('calendlyUrl', e.target.value)}
                            className={`w-full px-5 py-4 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                              isDark
                                ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 group-hover:border-slate-600'
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 group-hover:border-slate-400'
                            }`}
                            placeholder="https://calendly.com/yourlink"
                          />
                        </div>
                      </div>

                      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-600/30 rounded-2xl p-6 mt-8">
                        <div className="relative z-10">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg">
                              <Rocket size={24} className="text-white" />
                            </div>
                            <div>
                              <p className="text-lg font-medium text-white mb-2">
                                Profile Complete
                              </p>
                              <p className="text-slate-300">
                                Click "Complete Profile" to create your account and join a network of ambitious professionals.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className={`flex justify-between items-center mt-8 pt-8 border-t ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className={`group flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all transform ${
                      currentStep === 0
                        ? isDark 
                          ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : isDark
                          ? 'bg-slate-800 text-white hover:bg-slate-700 hover:scale-105 active:scale-95'
                          : 'bg-slate-200 text-slate-900 hover:bg-slate-300 hover:scale-105 active:scale-95'
                    }`}
                  >
                    <ChevronLeft size={20} className={currentStep === 0 ? '' : 'group-hover:-translate-x-1 transition-transform'} />
                    Back
                  </button>

                  <div className="flex items-center gap-2 text-sm font-medium">
                    <div className={`px-4 py-2 rounded-full backdrop-blur-sm ${
                      isDark ? 'bg-slate-800/50 text-slate-300' : 'bg-slate-100 text-slate-700'
                    }`}>
                      Step {currentStep + 1} of {steps.length}
                    </div>
                  </div>

                  {currentStep < steps.length - 1 ? (
                    <button
                      onClick={handleNext}
                      disabled={!validateStep(currentStep)}
                      className={`group flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all transform ${
                        validateStep(currentStep)
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/50'
                          : isDark 
                            ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Next
                      <ArrowRight size={20} className={validateStep(currentStep) ? 'group-hover:translate-x-1 transition-transform' : ''} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!validateStep(currentStep) || isSubmitting}
                      className={`group flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all transform ${
                        validateStep(currentStep) && !isSubmitting
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/50'
                          : isDark
                            ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating Magic...
                        </>
                      ) : (
                        <>
                          <Rocket size={20} className="group-hover:translate-y-[-2px] transition-transform" />
                          Complete Profile
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Skip Link */}
          <div className="text-center mt-6 animate-fadeIn">
            <button
              onClick={() => navigate('/dashboard')}
              className={`text-sm transition-colors group ${
                isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Skip for now <span className="group-hover:ml-1 transition-all inline-block">→</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          50% {
            transform: translateY(-100vh) translateX(50px);
            opacity: 0.8;
          }
          90% {
            opacity: 0.5;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes shimmer-fast {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes confetti {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-shimmer {
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }

        .animate-shimmer-fast {
          animation: shimmer-fast 2s ease-in-out infinite;
        }

        .animate-confetti {
          animation: confetti linear forwards;
        }

        .animate-fadeInDown {
          animation: fadeInDown 0.6s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }

        .animate-slideInRight {
          animation: slideInRight 0.4s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
