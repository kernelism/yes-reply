import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  User, Mail, Briefcase, MapPin, Building2, Globe, 
  Linkedin, Twitter, Calendar, Edit2, Save, X, 
  Target, Zap, ArrowLeft, Sun, Moon, Check, DollarSign
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { username } = useParams(); // Get username from URL if present
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // If viewing a specific username (not own profile)
      if (username) {
        // Fetch the user by username (public endpoint, no auth required)
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_API_PATH}/api/users/by-username/${username}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setUserData(data);
        
        // Also fetch current user to check if viewing own profile
        if (token) {
          try {
            const currentUserResponse = await fetch(
              `${process.env.REACT_APP_BACKEND_API_PATH}/api/users/me`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            if (currentUserResponse.ok) {
              const currentUserData = await currentUserResponse.json();
              setCurrentUser(currentUserData);
            }
          } catch (e) {
            console.error('Error fetching current user:', e);
          }
        }
      } else {
        // Viewing own profile
        if (!token) {
          navigate('/');
          return;
        }

        const response = await fetch(process.env.REACT_APP_BACKEND_API_PATH + '/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setUserData(data);
        setCurrentUser(data);
      }
      
      // Parse looking_for if it's a JSON string (for both cases)
      const currentData = userData || {};
      let lookingFor = [];
      if (currentData.looking_for) {
        try {
          lookingFor = typeof currentData.looking_for === 'string' ? JSON.parse(currentData.looking_for) : currentData.looking_for;
        } catch (e) {
          lookingFor = [];
        }
      }

      // Only set form data if viewing own profile
      if (!username || (currentUser && currentUser.username === username)) {
        setFormData({
          first_name: currentData.first_name || '',
          last_name: currentData.last_name || '',
          description: currentData.description || '',
          job_title: currentData.job_title || '',
          company: currentData.company || '',
          location: currentData.location || '',
          industry: currentData.industry || '',
          bio: currentData.bio || '',
          expertise: currentData.expertise || '',
          looking_for: lookingFor,
          linkedin_url: currentData.linkedin_profile_url || '',
          twitter_url: currentData.twitter_url || '',
          website_url: currentData.website_url || '',
          calendly_url: currentData.calendly_url || '',
          price_limit: currentData.price_limit || 2.0
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      // Convert looking_for array to JSON string if it exists
      const updateData = {
        ...formData,
        looking_for: formData.looking_for && formData.looking_for.length > 0 ? formData.looking_for : null
      };
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_API_PATH}/api/users/${userData.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedData = await response.json();
      setUserData(updatedData);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkedInVerify = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_API_PATH}/api/verification/linkedin/dummy-verify`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to verify LinkedIn');
      }

      const data = await response.json();
      await fetchUserProfile(); // Refresh profile data
      alert(`LinkedIn verified! Your max rate is now $${data.new_price_limit}/email`);
    } catch (error) {
      console.error('Error verifying LinkedIn:', error);
      alert(`Failed to verify LinkedIn: ${error.message}`);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    let lookingFor = [];
    if (userData.looking_for) {
      try {
        lookingFor = typeof userData.looking_for === 'string' ? JSON.parse(userData.looking_for) : userData.looking_for;
      } catch (e) {
        lookingFor = [];
      }
    }

    setFormData({
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      description: userData.description || '',
      job_title: userData.job_title || '',
      company: userData.company || '',
      location: userData.location || '',
      industry: userData.industry || '',
      bio: userData.bio || '',
      expertise: userData.expertise || '',
      looking_for: lookingFor,
      linkedin_url: userData.linkedin_profile_url || '',
      twitter_url: userData.twitter_url || '',
      website_url: userData.website_url || '',
      calendly_url: userData.calendly_url || '',
      price_limit: userData.price_limit || 2.0
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-slate-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-slate-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Failed to load profile</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Check if viewing own profile
  const isOwnProfile = !username || (currentUser && userData && currentUser.id === userData.id);

  return (
    <div className={isDark ? 'bg-slate-900' : 'bg-white'}>
      {/* Clean Header - Dashboard Style */}
      <div className={`border-b ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-2 text-sm font-medium uppercase tracking-wider transition-colors ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 transition-all ${
                isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isOwnProfile && (
              <>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className={`px-4 py-2 border text-sm font-medium transition-all disabled:opacity-50 ${
                        isDark 
                          ? 'border-slate-700 text-slate-400 hover:bg-slate-800' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-50 bg-blue-600 hover:bg-blue-700"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Dashboard Style */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex items-start gap-4 mb-8">
            <div className={`w-16 h-16 flex items-center justify-center text-xl font-bold ${
              isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800'
            }`}>
              {userData.first_name?.[0]}{userData.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`text-3xl font-light tracking-tight mb-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {userData.first_name} {userData.last_name}
              </h1>
              <div className="space-y-1">
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {userData.username}@yesreply.tech
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  {userData.email}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium uppercase tracking-wider ${
                userData.linkedin_verified
                  ? isDark ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {userData.linkedin_verified ? 'Verified' : 'Unverified'}
              </div>
              {!userData.linkedin_verified && (
                <button
                  onClick={handleLinkedInVerify}
                  className={`text-xs px-3 py-1 border transition-colors ${
                    isDark 
                      ? 'text-slate-400 hover:text-white border-slate-700 hover:bg-slate-800' 
                      : 'text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Verify
                </button>
              )}
              <div className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                ${userData.price_limit}/email
              </div>
            </div>
          </div>
        </div>

          {/* Profile Fields - Always Visible */}
        <div className="space-y-8">
          {/* Basic Info Section */}
          <div className={`pb-8 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            {isOwnProfile && isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-medium tracking-wider uppercase mb-2 ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border focus:outline-none focus:border-blue-600 ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white' 
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium tracking-wider uppercase mb-2 ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border focus:outline-none focus:border-blue-600 ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white' 
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 text-sm border resize-none focus:outline-none focus:border-blue-600 ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="A brief description about yourself..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className={`text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Description
                  </div>
                  <div className={`text-sm leading-relaxed ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {userData.description || (
                      <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>
                        No description added
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Professional Info */}
          <div className={`pb-8 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <h2 className={`text-xl font-light tracking-tight mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Professional
            </h2>
            
            {isOwnProfile && isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-medium tracking-wider uppercase mb-2 ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border focus:outline-none focus:border-blue-600 ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' 
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium tracking-wider uppercase mb-2 ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border focus:outline-none focus:border-blue-600 ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' 
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                      placeholder="e.g., Acme Inc."
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium tracking-wider uppercase mb-2 ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border focus:outline-none focus:border-blue-600 ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' 
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium tracking-wider uppercase mb-2 ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      Industry
                    </label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border focus:outline-none focus:border-blue-600 ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' 
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                      placeholder="e.g., Technology"
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Expertise
                  </label>
                  <input
                    type="text"
                    value={formData.expertise}
                    onChange={(e) => handleInputChange('expertise', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border focus:outline-none focus:border-blue-600 ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="e.g., SaaS, B2B Sales, Product Strategy"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 text-sm border resize-none focus:outline-none focus:border-blue-600 ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="Tell your story..."
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Looking For
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Investment Opportunities', 'Co-founders', 'Advisors', 'Networking', 'Partnerships', 'Mentorship', 'Job Opportunities'].map((option) => {
                      const isSelected = formData.looking_for && formData.looking_for.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            const current = formData.looking_for || [];
                            const updated = isSelected
                              ? current.filter(item => item !== option)
                              : [...current, option];
                            handleInputChange('looking_for', updated);
                          }}
                          className={`px-2 py-1 text-xs border transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : isDark
                              ? 'border-slate-700 text-slate-400 hover:bg-slate-800'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className={`text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Job Title
                  </div>
                  <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {userData.job_title || (
                      <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>Not set</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className={`text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Company
                  </div>
                  <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {userData.company || (
                      <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>Not set</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={`text-xs font-medium tracking-wider uppercase mb-2 ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      Location
                    </div>
                    <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {userData.location || (
                        <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>Not set</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className={`text-xs font-medium tracking-wider uppercase mb-2 ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      Industry
                    </div>
                    <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {userData.industry || (
                        <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>Not set</span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className={`text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Expertise
                  </div>
                  <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {userData.expertise || (
                      <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>Not set</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className={`text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Bio
                  </div>
                  <div className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {userData.bio || (
                      <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>Not set</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className={`text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Looking For
                  </div>
                  {(() => {
                    let lookingFor = [];
                    try {
                      lookingFor = typeof userData.looking_for === 'string' ? JSON.parse(userData.looking_for) : userData.looking_for;
                    } catch (e) {
                      lookingFor = [];
                    }
                    return lookingFor && lookingFor.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {lookingFor.map((item, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-1 text-xs border ${
                              isDark 
                                ? 'bg-slate-800 text-slate-300 border-slate-700' 
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>Not set</span>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Links & Contact */}
          <div className={`pb-8 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <h2 className={`text-xl font-light tracking-tight mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Links & Contact
            </h2>
            
            {isOwnProfile && isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border focus:outline-none focus:border-blue-600 ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Twitter/X
                  </label>
                  <input
                    type="url"
                    value={formData.twitter_url}
                    onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border focus:outline-none focus:border-blue-600 ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => handleInputChange('website_url', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border focus:outline-none focus:border-blue-600 ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Calendly
                  </label>
                  <input
                    type="url"
                    value={formData.calendly_url}
                    onChange={(e) => handleInputChange('calendly_url', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border focus:outline-none focus:border-blue-600 ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="https://calendly.com/yourname"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className={`text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    LinkedIn
                  </div>
                  {userData.linkedin_profile_url ? (
                    <a
                      href={userData.linkedin_profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm hover:underline ${
                        isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      {userData.linkedin_profile_url}
                    </a>
                  ) : (
                    <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>Not set</span>
                  )}
                </div>
                <div>
                  <div className={`text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Twitter/X
                  </div>
                  {userData.twitter_url ? (
                    <a
                      href={userData.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm hover:underline ${
                        isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      {userData.twitter_url}
                    </a>
                  ) : (
                    <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>Not set</span>
                  )}
                </div>
                <div>
                  <div className={`text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Website
                  </div>
                  {userData.website_url ? (
                    <a
                      href={userData.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm hover:underline ${
                        isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      {userData.website_url}
                    </a>
                  ) : (
                    <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>Not set</span>
                  )}
                </div>
                <div>
                  <div className={`text-xs font-medium tracking-wider uppercase mb-2 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Calendly
                  </div>
                  {userData.calendly_url ? (
                    <a
                      href={userData.calendly_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm hover:underline ${
                        isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      {userData.calendly_url}
                    </a>
                  ) : (
                    <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>Not set</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="pb-8">
            <h2 className={`text-xl font-light tracking-tight mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Pricing
            </h2>
            
            {isOwnProfile && isEditing ? (
              <div>
                <label className={`block text-xs font-medium tracking-wider uppercase mb-2 ${
                  isDark ? 'text-slate-500' : 'text-slate-500'
                }`}>
                  Max Rate per Email ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.05"
                  max={userData.linkedin_verified ? 5.0 : 2.0}
                  value={formData.price_limit}
                  onChange={(e) => handleInputChange('price_limit', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 text-sm border focus:outline-none focus:border-blue-600 ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  {userData.linkedin_verified 
                    ? 'LinkedIn verified: Up to $5.00 per email'
                    : 'Unverified: Up to $2.00 per email. Verify LinkedIn to increase to $5.00'}
                </p>
              </div>
            ) : (
              <div>
                <div className={`text-xs font-medium tracking-wider uppercase mb-2 ${
                  isDark ? 'text-slate-500' : 'text-slate-500'
                }`}>
                  Max Rate per Email
                </div>
                <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  ${userData.price_limit?.toFixed(2) || '0.00'}
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  {userData.linkedin_verified 
                    ? 'LinkedIn verified: Up to $5.00 per email'
                    : 'Unverified: Up to $2.00 per email'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

