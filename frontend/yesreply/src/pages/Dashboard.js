import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Search, Send, Inbox, X, Sun, Moon, Settings, Plus, Paperclip, Smile, ArrowLeft, Star, Trash2, RefreshCw, Reply, Forward, Clock, TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, MessageSquare, User, Zap, Target, Award, TrendingUp as Flame, Timer, CircleDollarSign, Sparkles, Trophy, Crown, Medal, CheckCircle2, Wallet, LogOut, Bell, MoreVertical, FileText, Calendar, UserCircle } from 'lucide-react';
import Payments from './Payments';
import { useNavigate } from 'react-router-dom';

// Simple Emoji Picker Component
const EmojiPicker = ({ onEmojiSelect, isDark }) => {
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👏', '🙌',
    '👋', '🤚', '🖐', '✋', '🖖', '👊', '✊', '🤛', '🤜', '🤝',
    '🙏', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔'
  ];

  return (
    <div className={`absolute bottom-12 left-0 p-3 border z-10 ${
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
    }`}>
      <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto" style={{ width: '280px' }}>
        {emojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onEmojiSelect(emoji)}
            className={`text-xl p-1 transition-colors ${
              isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 1000, prefix = '', suffix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    const startValue = count;
    const endValue = parseFloat(value) || 0;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = startValue + (endValue - startValue) * easeOutQuart;
      
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className="font-mono tabular-nums">
      {prefix}{count.toFixed(decimals)}{suffix}
    </span>
  );
};

// Achievement Badge Component
const AchievementBadge = ({ title, description, unlocked, isDark, progress, total }) => {
  const percentage = total ? (progress / total) * 100 : 0;
  
  return (
    <div className={`p-6 border ${
      unlocked
        ? isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        : isDark ? 'bg-slate-800/50 border-slate-700/50 opacity-60' : 'bg-slate-50 border-slate-200 opacity-60'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className={`font-medium text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {title}
            </h4>
            {unlocked ? (
              <span className={`text-xs uppercase tracking-wider px-2 py-1 ${
                isDark ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                Complete
              </span>
            ) : (
              <span className={`text-xs uppercase tracking-wider px-2 py-1 ${
                isDark ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                Locked
              </span>
            )}
          </div>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {description}
          </p>
          {!unlocked && (
            <div className="mt-4">
              {total ? (
                <>
                  <div className={`h-1 overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                <div 
                  className={`h-full ${isDark ? 'bg-blue-500' : 'bg-blue-600'} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
                  <p className={`text-xs mt-2 font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                {progress} / {total}
              </p>
                </>
              ) : (
                <p className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  Not yet achieved
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Countdown Timer Component
const CountdownTimer = ({ deadline, isDark, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, percentage: 100 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const end = new Date(deadline);
      const diff = end - now;
      const totalTime = 48 * 60 * 60 * 1000;

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const percentage = (diff / totalTime) * 100;

        setTimeLeft({ hours, minutes, seconds, percentage: Math.min(percentage, 100) });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, percentage: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const getColorClass = () => {
    if (timeLeft.percentage > 50) return isDark ? 'text-emerald-400' : 'text-emerald-600';
    if (timeLeft.percentage > 25) return isDark ? 'text-amber-400' : 'text-amber-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${getColorClass()}`}>
        <Timer size={14} />
        <span className="text-xs font-mono tabular-nums">
          {timeLeft.hours}h {timeLeft.minutes}m
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2 border ${
      isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
    }`}>
      <Timer size={16} className={getColorClass()} />
      <div className="flex items-center gap-1 text-sm font-mono tabular-nums">
        <span className={getColorClass()}>{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>:</span>
        <span className={getColorClass()}>{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>:</span>
        <span className={getColorClass()}>{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
      <div className="ml-2">
        <div className={`w-20 h-1 overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
          <div 
            className={`h-full transition-all duration-1000 ${
              timeLeft.percentage > 50 
                ? 'bg-emerald-500' 
                : timeLeft.percentage > 25 
                  ? 'bg-amber-500' 
                  : 'bg-red-500'
            }`}
            style={{ width: `${timeLeft.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, trend, trendValue, prefix = '', suffix = '', isDark }) => {
  return (
    <div className={`p-8 border ${
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-start justify-between mb-6">
        <div className={`p-3 ${isDark ? 'bg-slate-700 border border-slate-600' : 'bg-slate-100 border border-slate-200'}`}>
          <Icon size={22} className={isDark ? 'text-slate-400' : 'text-slate-600'} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-3 py-1 text-xs uppercase tracking-wider ${
            trend === 'up'
              ? isDark ? 'text-emerald-400 bg-emerald-900/30 border border-emerald-800' : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
              : isDark ? 'text-red-400 bg-red-900/30 border border-red-800' : 'text-red-700 bg-red-50 border border-red-200'
          }`}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      
      <div>
        <p className={`text-xs uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          {label}
        </p>
        <p className={`text-3xl font-light ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={prefix === '$' ? 2 : 0} />
        </p>
      </div>
    </div>
  );
};

// Line Chart Component
const LineChart = ({ data, color = '#10b981', height = 200, showDots = true, isDark }) => {
  if (!data || data.length === 0) return null;

  const padding = 20;
  const width = 800;
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => ({
    x: padding + (i * (width - 2 * padding)) / (data.length - 1 || 1),
    y: height - padding - ((d.value - minValue) / range) * (height - 2 * padding)
  }));

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <line
          x1={padding}
        y1={padding}
          x2={width - padding}
        y2={padding}
        stroke={isDark ? '#334155' : '#e2e8f0'}
          strokeWidth="1"
        />
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke={isDark ? '#334155' : '#e2e8f0'}
        strokeWidth="1"
      />
      
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
      
      {showDots && points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill={color}
        />
      ))}
    </svg>
  );
};

// Generate mock analytics data
const generateAnalyticsData = (timeRange) => {
  const count = timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 12;
  const labelArray = timeRange === 'day' 
    ? Array.from({ length: 24 }, (_, i) => `${i}:00`)
    : timeRange === 'week'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : timeRange === 'month'
        ? Array.from({ length: 30 }, (_, i) => `${i + 1}`)
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const generateValue = (base, variance) => base + (Math.random() - 0.5) * variance;

  const earningsData = Array.from({ length: count }, (_, i) => ({
    label: labelArray[i],
    value: generateValue(12, 8)
  }));

  const spendingData = Array.from({ length: count }, (_, i) => ({
    label: labelArray[i],
    value: generateValue(8, 6)
  }));

  const emailsData = Array.from({ length: count }, (_, i) => ({
    label: labelArray[i],
    value: Math.floor(generateValue(45, 30))
  }));

  const replyRateData = Array.from({ length: count }, (_, i) => ({
    label: labelArray[i],
    value: generateValue(65, 25)
  }));

  const responseTimeData = Array.from({ length: count }, (_, i) => ({
    label: labelArray[i],
    value: generateValue(2.5, 1.5)
  }));

  const totalEarned = earningsData.reduce((sum, d) => sum + d.value, 0);
  const totalSpent = spendingData.reduce((sum, d) => sum + d.value, 0);
  const avgReplyRate = replyRateData.reduce((sum, d) => sum + d.value, 0) / count;
  const totalEmails = emailsData.reduce((sum, d) => sum + d.value, 0);
  const avgResponseTime = responseTimeData.reduce((sum, d) => sum + d.value, 0) / count;

  const prevPeriodEarnings = totalEarned * (0.8 + Math.random() * 0.4);
  const earningsChange = ((totalEarned - prevPeriodEarnings) / prevPeriodEarnings * 100);

  return {
    totalEarned: totalEarned,
    totalSpent: totalSpent,
    netProfit: totalEarned - totalSpent,
    earningsChange: earningsChange,
    avgReplyRate: avgReplyRate,
    totalEmails: totalEmails,
    avgResponseTime: avgResponseTime,
    earningsData,
    spendingData,
    emailsData,
    replyRateData,
    responseTimeData,
    topSenders: [
      { name: 'John Smith', earned: totalEarned * 0.3, emails: 42 },
      { name: 'Mike Chen', earned: totalEarned * 0.25, emails: 35 },
      { name: 'Sarah Johnson', earned: totalEarned * 0.2, emails: 28 },
      { name: 'Emma Davis', earned: totalEarned * 0.15, emails: 21 },
      { name: 'Alex Kumar', earned: totalEarned * 0.1, emails: 15 }
    ]
  };
};

export default function YesReplyDashboard() {
  const navigate = useNavigate();
  
  const [isDark, setIsDark] = useState(true);
  const [activeView, setActiveView] = useState('inbox');
  const [selectedThread, setSelectedThread] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyHtmlBody, setReplyHtmlBody] = useState(null);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [hoveredEmail, setHoveredEmail] = useState(null);
  const [animateStats, setAnimateStats] = useState(false);
  const [emailThreadsData, setEmailThreadsData] = useState([]);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('week');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Compose email form fields
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);
  const [composeAttachments, setComposeAttachments] = useState([]);
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardTo, setForwardTo] = useState('');
  const [forwardMessage, setForwardMessage] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);
  
  // API state
  const [sentEmails, setSentEmails] = useState([]);
  const [isLoadingSent, setIsLoadingSent] = useState(false);
  const [inboxEmails, setInboxEmails] = useState([]);
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);
  const [starredEmails, setStarredEmails] = useState([]);
  const [isLoadingStarred, setIsLoadingStarred] = useState(false);
  const [deletedEmails, setDeletedEmails] = useState([]);
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false);
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  
  // Thread state
  const [fullThread, setFullThread] = useState(null);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [showThreadMessageDropdown, setShowThreadMessageDropdown] = useState(false);
  
  // Smart Summary state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summary, setSummary] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  
  // Meeting Scheduling state
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingDuration, setMeetingDuration] = useState(30); // minutes
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  
  // Gamification state
  const [currentStreak, setCurrentStreak] = useState(3);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [achievements, setAchievements] = useState([
    { id: 1, icon: Zap, title: 'First Reply', description: 'Respond to your first paid email', unlocked: false },
    { id: 2, icon: Target, title: '10 Replies', description: 'Respond to 10 paid emails', unlocked: false, progress: 0, total: 10 },
    { id: 3, icon: Trophy, title: '50 Replies', description: 'Respond to 50 paid emails', unlocked: false, progress: 0, total: 50 },
    { id: 4, icon: DollarSign, title: 'First $100', description: 'Earn your first $100', unlocked: false },
    { id: 5, icon: Crown, title: 'VIP Status', description: 'Earn $1,000 total', unlocked: false, progress: 0, total: 1000 },
    { id: 6, icon: Flame, title: '7-Day Streak', description: 'Reply daily for 7 days', unlocked: false, progress: 0, total: 7 },
  ]);

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_BACKEND_API_PATH || 'http://localhost:8000';
  
  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('access_token');
  };
  
  // Fetch current user info
  const fetchCurrentUser = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };
  
  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/payments/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const walletData = await response.json();
        setWalletBalance(walletData.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };
  
  // Fetch notifications
  const fetchNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const token = getAuthToken();
      if (!token) {
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/notifications/?page=1&page_size=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadNotificationCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };
  
  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      await fetch(`${API_BASE_URL}/api/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notification_ids: [notificationId]
        })
      });
      
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? {...n, is_read: true} : n
      ));
      setUnreadNotificationCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Generate Google Calendar link
  const generateGoogleCalendarLink = (date, time, duration, location, description) => {
    const dateObj = new Date(`${date}T${time}`);
    const endTime = new Date(dateObj.getTime() + duration * 60000);
    
    // Format dates for Google Calendar (YYYYMMDDTHHMMSS)
    const formatGoogleDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };
    
    const meetingTitle = selectedThread?.subject || 'Meeting Invitation';
    const startDate = formatGoogleDate(dateObj);
    const endDate = formatGoogleDate(endTime);
    
    // Build Google Calendar URL
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: meetingTitle,
      dates: `${startDate}/${endDate}`,
      details: description || '',
      location: location || '',
      sf: 'true',
      output: 'xml'
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };
  
  // Generate meeting message and ICS file
  const generateMeetingMessage = (date, time, duration, location, description) => {
    const dateObj = new Date(`${date}T${time}`);
    const endTime = new Date(dateObj.getTime() + duration * 60000);
    
    const formatDate = (d) => {
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };
    
    const formatTime = (d) => {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };
    
    // Get recipient name from selected thread
    const recipientName = selectedThread?.sender?.first_name || selectedThread?.receiver?.first_name || '';
    const greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';
    
    // Generate Google Calendar link
    const googleCalendarLink = generateGoogleCalendarLink(date, time, duration, location, description);
    
    // Build meeting details
    let message = `${greeting}\n\n`;
    message += `I'd like to schedule a meeting with you. Here are the details:\n\n`;
    message += `📅 Date: ${formatDate(dateObj)}\n`;
    message += `🕐 Time: ${formatTime(dateObj)} - ${formatTime(endTime)}\n`;
    message += `⏱️ Duration: ${duration} minutes\n`;
    
    if (location) {
      message += `📍 Location: ${location}\n`;
    }
    
    if (description) {
      message += `\n📝 Details:\n${description}\n`;
    }
    
    message += `\n📎 Add to Calendar:\n`;
    message += `\nClick here to add to Google Calendar:\n${googleCalendarLink}\n\n`;
    message += `Or use the attached .ics file to add to any calendar application\n`;
    
    message += `\nPlease let me know if this time works for you, or if you'd prefer an alternative time.\n\n`;
    message += `Looking forward to our conversation!\n\n`;
    message += `Best regards,\n`;
    message += currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Best regards';
    
    return message;
  };
  
  // Create ICS file attachment
  const createICSAttachment = async (date, time, duration, location, description) => {
    const dateObj = new Date(`${date}T${time}`);
    const endTime = new Date(dateObj.getTime() + duration * 60000);
    
    // Get current user info
    const organizerName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Meeting Organizer';
    const organizerEmail = currentUser ? `${currentUser.username}@yesreply.tech` : 'organizer@yesreply.tech';
    
    // Get recipient info from selected thread
    const recipientEmail = selectedThread?.receiver?.email || selectedThread?.sender?.email || 'recipient@yesreply.tech';
    
    const meetingTitle = selectedThread?.subject || 'Meeting Invitation';
    
    // Format dates for ICS (UTC format: YYYYMMDDTHHMMSSZ)
    const formatICSDate = (d) => {
      const utc = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return utc.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const dtstart = formatICSDate(dateObj);
    const dtend = formatICSDate(endTime);
    const dtstamp = formatICSDate(new Date());
    
    // Generate ICS content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//YesReply//Meeting Scheduler//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@yesreply.tech`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${meetingTitle}`,
      `ORGANIZER;CN=${organizerName}:MAILTO:${organizerEmail}`,
      `ATTENDEE;CN=${recipientEmail};RSVP=TRUE:MAILTO:${recipientEmail}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
    ];
    
    if (description) {
      icsContent.push(`DESCRIPTION:${description.replace(/\n/g, '\\n')}`);
    }
    
    if (location) {
      icsContent.push(`LOCATION:${location}`);
    }
    
    icsContent.push(
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${meetingTitle}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    );
    
    const icsText = icsContent.join('\r\n');
    
    // Convert to base64
    const icsBase64 = btoa(unescape(encodeURIComponent(icsText)));
    
    return {
      filename: `meeting_${date.replace(/-/g, '')}_${time.replace(/:/g, '')}.ics`,
      content_type: 'text/calendar; charset=utf-8; method=REQUEST',
      data: icsBase64,
      size: icsText.length
    };
  };
  
  // Generate HTML version of meeting message with clickable link
  const generateMeetingMessageHTML = (date, time, duration, location, description) => {
    const dateObj = new Date(`${date}T${time}`);
    const endTime = new Date(dateObj.getTime() + duration * 60000);
    
    const formatDate = (d) => {
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };
    
    const formatTime = (d) => {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };
    
    // Get recipient name from selected thread
    const recipientName = selectedThread?.sender?.first_name || selectedThread?.receiver?.first_name || '';
    const greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';
    
    // Generate Google Calendar link
    const googleCalendarLink = generateGoogleCalendarLink(date, time, duration, location, description);
    
    // Build HTML message
    let htmlMessage = `<p>${greeting}</p>`;
    htmlMessage += `<p>I'd like to schedule a meeting with you. Here are the details:</p>`;
    htmlMessage += `<ul style="list-style: none; padding-left: 0;">`;
    htmlMessage += `<li>📅 <strong>Date:</strong> ${formatDate(dateObj)}</li>`;
    htmlMessage += `<li>🕐 <strong>Time:</strong> ${formatTime(dateObj)} - ${formatTime(endTime)}</li>`;
    htmlMessage += `<li>⏱️ <strong>Duration:</strong> ${duration} minutes</li>`;
    
    if (location) {
      htmlMessage += `<li>📍 <strong>Location:</strong> ${location}</li>`;
    }
    
    htmlMessage += `</ul>`;
    
    if (description) {
      htmlMessage += `<p><strong>📝 Details:</strong><br>${description.replace(/\n/g, '<br>')}</p>`;
    }
    
    htmlMessage += `<p><strong>📎 Add to Calendar:</strong></p>`;
    htmlMessage += `<p style="margin: 10px 0;">`;
    htmlMessage += `<a href="${googleCalendarLink}" style="display: inline-block; padding: 10px 20px; background-color: #4285f4; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;" target="_blank">📅 Add to Google Calendar</a>`;
    htmlMessage += `</p>`;
    htmlMessage += `<p style="color: #666; font-size: 12px;">Or use the attached .ics file to add to any calendar application</p>`;
    
    htmlMessage += `<p>Please let me know if this time works for you, or if you'd prefer an alternative time.</p>`;
    htmlMessage += `<p>Looking forward to our conversation!</p>`;
    htmlMessage += `<p>Best regards,<br>${currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Best regards'}</p>`;
    
    return htmlMessage;
  };
  
  // Handle meeting scheduling
  const handleScheduleMeeting = async () => {
    if (!meetingDate || !meetingTime || !selectedThread) {
      alert('Please fill in all required fields (Date and Time)');
      return;
    }
    
    try {
      // Generate meeting message (plain text)
      const meetingMessage = generateMeetingMessage(
        meetingDate,
        meetingTime,
        meetingDuration,
        meetingLocation,
        meetingDescription
      );
      
      // Generate HTML version with clickable link
      const meetingMessageHTML = generateMeetingMessageHTML(
        meetingDate,
        meetingTime,
        meetingDuration,
        meetingLocation,
        meetingDescription
      );
      
      // Create ICS attachment
      const icsAttachment = await createICSAttachment(
        meetingDate,
        meetingTime,
        meetingDuration,
        meetingLocation,
        meetingDescription
      );
      
      // Set reply text with meeting message
      setReplyText(meetingMessage);
      
      // Store HTML version for sending (we'll need to update the reply function to use it)
      // For now, we'll store it in a state or pass it along
      
      // Set attachment (ICS file)
      setReplyAttachments([icsAttachment]);
      
      // Store HTML message in a way that can be used when sending
      // We'll need to check how the reply function handles HTML
      
      // Close modal
      setShowMeetingModal(false);
      
      // Optionally auto-focus the reply textarea
      // The user can now review and send the email with the meeting invite
    } catch (error) {
      console.error('Error generating meeting invite:', error);
      alert('Failed to generate meeting invite. Please try again.');
    }
  };
  
  // Fetch smart summary for an email thread
  const fetchSmartSummary = async (emailId) => {
    setIsLoadingSummary(true);
    setSummaryError(null);
    setSummary('');
    setShowSummaryModal(true);
    
    try {
      const token = getAuthToken();
      if (!token) {
        setSummaryError('Authentication required');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/emails/${emailId}/smart-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary || 'No summary available');
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to generate summary' }));
        setSummaryError(errorData.detail || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Error fetching smart summary:', error);
      setSummaryError('Failed to generate summary. Please try again.');
    } finally {
      setIsLoadingSummary(false);
    }
  };
  
  // Fetch inbox emails from API
  const fetchInboxEmails = async () => {
    setIsLoadingInbox(true);
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/emails/?sent=false&page=1&page_size=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInboxEmails(data.emails || []);
      } else {
        console.error('Failed to fetch inbox emails:', response.status);
      }
    } catch (error) {
      console.error('Error fetching inbox emails:', error);
    } finally {
      setIsLoadingInbox(false);
    }
  };
  
  // Fetch starred emails from API
  const fetchStarredEmails = async () => {
    setIsLoadingStarred(true);
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/emails/?starred=true&page=1&page_size=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStarredEmails(data.emails || []);
      } else {
        console.error('Failed to fetch starred emails:', response.status);
      }
    } catch (error) {
      console.error('Error fetching starred emails:', error);
    } finally {
      setIsLoadingStarred(false);
    }
  };
  
  // Fetch sent emails from API
  const fetchSentEmails = async () => {
    setIsLoadingSent(true);
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/emails/?sent=true&page=1&page_size=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSentEmails(data.emails || []);
      } else {
        console.error('Failed to fetch sent emails:', response.status);
      }
    } catch (error) {
      console.error('Error fetching sent emails:', error);
    } finally {
      setIsLoadingSent(false);
    }
  };
  
  // Fetch deleted emails from API
  const fetchDeletedEmails = async () => {
    setIsLoadingDeleted(true);
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/emails/?include_deleted=true&page=1&page_size=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const deleted = (data.emails || []).filter(email => email.is_deleted === true);
        setDeletedEmails(deleted);
      } else {
        console.error('Failed to fetch deleted emails:', response.status);
      }
    } catch (error) {
      console.error('Error fetching deleted emails:', error);
    } finally {
      setIsLoadingDeleted(false);
    }
  };
  
  // Toggle starred status
  const handleToggleStarred = async (emailId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/emails/${emailId}/star`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const updatedEmail = await response.json();
        
        setInboxEmails(prev => prev.map(email => 
          email.id === emailId ? {...email, is_starred: updatedEmail.is_starred} : email
          ));
        setSentEmails(prev => prev.map(email => 
          email.id === emailId ? {...email, is_starred: updatedEmail.is_starred} : email
        ));
        setStarredEmails(prev => prev.map(email => 
          email.id === emailId ? {...email, is_starred: updatedEmail.is_starred} : email
        ));
      }
    } catch (error) {
      console.error('Error toggling starred:', error);
    }
  };
  
  // Fetch email thread
  const fetchEmailThread = async (emailId) => {
    setIsLoadingThread(true);
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/emails/${emailId}/thread`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const threadData = await response.json();
        setFullThread(threadData);
      } else {
        console.error('Failed to fetch thread:', response.status);
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
    } finally {
      setIsLoadingThread(false);
    }
  };
  
  // Delete email
  const handleDeleteEmail = async (emailId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/emails/${emailId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setInboxEmails(prev => prev.filter(email => email.id !== emailId));
        setSentEmails(prev => prev.filter(email => email.id !== emailId));
        setStarredEmails(prev => prev.filter(email => email.id !== emailId));
        
        if (selectedThread && selectedThread.id === emailId) {
          setSelectedThread(null);
          setFullThread(null);
        }
      }
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  };
  
  // Send email
  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject || !composeBody) {
      alert('Please fill in all fields');
      return;
    }
    
    setIsSending(true);
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      // Step 1: Create the email
      const createResponse = await fetch(`${API_BASE_URL}/api/emails/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          received_by: composeTo,
          subject: composeSubject,
          body: composeBody,
          attachments: composeAttachments.length > 0 ? JSON.stringify(composeAttachments) : null
        })
      });
      
      if (!createResponse.ok) {
        const error = await createResponse.json();
        alert(error.detail || 'Failed to create email');
        return;
      }
      
      const createdEmail = await createResponse.json();
      
      // Step 2: Send the email
      const sendResponse = await fetch(`${API_BASE_URL}/api/emails/${createdEmail.id}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (sendResponse.ok) {
        setShowCompose(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        setComposeAttachments([]);
        fetchSentEmails();
      } else {
        const error = await sendResponse.json();
        alert(error.detail || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  // Send reply
  const handleSendReply = async () => {
    if (!replyText || !selectedThread) {
      return;
    }
    
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      // Determine which email ID to reply to
      // Use the most recent email in the thread to ensure proper threading
      let emailIdToReplyTo = selectedThread.id;
      
      // If we have fullThread data, use the last email in the thread
      if (fullThread && fullThread.thread_emails && fullThread.thread_emails.length > 0) {
        const lastEmail = fullThread.thread_emails[fullThread.thread_emails.length - 1];
        emailIdToReplyTo = lastEmail.id;
        console.log('Replying to last email in thread:', emailIdToReplyTo);
      }
      
      // Use the dedicated reply endpoint which handles threading automatically
      const replyResponse = await fetch(`${API_BASE_URL}/api/emails/${emailIdToReplyTo}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          body: replyText,
          html_body: replyHtmlBody || null,
          attachments: replyAttachments.length > 0 ? JSON.stringify(replyAttachments) : null
        })
      });
      
      if (replyResponse.ok) {
        setReplyText('');
        setReplyHtmlBody(null);
        setReplyAttachments([]);
        fetchInboxEmails();
        setSelectedThread(null);
        console.log('Reply sent successfully with proper threading');
      } else {
        const error = await replyResponse.json();
        alert(error.detail || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    }
  };

  const analyticsData = useMemo(() => generateAnalyticsData(analyticsTimeRange), [analyticsTimeRange]);

  useEffect(() => {
    setAnimateStats(true);
  }, [activeView]);

  useEffect(() => {
    setEmailThreadsData([]);
    fetchCurrentUser();
    fetchWalletBalance();
    fetchNotifications();
    
    const notificationInterval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(notificationInterval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
      if (showThreadMessageDropdown && !event.target.closest('.thread-message-dropdown-menu')) {
        setShowThreadMessageDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showThreadMessageDropdown]);
  
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    
    if (activeView === 'inbox') {
      fetchInboxEmails();
    } else if (activeView === 'starred') {
      fetchStarredEmails();
    } else if (activeView === 'sent') {
      fetchSentEmails();
    } else if (activeView === 'deleted') {
      fetchDeletedEmails();
    }
  }, [activeView]);

  useEffect(() => {
    if (selectedThread) {
      const updatedThread = emailThreadsData.find(thread => thread.id === selectedThread.id);
      if (updatedThread) {
        setSelectedThread(updatedThread);
      }
    }
  }, [emailThreadsData]);

  const toggleStarred = (threadId) => {
    handleToggleStarred(threadId);
    
    setEmailThreadsData(prev =>
      prev.map(thread =>
        thread.id === threadId ? { ...thread, starred: !thread.starred } : thread
      )
    );
  };

  const convertEmailToThread = (email, isSent = false) => {
    const senderName = email.sender_username || email.sender_email?.split('@')[0] || 'Unknown';
    const receiverName = email.receiver_username || email.receiver_email?.split('@')[0] || 'Unknown';
    const senderEmail = email.sender_email || 'unknown@example.com';
    const receiverEmail = email.receiver_email || 'unknown@example.com';
    const senderUsername = email.sender_username || '';
    const receiverUsername = email.receiver_username || '';
    
    return {
      id: email.id,
      subject: email.subject,
      participants: isSent ? ['You', receiverName] : [senderName, 'You'],
      lastSender: isSent ? 'You' : senderName,
      lastEmail: isSent ? receiverEmail : senderEmail,
      recipientUsername: isSent ? receiverUsername : senderUsername, // Store actual username for replies
      preview: email.body.substring(0, 100) + (email.body.length > 100 ? '...' : ''),
      time: new Date(email.created_at).toLocaleString(),
      unread: !email.is_read,
      starred: email.is_starred,
      important: email.priority === 'high',
      labels: [],
      threadCount: 1,
      totalEarned: isSent ? 0 : 0.20,
      messages: [{
        id: email.id,
        sender: isSent ? 'You' : senderName,
        email: senderEmail,
        content: email.body,
        time: new Date(email.created_at).toLocaleString(),
        earned: isSent ? 0 : 0.20,
        isSent: isSent,
        isFirstMessage: true
      }]
    };
  };

  const getFilteredThreads = () => {
    let threads = emailThreadsData;

    if (activeView === 'inbox') {
      threads = inboxEmails.map(email => convertEmailToThread(email, false));
    } else if (activeView === 'starred') {
      threads = starredEmails.map(email => convertEmailToThread(email, email.sent_by === 'current_user_id'));
    } else if (activeView === 'sent') {
      threads = sentEmails.map(email => convertEmailToThread(email, true));
    } else if (activeView === 'deleted') {
      threads = deletedEmails.map(email => convertEmailToThread(email, email.sent_by === 'current_user_id'));
    }

    if (searchQuery) {
      threads = threads.filter(
        thread =>
        thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          thread.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
          thread.preview.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return threads;
  };

  const filteredThreads = getFilteredThreads();

  const handleRefresh = () => {
    setIsRefreshing(true);
          if (activeView === 'inbox') {
      fetchInboxEmails();
          } else if (activeView === 'starred') {
      fetchStarredEmails();
    } else if (activeView === 'sent') {
      fetchSentEmails();
          } else if (activeView === 'deleted') {
      fetchDeletedEmails();
          }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className={`flex items-center gap-3 text-xl font-semibold ${
                    isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <div className={`p-2 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <Mail size={20} />
                  </div>
              yesreply
                </div>

            {/* Right side controls */}
              <div className="flex items-center gap-3">
              {/* Wallet Balance */}
              <div className={`flex items-center gap-2 px-4 py-2 border text-sm ${
                isDark ? 'border-slate-800 bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}>
                <Wallet size={16} />
                <span className="font-mono">${walletBalance.toFixed(2)}</span>
                </div>

              {/* Notifications */}
                <div className="relative notification-dropdown">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 transition-all ${
                      isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Bell size={18} />
                    {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs flex items-center justify-center font-mono">
                      {unreadNotificationCount}
                      </span>
                    )}
                  </button>
                  
                  {showNotifications && (
                  <div className={`absolute right-0 mt-2 w-96 border z-50 ${
                      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                    }`}>
                      <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                      <h3 className={`text-sm font-medium uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Notifications
                          </h3>
                        </div>
                      <div className="max-h-96 overflow-y-auto">
                        {isLoadingNotifications ? (
                          <div className="p-8 text-center">
                          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Loading...</div>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell size={32} className={`mx-auto mb-2 opacity-50 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No notifications</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => {
                                if (!notification.is_read) {
                                  markNotificationAsRead(notification.id);
                                }
                              }}
                              className={`px-4 py-3 border-b cursor-pointer transition-all ${
                                isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-200 hover:bg-slate-50'
                              } ${!notification.is_read ? (isDark ? 'bg-slate-700/30' : 'bg-blue-50/30') : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 mt-2 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {notification.title}
                                  </p>
                                  <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {notification.message}
                                  </p>
                                <p className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                    {new Date(notification.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setIsDark(!isDark)}
                className={`p-2 transition-all ${
                    isDark
                    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <button
                  onClick={() => navigate('/profile')}
                className={`p-2 transition-all ${
                    isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Profile"
                >
                  <User size={18} />
                </button>

                <button
                  onClick={() => {
                    localStorage.removeItem('access_token');
                    navigate('/');
                  }}
                className={`p-2 transition-all ${
                    isDark
                    ? 'bg-slate-800 text-red-400 hover:bg-slate-700'
                    : 'bg-slate-100 text-red-600 hover:bg-slate-200'
                  }`}
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        {/* SIDEBAR */}
        <div
          className={`w-64 border-r ${
            isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
          } flex flex-col`}
        >
          <div className="p-4">
            <button
              onClick={() => setShowCompose(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 font-medium text-white transition-all bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={20} />
              Compose
            </button>
          </div>

          <nav className="flex-1 px-2 space-y-1">
            <button
              onClick={() => {
                setActiveView('inbox');
                setSelectedThread(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-sm uppercase tracking-wider ${
                activeView === 'inbox'
                  ? isDark
                    ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                    : 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                  : isDark
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Inbox size={18} />
              <span className="font-medium">Inbox</span>
              {inboxEmails.filter(e => !e.is_read).length > 0 && (
                <span
                  className={`ml-auto text-xs px-2 py-0.5 font-mono ${
                    activeView === 'inbox'
                      ? isDark
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-500'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                      : isDark
                      ? 'bg-slate-800 text-slate-400 border border-slate-700'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {inboxEmails.filter(e => !e.is_read).length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveView('starred');
                setSelectedThread(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-sm uppercase tracking-wider ${
                activeView === 'starred'
                  ? isDark
                    ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                    : 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                  : isDark
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Star size={18} />
              <span className="font-medium">Starred</span>
            </button>

            <button
              onClick={() => {
                setActiveView('sent');
                setSelectedThread(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-sm uppercase tracking-wider ${
                activeView === 'sent'
                  ? isDark
                    ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                    : 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                  : isDark
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Send size={18} />
              <span className="font-medium">Sent</span>
            </button>

            <button
              onClick={() => {
                setActiveView('deleted');
                setSelectedThread(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-sm uppercase tracking-wider ${
                activeView === 'deleted'
                  ? isDark
                    ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                    : 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                  : isDark
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Trash2 size={18} />
              <span className="font-medium">Deleted</span>
            </button>

            <div className={`my-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />

            <button
              onClick={() => {
                setActiveView('analytics');
                setSelectedThread(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-sm uppercase tracking-wider ${
                activeView === 'analytics'
                  ? isDark
                    ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                    : 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                  : isDark
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 size={18} />
              <span className="font-medium">Analytics</span>
            </button>

            <button
              onClick={() => {
                setActiveView('payments');
                setSelectedThread(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-sm uppercase tracking-wider ${
                activeView === 'payments'
                  ? isDark
                    ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                    : 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                  : isDark
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Wallet size={18} />
              <span className="font-medium">Wallet</span>
            </button>

            <button
              onClick={() => {
                setActiveView('achievements');
                setSelectedThread(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-sm uppercase tracking-wider ${
                activeView === 'achievements'
                  ? isDark
                    ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                    : 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                  : isDark
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Trophy size={18} />
              <span className="font-medium">Achievements</span>
              {achievements.filter(a => a.unlocked).length > 0 && (
                <span className={`ml-auto text-xs px-2 py-0.5 font-mono ${
                  isDark 
                    ? 'bg-blue-900/30 text-blue-400 border border-blue-800' 
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {achievements.filter(a => a.unlocked).length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeView === 'analytics' ? (
            // ANALYTICS VIEW
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-7xl mx-auto p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <h1 className={`text-4xl font-light tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Analytics
                    </h1>
                    <p className={`text-sm mt-2 uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      Performance overview and insights
                    </p>
                  </div>
                  
                  {/* Time Range Selector */}
                  <div className={`flex items-center gap-1 p-1 border ${
                    isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
                  }`}>
                    {['day', 'week', 'month', 'year'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setAnalyticsTimeRange(range)}
                        className={`px-4 py-2 text-xs uppercase tracking-wider font-medium transition-all ${
                          analyticsTimeRange === range
                            ? isDark
                              ? 'bg-slate-800 text-white'
                              : 'bg-slate-100 text-slate-900'
                            : isDark
                            ? 'text-slate-400 hover:text-slate-300'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-6 mb-12">
                  <StatCard
                    icon={DollarSign}
                    label="Total Earned"
                    value={analyticsData.totalEarned}
                    prefix="$"
                    trend="up"
                    trendValue={`${analyticsData.earningsChange.toFixed(1)}%`}
                    isDark={isDark}
                  />
                  <StatCard
                    icon={MessageSquare}
                    label="Total Emails"
                    value={analyticsData.totalEmails}
                    isDark={isDark}
                  />
                  <StatCard
                    icon={Activity}
                    label="Reply Rate"
                    value={analyticsData.avgReplyRate}
                    suffix="%"
                    isDark={isDark}
                  />
                  <StatCard
                    icon={Clock}
                    label="Avg Response"
                    value={analyticsData.avgResponseTime}
                    suffix="hrs"
                    isDark={isDark}
                  />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-2 gap-6 mb-12">
                  <div className={`p-8 border ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                    <h3 className={`text-lg font-light mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Earnings Over Time
                      </h3>
                    <LineChart data={analyticsData.earningsData} color="#10b981" isDark={isDark} />
                </div>

                  <div className={`p-8 border ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    <h3 className={`text-lg font-light mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Email Volume
                      </h3>
                    <LineChart data={analyticsData.emailsData} color="#3b82f6" isDark={isDark} />
                    </div>
                  </div>

                  {/* Top Senders */}
                <div className={`p-8 border ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                  <h3 className={`text-lg font-light mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Top Senders
                      </h3>
                    <div className="space-y-4">
                    {analyticsData.topSenders.map((sender, idx) => (
                      <div key={idx} className={`flex items-center justify-between py-4 border-b ${
                        isDark ? 'border-slate-700' : 'border-slate-200'
                      }`}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                            {sender.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                            <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {sender.name}
                                  </div>
                            <div className={`text-sm font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {sender.emails} emails
                                  </div>
                                </div>
                              </div>
                        <div className={`text-lg font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                ${sender.earned.toFixed(2)}
                            </div>
                            </div>
                    ))}
                          </div>
                    </div>
                  </div>
            </div>
          ) : activeView === 'achievements' ? (
            // ACHIEVEMENTS VIEW
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-5xl mx-auto p-8">
                <div className="mb-12">
                  <h1 className={`text-4xl font-light tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Achievements
                      </h1>
                  <p className={`text-sm mt-2 uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Track your progress and earn rewards
                      </p>
                  </div>

                {/* Streak Card */}
                <div className={`p-8 border mb-8 ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-2xl font-light mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Current Streak
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Keep replying to maintain your streak
                      </p>
                    </div>
                    <div className="text-center">
                      <div className={`text-5xl font-light font-mono ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        {currentStreak}
                    </div>
                      <div className={`text-sm uppercase tracking-wider mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        Days
                    </div>
                  </div>
                    </div>
                  </div>

                {/* Achievements Grid */}
                <div className="grid grid-cols-2 gap-6">
                  {achievements.map((achievement) => (
                        <AchievementBadge
                          key={achievement.id}
                          title={achievement.title}
                          description={achievement.description}
                          unlocked={achievement.unlocked}
                          progress={achievement.progress}
                          total={achievement.total}
                          isDark={isDark}
                        />
                      ))}
                    </div>
                  </div>
                </div>
          ) : activeView === 'payments' ? (
            // PAYMENTS VIEW
            <div className="flex-1 overflow-y-auto">
              <Payments isDark={isDark} />
            </div>
          ) : (
            // EMAIL VIEW (Inbox, Sent, Starred, Deleted)
            <>
              {!selectedThread ? (
            <>
                  {/* Email List Header */}
                  <div className={`border-b p-4 ${
                      isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                          isDark ? 'text-slate-500' : 'text-slate-400'
                        }`} size={18} />
                        <input
                          type="text"
                          placeholder="Search emails..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2 border text-sm ${
                        isDark
                              ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                              : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                          } focus:outline-none`}
                        />
                      </div>
                        <button
                        onClick={handleRefresh}
                        className={`p-2 border transition-all ${
                            isDark
                            ? 'border-slate-700 text-slate-400 hover:bg-slate-800'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                </div>
              </div>

              {/* Email List */}
              <div className="flex-1 overflow-y-auto">
                    {(activeView === 'inbox' && isLoadingInbox) ||
                     (activeView === 'sent' && isLoadingSent) ||
                     (activeView === 'starred' && isLoadingStarred) ||
                     (activeView === 'deleted' && isLoadingDeleted) ? (
                      <div className="flex items-center justify-center h-64">
                        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Loading...
                      </div>
                    </div>
                  ) : filteredThreads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64">
                        <Inbox size={48} className={`mb-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                          No emails found
                        </p>
                    </div>
                  ) : (
                    filteredThreads.map((thread) => (
                    <div
                      key={thread.id}
                          onClick={async () => {
                            setSelectedThread(thread);
                            setFullThread(null); // Reset previous thread
                            // Fetch full thread with all emails
                            await fetchEmailThread(thread.id);
                            // Mark email as read when clicked
                            if (thread.unread && activeView === 'inbox') {
                              try {
                                const token = getAuthToken();
                                await fetch(`${API_BASE_URL}/api/emails/${thread.id}/read`, {
                                  method: 'PUT',
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                  }
                                });
                                // Update local state to reflect read status
                                setInboxEmails(prev => prev.map(email => 
                                  email.id === thread.id ? {...email, is_read: true} : email
                                ));
                                // Refresh unread count
                                fetchNotifications();
                              } catch (error) {
                                console.error('Error marking email as read:', error);
                              }
                            }
                          }}
                          onMouseEnter={() => setHoveredEmail(thread.id)}
                          onMouseLeave={() => setHoveredEmail(null)}
                          className={`border-b px-6 py-4 cursor-pointer transition-all ${
                        isDark
                              ? `border-slate-800 ${hoveredEmail === thread.id ? 'bg-slate-800/50' : ''}`
                              : `border-slate-200 ${hoveredEmail === thread.id ? 'bg-slate-50' : ''}`
                          }`}
                        >
                          <div className="flex items-start gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                              toggleStarred(thread.id);
                        }}
                              className="pt-1"
                      >
                        <Star
                          size={18}
                                className={thread.starred 
                                  ? 'fill-amber-400 text-amber-400' 
                                  : isDark ? 'text-slate-600' : 'text-slate-300'
                                }
                        />
                      </button>

                      <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-1">
                                    <span className={`font-medium text-sm ${
                              thread.unread
                                        ? isDark ? 'text-white' : 'text-slate-900'
                                        : isDark ? 'text-slate-400' : 'text-slate-600'
                                    }`}>
                                      {thread.participants.join(', ')}
                          </span>
                                    {thread.unread && (
                                      <span className="w-2 h-2 bg-blue-500" />
                          )}
                        </div>
                                  <div className={`text-sm ${
                                    thread.unread
                                      ? isDark ? 'text-white' : 'text-slate-900'
                                      : isDark ? 'text-slate-400' : 'text-slate-600'
                                  }`}>
                                    {thread.subject}
                        </div>
                      </div>
                                <div className="flex items-center gap-3">
                                  {thread.totalEarned > 0 && (
                                    <span className={`text-xs font-mono px-2 py-1 ${
                            isDark 
                                        ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}>
                          +${thread.totalEarned.toFixed(2)}
                                    </span>
                        )}
                                  <span className={`text-xs font-mono ${
                                    isDark ? 'text-slate-500' : 'text-slate-500'
                                  }`}>
                        {thread.time}
                                  </span>
                                </div>
                              </div>
                              <p className={`text-sm truncate ${
                                isDark ? 'text-slate-500' : 'text-slate-500'
                              }`}>
                                {thread.preview}
                              </p>
                        </div>
                      </div>
                    </div>
                  ))
                  )}
              </div>
            </>
          ) : (
                // EMAIL THREAD VIEW
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Thread Header */}
                  <div className={`border-b p-4 ${
                    isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
                  }`}>
                <div className="flex items-center justify-between">
              <button
                        onClick={() => setSelectedThread(null)}
                        className={`flex items-center gap-2 px-4 py-2 border text-sm transition-all ${
                          isDark
                            ? 'border-slate-700 text-slate-400 hover:bg-slate-800'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                        <ArrowLeft size={16} />
                        Back
              </button>

                      <div className="flex items-center gap-2">
                <button
                          onClick={() => toggleStarred(selectedThread.id)}
                          className={`p-2 border transition-all ${
                            isDark
                              ? 'border-slate-700 hover:bg-slate-800'
                              : 'border-slate-200 hover:bg-slate-50'
                  }`}
                        >
                          <Star
                            size={18}
                            className={selectedThread.starred 
                              ? 'fill-amber-400 text-amber-400' 
                              : isDark ? 'text-slate-400' : 'text-slate-600'
                            }
                          />
                </button>
                <div className="relative thread-message-dropdown-menu">
                  <button
                    onClick={() => setShowThreadMessageDropdown(!showThreadMessageDropdown)}
                    className={`px-3 py-2 text-sm font-medium border transition-all ${
                      isDark
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title="AI Assist"
                  >
                    AI Assist
                  </button>
                  
                  {showThreadMessageDropdown && (
                    <div className={`absolute right-0 mt-2 w-56 border z-50 ${
                      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                    }`}>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowThreadMessageDropdown(false);
                            if (selectedThread) {
                              fetchSmartSummary(selectedThread.id);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                            isDark
                              ? 'text-slate-300 hover:bg-slate-700'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <FileText size={16} />
                          <span>Smart summary</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowThreadMessageDropdown(false);
                            setShowMeetingModal(true);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                            isDark
                              ? 'text-slate-300 hover:bg-slate-700'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Calendar size={16} />
                          <span>Schedule a meeting</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                          onClick={() => {
                            if (window.confirm('Delete this email?')) {
                              handleDeleteEmail(selectedThread.id);
                            }
                          }}
                          className={`p-2 border transition-all ${
                            isDark
                              ? 'border-slate-700 text-red-400 hover:bg-slate-800'
                              : 'border-slate-200 text-red-600 hover:bg-slate-50'
                  }`}
                >
                      <Trash2 size={18} />
                </button>
                  </div>
              </div>
            </div>

                  {/* Thread Messages */}
              <div className="flex-1 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                      {/* Subject Header */}
                      <div className={`px-6 py-5 border-b ${
                        isDark ? 'border-slate-800/50' : 'border-slate-200/50'
                      }`}>
                        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {selectedThread.subject}
                        </h2>
                      </div>

                      {/* Messages */}
              {isLoadingThread ? (
                <div className="px-6 py-12 text-center">
                  <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Loading thread...
                  </div>
                </div>
              ) : fullThread && fullThread.thread_emails ? (
                <div className="px-6 py-6">
                  <div className="space-y-6">
                    {fullThread.thread_emails.map((email, idx) => {
                      // Check if this email is from the current user (sender) or to the current user (receiver)
                      const isFromCurrentUser = currentUser && email.sent_by === currentUser.id;
                      const senderName = email.sender_username || email.sender_email?.split('@')[0] || 'Unknown';
                      const senderEmail = email.sender_email || `${email.sender_username}@yesreply.tech` || '';
                      // Get initial from sender name
                      const senderInitial = senderName.charAt(0).toUpperCase();
                      const isFirstEmail = idx === 0;
                      const isReply = idx > 0;
                      
                      return (
                        <div key={email.id} className={`relative ${
                          !isFirstEmail ? 'border-t' : ''
                        } ${
                          isDark ? 'border-slate-800' : 'border-slate-200'
                        }`}>
                            
                            <div className="relative">
                              <div className={isFirstEmail ? 'py-6' : 'py-5'}>
                                <div className="flex items-start gap-4">
                                  {/* Profile Picture */}
                                  <div className="flex-shrink-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      isFromCurrentUser
                                        ? isDark 
                                          ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                                          : 'bg-gradient-to-br from-blue-400 to-blue-500'
                                        : isDark 
                                          ? 'bg-slate-700' 
                                          : 'bg-slate-300'
                                    }`}>
                                      <span className={`text-sm font-semibold ${
                                        isFromCurrentUser 
                                          ? 'text-white' 
                                          : isDark ? 'text-slate-300' : 'text-slate-600'
                                      }`}>
                                        {senderInitial}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Message Content - Gmail Style */}
                                  <div className="flex-1 min-w-0">
                                    {/* Sender Info - Bold and Prominent */}
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className={`text-base font-semibold break-words ${
                                            isDark ? 'text-white' : 'text-slate-900'
                                          }`}>
                                            {senderName}
                                          </span>
                                          <span className={`text-xs break-words ${
                                            isDark ? 'text-slate-400' : 'text-slate-600'
                                          }`}>
                                            &lt;{senderEmail}&gt;
                                          </span>
                                          {email.payment_amount > 0 && (
                                            <span className={`text-xs font-mono px-2 py-0.5 rounded flex-shrink-0 ${
                                              isDark
                                                ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-800/30'
                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            }`}>
                                              +${email.payment_amount.toFixed(2)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <span className={`text-xs flex-shrink-0 ${
                                        isDark ? 'text-slate-500' : 'text-slate-500'
                                      }`}>
                                        {new Date(email.created_at).toLocaleString('en-US', { 
                                          month: 'short',
                                          day: 'numeric',
                                          hour: 'numeric', 
                                          minute: '2-digit',
                                          hour12: true 
                                        })}
                                      </span>
                                    </div>
                                    
                                    {/* Message Body */}
                                    <div className={`text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere ${
                                      isDark ? 'text-slate-300' : 'text-slate-700'
                                    }`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                      {email.body}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="px-6 py-6">
                  <div className="space-y-6">
                    {selectedThread.messages.map((message, idx) => {
                      // For fallback messages, check if sender matches current user
                      const isFromCurrentUser = currentUser && (
                        message.sender?.toLowerCase().includes(currentUser.username?.toLowerCase()) ||
                        message.sender?.toLowerCase().includes(currentUser.email?.toLowerCase())
                      );
                      
                      // Extract email from sender string if available
                      const senderParts = message.sender?.split('<') || [];
                      const senderName = senderParts[0]?.trim() || message.sender || 'Unknown';
                      const senderEmail = senderParts[1]?.replace('>', '').trim() || message.sender || '';
                      // Get initial from sender name
                      const senderInitial = senderName.charAt(0).toUpperCase();
                      const isFirstEmail = idx === 0;
                      const isReply = idx > 0;
                      
                      return (
                        <div key={message.id} className={`relative ${
                          !isFirstEmail ? 'border-t' : ''
                        } ${
                          isDark ? 'border-slate-800' : 'border-slate-200'
                        }`}>
                            
                            <div className="relative">
                              <div className={isFirstEmail ? 'py-6' : 'py-5'}>
                                <div className="flex items-start gap-4">
                                  {/* Profile Picture */}
                                  <div className="flex-shrink-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      isFromCurrentUser
                                        ? isDark 
                                          ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                                          : 'bg-gradient-to-br from-blue-400 to-blue-500'
                                        : isDark 
                                          ? 'bg-slate-700' 
                                          : 'bg-slate-300'
                                    }`}>
                                      <span className={`text-sm font-semibold ${
                                        isFromCurrentUser 
                                          ? 'text-white' 
                                          : isDark ? 'text-slate-300' : 'text-slate-600'
                                      }`}>
                                        {senderInitial}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Message Content - Gmail Style */}
                                  <div className="flex-1 min-w-0">
                                    {/* Sender Info - Bold and Prominent */}
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className={`text-base font-semibold break-words ${
                                            isDark ? 'text-white' : 'text-slate-900'
                                          }`}>
                                            {senderName}
                                          </span>
                                          {senderEmail && senderEmail !== senderName && (
                                            <span className={`text-xs break-words ${
                                              isDark ? 'text-slate-400' : 'text-slate-600'
                                            }`}>
                                              &lt;{senderEmail}&gt;
                                            </span>
                                          )}
                                          {message.earned > 0 && (
                                            <span className={`text-xs font-mono px-2 py-0.5 rounded flex-shrink-0 ${
                                              isDark
                                                ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-800/30'
                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            }`}>
                                              +${message.earned.toFixed(2)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <span className={`text-xs flex-shrink-0 ${
                                        isDark ? 'text-slate-500' : 'text-slate-500'
                                      }`}>
                                        {message.time}
                                      </span>
                                    </div>
                                    
                                    {/* Message Body */}
                                    <div className={`text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere ${
                                      isDark ? 'text-slate-300' : 'text-slate-700'
                                    }`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                      {message.content}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

                      {/* Reply Box */}
                      {activeView === 'inbox' && (
                        <div className={`px-6 py-5 border-t ${
                isDark ? 'border-slate-800/50' : 'border-slate-200/50'
                        }`}>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className={`w-full p-4 border rounded-lg text-sm resize-none transition-all ${
                      isDark
                                ? 'bg-slate-800/40 border-slate-700/30 text-white placeholder-slate-500 focus:border-blue-500/50'
                                : 'bg-white border-slate-200/50 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                            } focus:outline-none`}
                            rows={4}
                          />
                          
                          {/* Reply Attachments Display */}
                          {replyAttachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {replyAttachments.map((file, idx) => (
                                <div key={idx} className={`flex items-center gap-2 px-2 py-1 text-xs border ${
                                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                                }`}>
                                  <Paperclip size={12} />
                                  <span>{file.filename || file.name || 'Attachment'}</span>
                                  <button
                                    onClick={() => setReplyAttachments(prev => prev.filter((_, i) => i !== idx))}
                                    className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-3 gap-2">
                            <div className="flex items-center gap-2 relative">
                              <button
                                onClick={() => setShowReplyEmojiPicker(!showReplyEmojiPicker)}
                                className={`p-2 rounded-lg border transition-all ${
                                  isDark
                                    ? 'border-slate-700/50 text-slate-400 hover:bg-slate-800/50 hover:border-slate-600'
                                    : 'border-slate-200/50 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                              >
                                <Smile size={14} />
                              </button>
                              
                              <label className={`p-2 rounded-lg border cursor-pointer transition-all ${
                                isDark
                                  ? 'border-slate-700/50 text-slate-400 hover:bg-slate-800/50 hover:border-slate-600'
                                  : 'border-slate-200/50 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                              }`}>
                                <Paperclip size={14} />
                                <input
                                  type="file"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files);
                                    setReplyAttachments(prev => [...prev, ...files]);
                                  }}
                                />
                              </label>
                              
                              {showReplyEmojiPicker && (
                                <EmojiPicker 
                                  onEmojiSelect={(emoji) => {
                                    setReplyText(prev => prev + emoji);
                                    setShowReplyEmojiPicker(false);
                                  }}
                                  isDark={isDark}
                                />
                              )}
                            </div>
                            
                    <button
                      onClick={handleSendReply}
                              disabled={!replyText}
                              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all ${
                                !replyText
                                  ? 'bg-slate-600 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                    >
                              <Send size={14} />
                              Send
                    </button>
                </div>
              </div>
                      )}
            </div>
          </div>
        </div>
      )}
        </>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-3xl border ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
                isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <h3 className={`text-xl font-light ${isDark ? 'text-white' : 'text-slate-900'}`}>
                New Message
              </h3>
              <button
                onClick={() => setShowCompose(false)}
                className={`p-2 transition-all ${
                  isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-xs uppercase tracking-wider mb-2 ${
                  isDark ? 'text-slate-500' : 'text-slate-500'
                }`}>
                  To
                </label>
              <input
                  type="email"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className={`w-full px-4 py-2 border text-sm ${
            isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  } focus:outline-none`}
                />
              </div>

              <div>
                <label className={`block text-xs uppercase tracking-wider mb-2 ${
                  isDark ? 'text-slate-500' : 'text-slate-500'
                }`}>
                  Subject
                </label>
              <input
                type="text"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Email subject"
                  className={`w-full px-4 py-2 border text-sm ${
                  isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  } focus:outline-none`}
                />
              </div>

              <div>
                <label className={`block text-xs uppercase tracking-wider mb-2 ${
                  isDark ? 'text-slate-500' : 'text-slate-500'
                }`}>
                  Message
                </label>
              <textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write your message..."
                  className={`w-full px-4 py-3 border text-sm resize-none ${
                  isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  } focus:outline-none`}
                  rows={12}
                />
              </div>
              
              {/* Compose Attachments Display */}
              {composeAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {composeAttachments.map((file, idx) => (
                    <div key={idx} className={`flex items-center gap-2 px-3 py-2 text-sm border ${
                      isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <Paperclip size={14} />
                      <span>{file.name}</span>
                      <button
                        onClick={() => setComposeAttachments(prev => prev.filter((_, i) => i !== idx))}
                        className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
                    </div>

            {/* Footer */}
            <div className={`flex items-center justify-between p-6 border-t ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-1 relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 border ${
                    isDark
                      ? 'border-slate-700 text-slate-400 hover:bg-slate-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Smile size={18} />
                </button>
                
                <label className={`p-2 border cursor-pointer ${
                  isDark
                    ? 'border-slate-700 text-slate-400 hover:bg-slate-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}>
                  <Paperclip size={18} />
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      setComposeAttachments(prev => [...prev, ...files]);
                    }}
                  />
                </label>
                
                {showEmojiPicker && (
                  <EmojiPicker 
                    onEmojiSelect={(emoji) => {
                      setComposeBody(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    isDark={isDark}
                  />
                )}
              </div>
                <div className="flex items-center gap-3">
                  <button
                  onClick={() => setShowCompose(false)}
                  className={`px-6 py-2 border text-sm font-medium transition-all ${
                      isDark
                      ? 'border-slate-700 text-slate-400 hover:bg-slate-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                  Cancel
                  </button>
                  <button 
                    onClick={handleSendEmail}
                  disabled={isSending || !composeTo || !composeSubject || !composeBody}
                  className={`flex items-center gap-2 px-6 py-2 text-sm font-medium text-white transition-all ${
                    isSending || !composeTo || !composeSubject || !composeBody
                      ? 'bg-slate-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  >
                  <Send size={16} />
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSummaryModal(false)}
          />
          <div className={`relative w-full max-w-2xl max-h-[80vh] overflow-hidden border ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <FileText size={20} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                <h2 className={`text-xl font-semibold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Smart Summary
                </h2>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className={`p-2 transition-colors ${
                  isDark 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className={`p-6 overflow-y-auto max-h-[calc(80vh-140px)] ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {isLoadingSummary ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Generating summary...
                    </p>
                  </div>
                </div>
              ) : summaryError ? (
                <div className={`p-4 border ${
                  isDark 
                    ? 'bg-red-900/20 border-red-800 text-red-300' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <p className="font-medium">Error</p>
                  <p className="text-sm mt-1">{summaryError}</p>
                </div>
              ) : summary ? (
                <div className="prose prose-slate max-w-none">
                  <div className={`whitespace-pre-wrap ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {summary}
                  </div>
                </div>
              ) : (
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  No summary available.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end p-6 border-t ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <button
                onClick={() => setShowSummaryModal(false)}
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMeetingModal(false)}
          />
          <div className={`relative w-full max-w-md overflow-hidden border ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <Calendar size={20} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                <h2 className={`text-xl font-semibold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Schedule Meeting
                </h2>
              </div>
              <button
                onClick={() => setShowMeetingModal(false)}
                className={`p-2 transition-colors ${
                  isDark 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className={`p-6 space-y-4 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {/* Date */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-2 border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-white border-slate-200 text-slate-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  required
                />
              </div>

              {/* Time */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className={`w-full px-4 py-2 border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-white border-slate-200 text-slate-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Duration (minutes)
                </label>
                <select
                  value={meetingDuration}
                  onChange={(e) => setMeetingDuration(parseInt(e.target.value))}
                  className={`w-full px-4 py-2 border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-white border-slate-200 text-slate-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  placeholder="e.g., Conference Room A, Zoom link, etc."
                  className={`w-full px-4 py-2 border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Description (optional)
                </label>
                <textarea
                  value={meetingDescription}
                  onChange={(e) => setMeetingDescription(e.target.value)}
                  placeholder="Add any additional details about the meeting..."
                  rows={3}
                  className={`w-full px-4 py-2 border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end gap-3 p-6 border-t ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <button
                onClick={() => setShowMeetingModal(false)}
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleMeeting}
                disabled={!meetingDate || !meetingTime}
                className={`px-6 py-2 text-sm font-medium text-white transition-colors ${
                  !meetingDate || !meetingTime
                    ? 'bg-slate-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Create Meeting Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}