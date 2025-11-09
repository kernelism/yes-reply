import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';
import { Mail, Sun, Moon, CheckCircle2, Shield, Zap, Send, Inbox, Trophy, ArrowRight, TrendingUp, Users, Clock, DollarSign, Star, Globe, Lock, BarChart3 } from 'lucide-react';

export default function YesReplyCaptivating() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [typedText, setTypedText] = useState('');

  const paidItems = [
    {
      icon: Shield,
      title: "Money-Back Guarantee",
      desc: "No reply in 48hrs? Automatic refund minus delivery fee",
    },
    {
      icon: TrendingUp,
      title: "89% Success Rate",
      desc: "Industry-leading response rate from top professionals",
    },
  ];

  const replyItems = [
    {
      icon: CheckCircle2,
      title: "Guaranteed Replies",
      desc: "Receive replies from top professionals within 48 hours",
    },
    {
      icon: Trophy,
      title: "Build Credibility",
      desc: "Earn credibility points for priority emails",
    },
  ];

  const [liveStats, setLiveStats] = useState({
    earnings: 287420,
    users: 12547,
    responses: 8.5
  });

  // Typing animation for Sarah Chen email
  useEffect(() => {
    const fullText = "Hi Sarah! Love your work on payment flows. Quick question about handling...";
    let currentIndex = 0;
    
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        earnings: prev.earnings + Math.floor(Math.random() * 50),
        users: prev.users + (Math.random() > 0.7 ? 1 : 0),
        responses: prev.responses
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
      
      {/* Top Stats Bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 border-b ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between text-sm uppercase tracking-wider">
            <div className="flex items-center gap-10">
              <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <TrendingUp size={16} className="text-emerald-500" />
                <span className="font-mono">${liveStats.earnings.toLocaleString()}</span>
                <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>paid</span>
              </div>
              <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Users size={16} className="text-blue-500" />
                <span className="font-mono">{liveStats.users.toLocaleString()}</span>
                <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>users</span>
              </div>
              <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Clock size={16} className="text-purple-500" />
                <span className="font-mono">{liveStats.responses}hrs</span>
                <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>avg</span>
              </div>
            </div>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        isDark={isDark}
        userType="receiver"
      />

      {/* Hero Section */}
      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-8">
          {/* Logo & Header */}
          <div className="flex items-center justify-between mb-24 pt-8">
            <div className={`flex items-center gap-3 text-xl font-medium ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <div className={`p-2 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <Mail size={20} />
              </div>
              yesreply
            </div>
            <button 
              onClick={() => setShowAuthModal(true)}
              className={`px-6 py-2 border font-medium text-sm transition-all ${
                isDark
                  ? 'bg-white text-slate-900 border-white hover:bg-slate-100'
                  : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
              }`}
            >
              Sign In
            </button>
          </div>

          {/* Main Hero */}
          <div className="grid lg:grid-cols-2 gap-24 items-start mb-40">
            <div className="space-y-10">
              <div className={`inline-block px-4 py-2 border text-sm uppercase tracking-wider ${
                isDark ? 'border-blue-800 text-blue-400 bg-blue-950/30' : 'border-blue-300 text-blue-700 bg-blue-50'
              }`}>
                inbox-as-a-marketplace
              </div>

              <h1 className={`text-6xl lg:text-7xl font-light leading-[1.15] tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Your Attention<br />
                Has Value
              </h1>

              <div className={`text-lg leading-relaxed space-y-3 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <p>Set your rate. Share your link. Get paid to read emails.</p>
                <p className={`font-medium text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  $2-$5 per email. 48-hour reply guarantee.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 pt-6">
                <button 
                  onClick={() => navigate('/signup')} 
                  className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all ${
                    isDark
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Start Earning Now
                  <ArrowRight size={16} />
                </button>
                <button className={`px-6 py-3 border font-medium text-sm transition-all ${
                  isDark 
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}>
                  Watch Demo
                </button>
              </div>
            </div>

            {/* Hero Visual - Email Card with Typing Animation */}
            <div>
              <div className={`border p-8 ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
              }`}>
                <div className="space-y-8">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold">
                        SC
                      </div>
                      <div>
                        <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Sarah Chen
                        </div>
                        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Product Manager @ Stripe
                        </div>
                      </div>
                    </div>
                    <div className={`px-4 py-2 text-sm font-mono ${
                      isDark ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      $10/email
                    </div>
                  </div>

                  <div className={`p-6 border ${
                    isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'
                  }`}>
                    <div className={`text-xs uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      New Message
                    </div>
                    <div className={`text-sm leading-relaxed min-h-[60px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      "{typedText}<span className="animate-pulse">|</span>"
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      Received 2 minutes ago
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 px-3 py-2 ${
                        isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <DollarSign size={14} />
                        <span className="text-sm font-mono">+$0.20</span>
                      </div>
                      <button className={`px-5 py-2 text-sm font-medium ${
                        isDark
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}>
                        Reply & Earn $9.80
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Value Props Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-40">
            {/* Get Paid */}
            <div className={`p-10 border transition-all ${
              isDark
                ? 'border-slate-800 bg-slate-800/50 hover:border-blue-800'
                : 'border-slate-200 bg-white hover:border-blue-300'
            }`}>
              <h3 className={`text-2xl font-light mb-10 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Get Paid
              </h3>

              <div className="space-y-8">
                {paidItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-5">
                    <div className={`p-3 ${isDark ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                      <item.icon size={20} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                    </div>
                    <div>
                      <div className={`font-medium mb-2 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.title}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Get Replies */}
            <div className={`p-10 border transition-all ${
              isDark
                ? 'border-slate-800 bg-slate-800/50 hover:border-emerald-800'
                : 'border-slate-200 bg-white hover:border-emerald-300'
            }`}>
              <h3 className={`text-2xl font-light mb-10 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Get Replies
              </h3>

              <div className="space-y-8">
                {replyItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-5">
                    <div className={`p-3 ${isDark ? 'bg-emerald-900/30 border border-emerald-800' : 'bg-emerald-50 border border-emerald-200'}`}>
                      <item.icon size={22} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                    </div>
                    <div>
                      <div className={`font-medium mb-2 text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.title}
                      </div>
                      <div className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className={`py-24 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-8">
          <div className="mb-20">
              <h2 className={`text-4xl font-light mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              How It Works
            </h2>
            <p className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              From signup to earnings in 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-4 gap-8">
            {[
              { 
                num: '01', 
                title: 'Create Account', 
                desc: 'Sign up in 30 seconds. Get your custom yesreply.tech link.',
                color: 'blue'
              },
              { 
                num: '02', 
                title: 'Set Your Rate', 
                desc: 'Choose $2-$5 per email based on your expertise level.',
                color: 'purple'
              },
              { 
                num: '03', 
                title: 'Share Your Link', 
                desc: 'Add to bio, email signature or LinkedIn to unlock higher rates.',
                color: 'emerald'
              },
              { 
                num: '04', 
                title: 'Get Paid', 
                desc: 'Reply within 48hrs, earn full amount. Auto-refund if you don\'t.',
                color: 'amber'
              }
            ].map((step, i) => {
              const getStepColorClasses = (color) => {
                const colorMap = {
                  blue: 'hover:border-blue-600',
                  purple: 'hover:border-purple-600',
                  emerald: 'hover:border-emerald-600',
                  amber: 'hover:border-amber-600'
                };
                return colorMap[color];
              };
              
              const hoverClass = getStepColorClasses(step.color);
              
              return (
                <div key={i} className={`border p-8 group ${hoverClass} transition-all ${
                  isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-white'
                }`}>
                  <div className={`text-5xl font-light mb-8 font-mono ${
                    isDark ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    {step.num}
                  </div>
                  <h3 className={`font-medium mb-3 text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {step.title}
                  </h3>
                  <p className={`text-base leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className={`py-24 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-20">
            <h2 className={`text-4xl font-light mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Why Professionals Love yesreply
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: '48-Hour Guarantee',
                desc: 'Reply within 48 hours or sender gets automatic refund. Your reputation matters.',
                stat: '89% reply rate',
                color: 'blue'
              },
              {
                icon: Zap,
                title: 'Instant Payouts',
                desc: '$0.20 on delivery, full payment on reply. No waiting, no minimums.',
                stat: '$287K paid out',
                color: 'purple'
              },
              {
                icon: Lock,
                title: 'You Control Access',
                desc: 'Set rates, block senders, pause anytime. Your inbox, your rules.',
                stat: '100% control',
                color: 'emerald'
              },
              {
                icon: TrendingUp,
                title: 'Build Credibility',
                desc: 'High reply rate = priority placement. Reputation system rewards reliability.',
                stat: '96.8% platform score',
                color: 'blue'
              },
              {
                icon: Globe,
                title: 'Global Network',
                desc: 'Connect with decision-makers worldwide. VCs, founders, experts all in one place.',
                stat: '12,500+ users',
                color: 'purple'
              },
              {
                icon: BarChart3,
                title: 'Analytics Dashboard',
                desc: 'Track earnings, response times, sender quality. Data-driven inbox management.',
                stat: 'Real-time insights',
                color: 'emerald'
              }
            ].map((feature, i) => {
              const getColorClasses = (color) => {
                const colorMap = {
                  blue: {
                    iconDark: 'text-blue-400',
                    iconLight: 'text-blue-600',
                    bgDark: 'bg-blue-900/30 border border-blue-800',
                    bgLight: 'bg-blue-50 border border-blue-200',
                    hover: 'hover:border-blue-600'
                  },
                  purple: {
                    iconDark: 'text-purple-400',
                    iconLight: 'text-purple-600',
                    bgDark: 'bg-purple-900/30 border border-purple-800',
                    bgLight: 'bg-purple-50 border border-purple-200',
                    hover: 'hover:border-purple-600'
                  },
                  emerald: {
                    iconDark: 'text-emerald-400',
                    iconLight: 'text-emerald-600',
                    bgDark: 'bg-emerald-900/30 border border-emerald-800',
                    bgLight: 'bg-emerald-50 border border-emerald-200',
                    hover: 'hover:border-emerald-600'
                  }
                };
                return colorMap[color];
              };
              
              const colors = getColorClasses(feature.color);
              
              return (
                <div key={i} className={`border p-8 transition-all ${colors.hover} ${
                  isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-white'
                }`}>
                  <div className={`p-3 inline-flex mb-6 ${
                    isDark ? colors.bgDark : colors.bgLight
                  }`}>
                    <feature.icon className={isDark ? colors.iconDark : colors.iconLight} size={24} />
                  </div>
                  <h3 className={`font-medium mb-3 text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {feature.title}
                  </h3>
                  <p className={`text-base leading-relaxed mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {feature.desc}
                  </p>
                  <div className={`text-sm font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {feature.stat}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Social Proof - Testimonials */}
      <div className={`py-24 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-20">
            <h2 className={`text-4xl font-light mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              What Users Are Saying
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah K.',
                role: 'Product Manager',
                initials: 'SK',
                avatarColor: 'from-purple-500 to-pink-500',
                quote: 'Made $40 in 2 days just answering emails I was going to answer anyway. This is genius.',
                earnings: '+$329',
                rating: 5
              },
              {
                name: 'Mike T.',
                role: 'Startup Founder',
                initials: 'MT',
                avatarColor: 'from-blue-500 to-cyan-500',
                quote: 'Cold-emailed a VC for $10. He responded in 3 hours. Best $10 I ever spent.',
                replies: '89% rate',
                rating: 4
              },
              {
                name: 'Alex R.',
                role: 'Engineering Lead',
                initials: 'AR',
                avatarColor: 'from-emerald-500 to-teal-500',
                quote: 'Finally a way to monetize my expertise without Calendly scheduling hell.',
                earnings: '+$1.2K',
                rating: 4
              }
            ].map((testimonial, i) => (
              <div key={i} className={`border p-8 ${
                isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-white'
              }`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 bg-gradient-to-br ${testimonial.avatarColor} flex items-center justify-center text-white text-lg font-bold`}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <div className={`font-medium text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {testimonial.name}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {testimonial.role}
                    </div>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[1,2,3,4,5].map(j => (
                    <Star
                      key={j}
                      size={16}
                      className={
                        j <= testimonial.rating
                          ? 'fill-amber-400 text-amber-400'
                          : isDark ? 'fill-slate-800 text-slate-800' : 'fill-slate-200 text-slate-200'
                      }
                    />
                  ))}
                </div>
                <p className={`text-base leading-relaxed mb-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  "{testimonial.quote}"
                </p>
                <div className={`text-sm font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {testimonial.earnings || testimonial.replies}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className={`py-24 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="max-w-4xl mx-auto px-8">
          <div className={`border p-16 text-center ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
          }`}>
            <h2 className={`text-5xl font-light mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Start Earning Today
            </h2>
            <p className={`text-xl mb-10 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Join 12,500+ professionals monetizing their inbox. Set your rate in 60 seconds.
            </p>
            <button 
              onClick={() => setShowAuthModal(true)} 
              className={`px-10 py-4 border font-medium text-base ${
                isDark
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
              }`}
            >
              Create Free Account
            </button>
            <div className="flex items-center justify-center gap-10 mt-10 text-base">
              <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <CheckCircle2 size={18} />
                <span>No credit card required</span>
              </div>
              <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <CheckCircle2 size={18} />
                <span>Setup in 60 seconds</span>
              </div>
              <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <CheckCircle2 size={18} />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`border-t ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <div className={`flex items-center gap-3 text-xl font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <div className={`p-2 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <Mail size={18} />
                </div>
                yesreply
              </div>
              <p className={`text-base leading-relaxed mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                The attention marketplace. Get paid to read emails, or pay for guaranteed responses.
              </p>
              <div className="flex gap-3">
                {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
                  <button key={social} className={`w-10 h-10 border flex items-center justify-center transition-all ${
                    isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}>
                    <Globe size={16} />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h3 className={`font-medium mb-4 text-sm uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Product
              </h3>
              <ul className="space-y-3 text-base">
                {['How It Works', 'Pricing', 'Features', 'API Docs', 'Integrations'].map((link) => (
                  <li key={link}>
                    <a href="#" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className={`font-medium mb-4 text-sm uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Company
              </h3>
              <ul className="space-y-3 text-base">
                {['About Us', 'Careers', 'Press Kit', 'Blog', 'Contact'].map((link) => (
                  <li key={link}>
                    <a href="#" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className={`font-medium mb-4 text-sm uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Legal
              </h3>
              <ul className="space-y-3 text-base">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security', 'GDPR'].map((link) => (
                  <li key={link}>
                    <a href="#" className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className={`pt-8 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} flex flex-wrap items-center justify-between gap-4`}>
            <div className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
              © 2025 YesReply. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span>All systems operational</span>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className={`mt-8 flex flex-wrap items-center justify-center gap-8 text-sm ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            {['Stripe Verified', 'SOC 2 Compliant', 'GDPR Ready', '256-bit SSL'].map((badge) => (
              <div key={badge} className="flex items-center gap-2">
                <Shield size={14} />
                <span>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
