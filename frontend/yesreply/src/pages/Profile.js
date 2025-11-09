import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Edit2, ArrowLeft, Sun, Moon
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
  const [validationErrors, setValidationErrors] = useState({});
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
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
        // Set profile picture preview if available
        if (currentData.profile_picture_url) {
          setProfilePicturePreview(currentData.profile_picture_url);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidUrl = (url) => {
    if (!url || url.trim() === '') return true; // Allow empty values
    try {
      // More flexible URL pattern that accepts http://, https://, or just domain
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
      return urlPattern.test(url.trim());
    } catch {
      return false;
    }
  };

  const handleInputChange = (field, value) => {
    // For name fields, filter out invalid characters before updating
    if (field === 'first_name' || field === 'last_name') {
      // Allow only letters, spaces, hyphens, and apostrophes
      const filteredValue = value.replace(/[^a-zA-Z\s'-]/g, '');
      setFormData(prev => ({ ...prev, [field]: filteredValue }));
      
      // Clear validation errors if value is valid
      if (filteredValue === value || !filteredValue) {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
      return;
    }

    // For other fields, update form data normally
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validate URL fields
    const urlFields = ['linkedin_url', 'twitter_url', 'website_url', 'calendly_url'];
    if (urlFields.includes(field)) {
      if (value && value.trim() && !isValidUrl(value)) {
        setValidationErrors(prev => ({ ...prev, [field]: 'Please enter a valid URL (e.g., https://example.com)' }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setProfilePicture(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      alert('Please fix validation errors before saving.');
      return;
    }

    // Validate URL fields one more time before saving
    const urlFields = ['linkedin_url', 'twitter_url', 'website_url', 'calendly_url'];
    for (const field of urlFields) {
      const value = formData[field];
      if (value && value.trim() && !isValidUrl(value)) {
        setValidationErrors(prev => ({ ...prev, [field]: 'Please enter a valid URL (e.g., https://example.com)' }));
        alert('Please fix validation errors before saving.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // If profile picture is selected, upload it first
      let profilePictureUrl = userData.profile_picture_url || null;
      if (profilePicture) {
        const formDataPicture = new FormData();
        formDataPicture.append('file', profilePicture);
        
        const uploadResponse = await fetch(
          `${process.env.REACT_APP_BACKEND_API_PATH}/api/users/${userData.id}/profile-picture`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataPicture
          }
        );

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          profilePictureUrl = uploadData.profile_picture_url;
        } else {
          console.error('Failed to upload profile picture');
        }
      }

      // Prepare update data (excluding profile_picture_url as it's uploaded separately)
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
      setProfilePicture(null);
      setProfilePicturePreview(updatedData.profile_picture_url || null);
      setValidationErrors({}); // Clear validation errors on successful save
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
    setProfilePicture(null);
    setProfilePicturePreview(userData.profile_picture_url || null);
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
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className={`mb-12 rounded-2xl p-8 transition-all ${
          isDark 
            ? 'bg-slate-800/50 border border-slate-700/50' 
            : 'bg-white border border-slate-200 shadow-lg'
        }`}>
          <div className="flex items-start gap-6 mb-6">
            {/* Avatar */}
            <div className="relative group">
              <div className={`absolute inset-0 rounded-full border-2 ${
                isDark ? 'border-slate-600' : 'border-slate-300'
              }`}></div>
              <div className={`relative w-24 h-24 flex items-center justify-center text-2xl font-bold rounded-full overflow-hidden ${
                isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-800'
              }`}>
                {profilePicturePreview || userData.profile_picture_url ? (
                  <img 
                    src={profilePicturePreview || userData.profile_picture_url} 
                    alt={`${userData.first_name} ${userData.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{userData.first_name?.[0]}{userData.last_name?.[0]}</span>
                )}
              </div>
              {isOwnProfile && isEditing && (
                <label className="absolute inset-0 rounded-full cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit2 size={20} className="text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureChange}
                  />
                </label>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`text-4xl font-bold tracking-tight mb-3 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {userData.first_name} {userData.last_name}
              </h1>
              <div className="space-y-2">
                <div className={`text-sm font-medium ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {userData.username}@yesreply.tech
                </div>
                <div className={`text-xs ${
                  isDark ? 'text-slate-500' : 'text-slate-500'
                }`}>
                  {userData.email}
                </div>
                {/* Links & Contact */}
                <div className={`flex flex-wrap gap-3 mt-3 pt-3 border-t ${
                  isDark ? 'border-slate-700' : 'border-slate-200'
                }`}>
                  {userData.linkedin_profile_url && (
                    <a
                      href={userData.linkedin_profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs font-medium transition-all hover:underline ${
                        isDark 
                          ? 'text-slate-300 hover:text-white' 
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      LinkedIn
                    </a>
                  )}
                  {userData.twitter_url && (
                    <a
                      href={userData.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs font-medium transition-all hover:underline ${
                        isDark 
                          ? 'text-slate-300 hover:text-white' 
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      Twitter/X
                    </a>
                  )}
                  {userData.website_url && (
                    <a
                      href={userData.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs font-medium transition-all hover:underline ${
                        isDark 
                          ? 'text-slate-300 hover:text-white' 
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      Website
                    </a>
                  )}
                  {userData.calendly_url && (
                    <a
                      href={userData.calendly_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs font-medium transition-all hover:underline ${
                        isDark 
                          ? 'text-slate-300 hover:text-white' 
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      Calendly
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full transition-all ${
                userData.linkedin_verified
                  ? isDark 
                    ? 'bg-slate-700/50 text-slate-200 border border-slate-600 shadow-lg' 
                    : 'bg-slate-200 text-slate-800 border border-slate-400 shadow-md'
                  : isDark 
                    ? 'bg-slate-800/50 text-slate-400 border border-slate-700' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {userData.linkedin_verified ? 'Verified' : 'Unverified'}
              </div>
              {!userData.linkedin_verified && (
                <button
                  onClick={handleLinkedInVerify}
                  className={`text-xs px-4 py-1.5 border rounded-full transition-all font-medium ${
                    isDark 
                      ? 'text-slate-300 hover:text-white border-slate-600 hover:bg-slate-800 hover:border-slate-500' 
                      : 'text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  Verify LinkedIn
                </button>
              )}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                isDark 
                  ? 'bg-slate-800/50 border border-slate-700' 
                  : 'bg-slate-100 border border-slate-300'
              }`}>
                <span className={`text-sm font-bold font-mono ${
                  isDark ? 'text-slate-300' : 'text-slate-900'
                }`}>
                  ${userData.price_limit}/email
                </span>
              </div>
            </div>
          </div>
        </div>

          {/* Profile Fields - Always Visible */}
        <div className="space-y-6">
          {/* Basic Info Section */}
          <div className={`rounded-2xl p-8 transition-all ${
            isDark 
              ? 'bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/50 shadow-xl' 
              : 'bg-white border border-slate-200 shadow-lg hover:shadow-xl'
          }`}>
            <div className="mb-8">
              <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                About
              </h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Personal information and description
              </p>
            </div>
            {isOwnProfile && isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-slate-500/50 ${
                        validationErrors.first_name
                          ? 'border-red-500 focus:ring-red-500/50'
                          : isDark 
                            ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500' 
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                      }`}
                    />
                    {validationErrors.first_name && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.first_name}</p>
                    )}
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-slate-500/50 ${
                        validationErrors.last_name
                          ? 'border-red-500 focus:ring-red-500/50'
                          : isDark 
                            ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500' 
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                      }`}
                    />
                    {validationErrors.last_name && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.last_name}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className={`w-full px-4 py-2.5 text-sm rounded-lg border resize-none transition-all focus:outline-none focus:ring-2 focus:ring-slate-500/50 ${
                      isDark 
                        ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                    }`}
                    placeholder="A brief description about yourself..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className={`p-5 rounded-xl ${
                  isDark ? 'bg-slate-800/30 border border-slate-700/30' : 'bg-slate-50/50 border border-slate-200/50'
                }`}>
                  <div className={`text-sm font-semibold mb-3 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Description
                  </div>
                  <div className={`text-base leading-relaxed ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {userData.description || (
                      <span className={`italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        No description added yet. Share a bit about yourself to help others connect with you.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Professional Info */}
          <div className={`rounded-2xl p-8 transition-all ${
            isDark 
              ? 'bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/50 shadow-xl' 
              : 'bg-white border border-slate-200 shadow-lg hover:shadow-xl'
          }`}>
            <div className="mb-8">
              <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Professional
              </h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Career details and professional background
              </p>
            </div>
            
            {isOwnProfile && isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-slate-500/50 ${
                        isDark 
                          ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                      }`}
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-slate-500/50 ${
                        isDark 
                          ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                      }`}
                      placeholder="e.g., Acme Inc."
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-slate-500/50 ${
                        isDark 
                          ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                      }`}
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Industry
                    </label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-slate-500/50 ${
                        isDark 
                          ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                      }`}
                      placeholder="e.g., Technology"
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Expertise
                  </label>
                    <input
                      type="text"
                      value={formData.expertise}
                      onChange={(e) => handleInputChange('expertise', e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-slate-500/50 ${
                        isDark 
                          ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                      }`}
                      placeholder="e.g., SaaS, B2B Sales, Product Strategy"
                    />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                    className={`w-full px-4 py-2.5 text-sm rounded-lg border resize-none transition-all focus:outline-none focus:ring-2 focus:ring-slate-500/50 ${
                      isDark 
                        ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                    }`}
                    placeholder="Tell your story..."
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
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
                          className={`px-3 py-1.5 text-xs font-medium border rounded-full transition-all ${
                            isSelected
                              ? 'bg-slate-700 text-white border-slate-600 shadow-md'
                              : isDark
                              ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
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
              <div className="space-y-6">
                {/* Job Title & Company */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-5 rounded-xl ${
                    isDark ? 'bg-slate-800/30 border border-slate-700/30' : 'bg-slate-50/50 border border-slate-200/50'
                  }`}>
                    <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Job Title
                    </div>
                    <div className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {userData.job_title || (
                        <span className={`text-sm font-normal italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          Not specified
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`p-5 rounded-xl ${
                    isDark ? 'bg-slate-800/30 border border-slate-700/30' : 'bg-slate-50/50 border border-slate-200/50'
                  }`}>
                    <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Company
                    </div>
                    <div className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {userData.company || (
                        <span className={`text-sm font-normal italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          Not specified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location & Industry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-5 rounded-xl ${
                    isDark ? 'bg-slate-800/30 border border-slate-700/30' : 'bg-slate-50/50 border border-slate-200/50'
                  }`}>
                    <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Location
                    </div>
                    <div className={`text-base font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {userData.location || (
                        <span className={`text-sm font-normal italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          Not specified
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`p-5 rounded-xl ${
                    isDark ? 'bg-slate-800/30 border border-slate-700/30' : 'bg-slate-50/50 border border-slate-200/50'
                  }`}>
                    <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Industry
                    </div>
                    <div className={`text-base font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {userData.industry || (
                        <span className={`text-sm font-normal italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          Not specified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expertise */}
                {userData.expertise && (
                  <div className={`p-5 rounded-xl ${
                    isDark ? 'bg-slate-800/30 border border-slate-700/30' : 'bg-slate-50/50 border border-slate-200/50'
                  }`}>
                    <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Expertise
                    </div>
                    <div className={`text-base leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {userData.expertise}
                    </div>
                  </div>
                )}

                {/* Bio */}
                {userData.bio && (
                  <div className={`p-5 rounded-xl ${
                    isDark ? 'bg-slate-800/30 border border-slate-700/30' : 'bg-slate-50/50 border border-slate-200/50'
                  }`}>
                    <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Bio
                    </div>
                    <div className={`text-base leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {userData.bio}
                    </div>
                  </div>
                )}
                {/* Looking For */}
                {(() => {
                  let lookingFor = [];
                  try {
                    lookingFor = typeof userData.looking_for === 'string' ? JSON.parse(userData.looking_for) : userData.looking_for;
                  } catch (e) {
                    lookingFor = [];
                  }
                  return lookingFor && lookingFor.length > 0 ? (
                    <div className={`p-5 rounded-xl ${
                      isDark ? 'bg-slate-800/30 border border-slate-700/30' : 'bg-slate-50/50 border border-slate-200/50'
                    }`}>
                      <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Looking For
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {lookingFor.map((item, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1.5 text-xs font-medium border rounded-full ${
                              isDark 
                                ? 'bg-slate-800/30 text-slate-300 border-slate-600' 
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className={`rounded-2xl p-8 transition-all ${
            isDark 
              ? 'bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/50 shadow-xl' 
              : 'bg-white border border-slate-200 shadow-lg hover:shadow-xl'
          }`}>
            <div className="mb-8">
              <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Pricing
              </h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Set your maximum rate per email
              </p>
            </div>
            
            {isOwnProfile && isEditing ? (
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
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
                  className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-slate-500/50 ${
                    isDark 
                      ? 'bg-slate-800/50 border-slate-700 text-white focus:border-slate-500' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-slate-500'
                  }`}
                />
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  {userData.linkedin_verified 
                    ? 'LinkedIn verified: Up to $5.00 per email'
                    : 'Unverified: Up to $2.00 per email. Verify LinkedIn to increase to $5.00'}
                </p>
              </div>
            ) : (
              <div className={`p-6 rounded-xl ${
                isDark ? 'bg-slate-800/30 border border-slate-700' : 'bg-slate-100 border border-slate-300'
              }`}>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Max Rate per Email
                </div>
                <div className={`text-4xl font-bold mb-3 ${
                  isDark ? 'text-slate-200' : 'text-slate-900'
                }`}>
                  ${userData.price_limit?.toFixed(2) || '0.00'}
                </div>
                <div className={`text-sm font-medium ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {userData.linkedin_verified 
                    ? (
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
                        isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-200 text-slate-700'
                      }`}>
                        ✓ LinkedIn verified: Up to $5.00 per email
                      </span>
                    )
                    : (
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
                        isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-200 text-slate-600'
                      }`}>
                        Unverified: Up to $2.00 per email
                      </span>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

