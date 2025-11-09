import React from 'react';
import { Mail, Wallet, Bell, Sun, Moon, User, LogOut } from 'lucide-react';

const Navbar = ({ 
  isDark, 
  setIsDark, 
  walletBalance, 
  notifications, 
  unreadNotificationCount, 
  showNotifications, 
  setShowNotifications,
  isLoadingNotifications,
  markNotificationAsRead,
  navigate 
}) => {
  return (
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
  );
};

export default Navbar;

