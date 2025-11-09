import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';
import { Mail, Sun, Moon, CheckCircle2, Shield, Zap, Send, Inbox, Trophy, ArrowRight, TrendingUp, Users, Clock, DollarSign, Star, Globe, Lock, BarChart3 } from 'lucide-react';

export default function YesReplyCaptivating() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [visibleSections, setVisibleSections] = useState(new Set());
  const sectionRefs = useRef({});

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

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observers = [];
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -100px 0px'
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        const sectionId = entry.target.dataset.section;
        if (sectionId) {
          if (entry.isIntersecting) {
            // Add section when it comes into view
            setVisibleSections(prev => new Set([...prev, sectionId]));
          } else {
            // Remove section when it goes out of view so it can re-animate
            setVisibleSections(prev => {
              const newSet = new Set(prev);
              newSet.delete(sectionId);
              return newSet;
            });
          }
        }
      });
    };

    // Small delay to ensure refs are set
    const timeoutId = setTimeout(() => {
      Object.values(sectionRefs.current).forEach(ref => {
        if (ref) {
          const observer = new IntersectionObserver(observerCallback, observerOptions);
          observer.observe(ref);
          observers.push(observer);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observers.forEach(observer => observer.disconnect());
    };
  }, []);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
      
      {/* Top Stats Bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between text-sm uppercase tracking-wider">
            <div className="flex items-center gap-10">
              <div className={`flex items-center gap-2 transition-all duration-500 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <TrendingUp size={16} className={isDark ? 'text-slate-500' : 'text-slate-600'} />
                <span className="font-mono">${liveStats.earnings.toLocaleString()}</span>
                <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>paid</span>
              </div>
              <div className={`flex items-center gap-2 transition-all duration-500 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Users size={16} className={isDark ? 'text-slate-500' : 'text-slate-600'} />
                <span className="font-mono">{liveStats.users.toLocaleString()}</span>
                <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>users</span>
              </div>
              <div className={`flex items-center gap-2 transition-all duration-500 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Clock size={16} className={isDark ? 'text-slate-500' : 'text-slate-600'} />
                <span className="font-mono">{liveStats.responses}hrs</span>
                <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>avg</span>
              </div>
            </div>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 transition-all duration-300 hover:scale-110 ${
                isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
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
          <div className="flex items-center justify-between mb-24 pt-8 animate-fade-in">
            <div className={`flex items-center gap-3 text-xl font-medium transition-all duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <div className={`p-2 transition-all duration-300 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <Mail size={20} />
              </div>
              yesreply
            </div>
            <button 
              onClick={() => setShowAuthModal(true)}
              className={`px-6 py-2 border font-medium text-sm transition-all duration-300 hover:scale-105 ${
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
            <div className="space-y-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className={`inline-block px-4 py-2 border text-sm uppercase tracking-wider transition-all duration-300 ${
                isDark ? 'border-slate-700 text-slate-400 bg-slate-800/50' : 'border-slate-300 text-slate-600 bg-slate-50'
              }`}>
                inbox-as-a-marketplace
              </div>
              <h1 className={`text-6xl lg:text-7xl font-light leading-[1.15] tracking-tight transition-all duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Your Attention<br />
                Has Value
              </h1>
              <div className={`text-lg leading-relaxed space-y-3 transition-all duration-300 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <p>Set your rate. Share your link. Get paid to read emails.</p>
                <p className={`font-medium text-xl transition-all duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  $2-$5 per email. 48-hour reply guarantee.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 pt-6">
                <button 
                  onClick={() => navigate('/signup')} 
                  className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all duration-300 hover:scale-105 ${
                    isDark
                      ? 'bg-slate-700 text-white hover:bg-slate-600'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Start Earning Now
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </button>
                <button className={`px-6 py-3 border font-medium text-sm transition-all duration-300 hover:scale-105 ${
                  isDark 
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}>
                  Watch Demo
                </button>
              </div>
            </div>

            {/* Hero Visual - Email Card with Typing Animation */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className={`border p-8 transition-all duration-500 hover:shadow-lg ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
              }`}>
                <div className="space-y-8">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                        isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                      }`}>
                        SC
                      </div>
                      <div>
                        <div className={`font-medium text-sm transition-all duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Sarah Chen
                        </div>
                        <div className={`text-xs transition-all duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Product Manager @ Stripe
                        </div>
                      </div>
                    </div>
                    <div className={`px-4 py-2 text-sm font-mono transition-all duration-300 ${
                      isDark ? 'bg-slate-700 text-slate-300 border border-slate-600' : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}>
                      $10/email
                    </div>
                  </div>
                  <div className={`p-6 border transition-all duration-300 ${
                    isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'
                  }`}>
                    <div className={`text-xs uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      New Message
                    </div>
                    <div className={`text-sm leading-relaxed min-h-[60px] transition-all duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      "{typedText}<span className="animate-pulse">|</span>"
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm transition-all duration-300 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      Received 2 minutes ago
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 px-3 py-2 transition-all duration-300 ${
                        isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <DollarSign size={14} />
                        <span className="text-sm font-mono">+$0.20</span>
                      </div>
                      <button className={`px-5 py-2 text-sm font-medium transition-all duration-300 hover:scale-105 ${
                        isDark
                          ? 'bg-slate-700 text-white hover:bg-slate-600'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
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
          <div 
            ref={el => sectionRefs.current['value-props'] = el}
            data-section="value-props"
            className={`grid md:grid-cols-2 gap-8 mb-40 transition-all duration-1000 ease-out ${
              visibleSections.has('value-props') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            {/* Get Paid */}
            <div className={`p-10 border transition-all duration-300 hover:scale-[1.02] ${
              isDark
                ? 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}>
              <h3 className={`text-2xl font-light mb-10 transition-all duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Get Paid
              </h3>
              <div className="space-y-8">
                {paidItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-5 transition-all duration-300 hover:translate-x-1">
                    <div className={`p-3 transition-all duration-300 ${isDark ? 'bg-slate-700 border border-slate-600' : 'bg-slate-100 border border-slate-300'}`}>
                      <item.icon size={20} className={isDark ? 'text-slate-400' : 'text-slate-600'} />
                    </div>
                    <div>
                      <div className={`font-medium mb-2 text-base transition-all duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.title}
                      </div>
                      <div className={`text-sm transition-all duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Get Replies */}
            <div className={`p-10 border transition-all duration-300 hover:scale-[1.02] ${
              isDark
                ? 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}>
              <h3 className={`text-2xl font-light mb-10 transition-all duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Get Replies
              </h3>
              <div className="space-y-8">
                {replyItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-5 transition-all duration-300 hover:translate-x-1">
                    <div className={`p-3 transition-all duration-300 ${isDark ? 'bg-slate-700 border border-slate-600' : 'bg-slate-100 border border-slate-300'}`}>
                      <item.icon size={22} className={isDark ? 'text-slate-400' : 'text-slate-600'} />
                    </div>
                    <div>
                      <div className={`font-medium mb-2 text-lg transition-all duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.title}
                      </div>
                      <div className={`text-base transition-all duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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
      <div 
        ref={el => sectionRefs.current['how-it-works'] = el}
        data-section="how-it-works"
        className={`py-24 border-t transition-all duration-300 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
      >
        <div className="max-w-6xl mx-auto px-8">
          <div className={`mb-20 transition-all duration-1000 ease-out ${
            visibleSections.has('how-it-works') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}>
              <h2 className={`text-4xl font-light mb-3 transition-all duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              How It Works
            </h2>
            <p className={`text-base transition-all duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              From signup to earnings in 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-4 gap-8">
            {[
              { 
                num: '01', 
                title: 'Create Account', 
                desc: 'Sign up in 30 seconds. Get your custom yesreply.tech link.',
              },
              { 
                num: '02', 
                title: 'Set Your Rate', 
                desc: 'Choose $2-$5 per email based on your expertise level.',
              },
              { 
                num: '03', 
                title: 'Share Your Link', 
                desc: 'Add to bio, email signature or LinkedIn to unlock higher rates.',
              },
              { 
                num: '04', 
                title: 'Get Paid', 
                desc: 'Reply within 48hrs, earn full amount. Auto-refund if you don\'t.',
              }
            ].map((step, i) => {
              return (
                <div 
                  key={i} 
                  className={`border p-8 transition-all duration-700 ease-out hover:scale-[1.02] hover:border-slate-600 ${
                    visibleSections.has('how-it-works') 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-12'
                  } ${
                    isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-white'
                  }`}
                  style={{ transitionDelay: `${i * 120}ms` }}
                >
                  <div className={`text-5xl font-light mb-8 font-mono transition-all duration-300 ${
                    isDark ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    {step.num}
                  </div>
                  <h3 className={`font-medium mb-3 text-lg transition-all duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {step.title}
                  </h3>
                  <p className={`text-base leading-relaxed transition-all duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div 
        ref={el => sectionRefs.current['features'] = el}
        data-section="features"
        className={`py-24 border-t transition-all duration-300 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
      >
        <div className="max-w-7xl mx-auto px-8">
          <div className={`mb-20 transition-all duration-1000 ease-out ${
            visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}>
            <h2 className={`text-4xl font-light mb-3 transition-all duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
              },
              {
                icon: Zap,
                title: 'Instant Payouts',
                desc: '$0.20 on delivery, full payment on reply. No waiting, no minimums.',
                stat: '$287K paid out',
              },
              {
                icon: Lock,
                title: 'You Control Access',
                desc: 'Set rates, block senders, pause anytime. Your inbox, your rules.',
                stat: '100% control',
              },
              {
                icon: TrendingUp,
                title: 'Build Credibility',
                desc: 'High reply rate = priority placement. Reputation system rewards reliability.',
                stat: '96.8% platform score',
              },
              {
                icon: Globe,
                title: 'Global Network',
                desc: 'Connect with decision-makers worldwide. VCs, founders, experts all in one place.',
                stat: '12,500+ users',
              },
              {
                icon: BarChart3,
                title: 'Analytics Dashboard',
                desc: 'Track earnings, response times, sender quality. Data-driven inbox management.',
                stat: 'Real-time insights',
              }
            ].map((feature, i) => {
              return (
                <div 
                  key={i} 
                  className={`border p-8 transition-all duration-700 ease-out hover:scale-[1.02] hover:border-slate-600 ${
                    visibleSections.has('features')
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-12'
                  } ${
                    isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-white'
                  }`}
                  style={{ transitionDelay: `${i * 120}ms` }}
                >
                  <div className={`p-3 inline-flex mb-6 transition-all duration-300 ${
                    isDark ? 'bg-slate-700 border border-slate-600' : 'bg-slate-100 border border-slate-300'
                  }`}>
                    <feature.icon className={isDark ? 'text-slate-400' : 'text-slate-600'} size={24} />
                  </div>
                  <h3 className={`font-medium mb-3 text-lg transition-all duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {feature.title}
                  </h3>
                  <p className={`text-base leading-relaxed mb-4 transition-all duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {feature.desc}
                  </p>
                  <div className={`text-sm font-mono transition-all duration-300 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {feature.stat}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Social Proof - Testimonials */}
      <div 
        ref={el => sectionRefs.current['testimonials'] = el}
        data-section="testimonials"
        className={`py-24 border-t transition-all duration-300 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
      >
        <div className="max-w-7xl mx-auto px-8">
          <div className={`mb-20 transition-all duration-1000 ease-out ${
            visibleSections.has('testimonials') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}>
            <h2 className={`text-4xl font-light mb-3 transition-all duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              What Users Are Saying
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah K.',
                role: 'Product Manager',
                initials: 'SK',
                quote: 'Made $40 in 2 days just answering emails I was going to answer anyway. This is genius.',
                earnings: '+$329',
                rating: 5
              },
              {
                name: 'Mike T.',
                role: 'Startup Founder',
                initials: 'MT',
                quote: 'Cold-emailed a VC for $10. He responded in 3 hours. Best $10 I ever spent.',
                replies: '89% rate',
                rating: 4
              },
              {
                name: 'Alex R.',
                role: 'Engineering Lead',
                initials: 'AR',
                quote: 'Finally a way to monetize my expertise without Calendly scheduling hell.',
                earnings: '+$1.2K',
                rating: 4
              }
            ].map((testimonial, i) => (
              <div 
                key={i} 
                className={`border p-8 transition-all duration-700 ease-out hover:scale-[1.02] hover:border-slate-600 ${
                  visibleSections.has('testimonials')
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-12'
                } ${
                  isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-white'
                }`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                    isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <div className={`font-medium text-base transition-all duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {testimonial.name}
                    </div>
                    <div className={`text-sm transition-all duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {testimonial.role}
                    </div>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[1,2,3,4,5].map(j => (
                    <Star
                      key={j}
                      size={16}
                      className={`transition-all duration-300 ${
                        j <= testimonial.rating
                          ? 'fill-amber-500 text-amber-500'
                          : isDark ? 'fill-slate-800 text-slate-800' : 'fill-slate-200 text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-base leading-relaxed mb-5 transition-all duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  "{testimonial.quote}"
                </p>
                <div className={`text-sm font-mono transition-all duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {testimonial.earnings || testimonial.replies}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div 
        ref={el => sectionRefs.current['cta'] = el}
        data-section="cta"
        className={`py-24 border-t transition-all duration-300 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
      >
        <div className="max-w-4xl mx-auto px-8">
          <div className={`border p-16 text-center transition-all duration-1000 ease-out hover:scale-[1.01] ${
            visibleSections.has('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          } ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
          }`}>
            <h2 className={`text-5xl font-light mb-6 transition-all duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Start Earning Today
            </h2>
            <p className={`text-xl mb-10 transition-all duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Join 12,500+ professionals monetizing their inbox. Set your rate in 60 seconds.
            </p>
            <button 
              onClick={() => setShowAuthModal(true)} 
              className={`px-10 py-4 border font-medium text-base transition-all duration-300 hover:scale-105 ${
                isDark
                  ? 'bg-slate-700 text-white border-slate-700 hover:bg-slate-600'
                  : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
              }`}
            >
              Create Free Account
            </button>
            <div className="flex items-center justify-center gap-10 mt-10 text-base">
              <div className={`flex items-center gap-2 transition-all duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <CheckCircle2 size={18} />
                <span>No credit card required</span>
              </div>
              <div className={`flex items-center gap-2 transition-all duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <CheckCircle2 size={18} />
                <span>Setup in 60 seconds</span>
              </div>
              <div className={`flex items-center gap-2 transition-all duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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
              ©️ 2025 YesReply. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className={`flex items-center gap-2 transition-all duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse transition-all duration-300 ${isDark ? 'bg-slate-500' : 'bg-slate-400'}`} />
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
