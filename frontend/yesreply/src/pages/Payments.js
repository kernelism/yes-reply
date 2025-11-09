import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Plus
} from 'lucide-react';

// Use the same API URL as Dashboard for consistency
const API_BASE_URL = process.env.REACT_APP_BACKEND_API_PATH || process.env.REACT_APP_API_URL || 'http://localhost:8000';

// StatCard Component (matching Analytics style)
const StatCard = ({ icon: Icon, label, value, prefix = '', suffix = '', isDark, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`p-6 border cursor-pointer transition-all hover:scale-[1.02] ${
        isDark 
          ? 'bg-slate-800 border-slate-700 hover:border-slate-600' 
          : 'bg-white border-slate-300 hover:border-slate-400'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
          <Icon size={20} className={isDark ? 'text-slate-400' : 'text-slate-600'} />
        </div>
      </div>
      
      <div>
        <p className={`text-xs uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          {label}
        </p>
        <p className={`text-2xl font-light ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {prefix}{value.toFixed(2)}{suffix}
        </p>
      </div>
    </div>
  );
};

// Payment Form Component using Stripe Elements
const PaymentForm = ({ clientSecret, paymentIntentId, amount, onSuccess, onCancel, getAuthToken, isDark }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError('');

    const cardElement = elements.getElement(CardElement);

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        const confirmResponse = await fetch(`${API_BASE_URL}/api/payments/confirm-payment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ payment_intent_id: paymentIntentId })
        });

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json();
          throw new Error(errorData.detail || 'Failed to confirm payment');
        }

        // Success!
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Payment failed');
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: isDark ? '#e2e8f0' : '#1e293b',
        '::placeholder': {
          color: isDark ? '#64748b' : '#94a3b8',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Card Details
        </label>
        <div className={`p-4 border rounded-lg ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-white'}`}>
          <CardElement options={cardElementOptions} />
        </div>
        {error && (
          <div className={`mt-2 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</div>
        )}
        <p className={`mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          Test card: 4242 4242 4242 4242 | Any future date | Any 3-digit CVC
        </p>
      </div>

      <div className={`border rounded-lg p-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Total Amount:</span>
          <span className={`text-lg font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>${amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className={`flex-1 px-4 py-3 border rounded-lg font-medium transition disabled:opacity-50 ${
            isDark 
              ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
              : 'border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
        >
          {processing ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </button>
      </div>
    </form>
  );
};

const Payments = ({ isDark = false }) => {
  console.log('[PAYMENTS] Component rendering/mounting...');
  console.log('[PAYMENTS] API_BASE_URL:', API_BASE_URL);
  
  const [activeTab, setActiveTab] = useState('wallet');
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [cashouts, setCashouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add credits states
  const [addCreditsAmount, setAddCreditsAmount] = useState('');
  const [addCreditsLoading, setAddCreditsLoading] = useState(false);
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentIntentData, setPaymentIntentData] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  
  // Cashout states
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [cashoutName, setCashoutName] = useState('');
  const [cashoutRouting, setCashoutRouting] = useState('');
  const [cashoutAccount, setCashoutAccount] = useState('');
  const [cashoutLoading, setCashoutLoading] = useState(false);
  const [showCashoutModal, setShowCashoutModal] = useState(false);

  useEffect(() => {
    console.log('[PAYMENTS] useEffect triggered - fetching data...');
    fetchWalletData();
    fetchTransactions();
    fetchPayments();
    fetchCashouts();
  }, []);

  const getAuthToken = () => {
    // Use the same token key as Dashboard
    const token = localStorage.getItem('access_token');
    console.log('[PAYMENTS] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null');
    return token;
  };

  const fetchWalletData = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('[PAYMENTS] No token found in localStorage');
        setError('Not authenticated. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('[PAYMENTS] Fetching wallet data from:', `${API_BASE_URL}/api/payments/wallet`);
      const response = await fetch(`${API_BASE_URL}/api/payments/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[PAYMENTS] Wallet response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[PAYMENTS] Wallet fetch error:', errorText);
        throw new Error(`Failed to fetch wallet data: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[PAYMENTS] Wallet data received:', data);
      setWalletData(data);
    } catch (err) {
      console.error('[PAYMENTS] Wallet fetch exception:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/api/payments/transactions?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        console.error('[PAYMENTS] Transactions fetch failed:', response.status);
        return;
      }
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      console.error('[PAYMENTS] Error fetching transactions:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/api/payments/payment-history?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        console.error('[PAYMENTS] Payments fetch failed:', response.status);
        return;
      }
      const data = await response.json();
      setPayments(data);
    } catch (err) {
      console.error('[PAYMENTS] Error fetching payments:', err);
    }
  };

  const fetchCashouts = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/api/payments/cashouts?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        console.error('[PAYMENTS] Cashouts fetch failed:', response.status);
        return;
      }
      const data = await response.json();
      setCashouts(data);
    } catch (err) {
      console.error('[PAYMENTS] Error fetching cashouts:', err);
    }
  };

  const handleAddCredits = async () => {
    const amount = parseFloat(addCreditsAmount);
    if (!amount || amount < 1) {
      setError('Minimum amount is $1');
      return;
    }

    setAddCreditsLoading(true);
    setError('');

    try {
      // Create payment intent
      const intentResponse = await fetch(`${API_BASE_URL}/api/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount })
      });

      if (!intentResponse.ok) {
        const errorData = await intentResponse.json();
        throw new Error(errorData.detail || 'Failed to create payment');
      }

      const { client_secret, publishable_key, payment_intent_id } = await intentResponse.json();

      // Initialize Stripe
      const stripe = await loadStripe(publishable_key);
      setStripePromise(stripe);

      // Store payment intent data
      setPaymentIntentData({
        clientSecret: client_secret,
        paymentIntentId: payment_intent_id,
        amount: amount
      });

      // Show payment form
      setShowPaymentForm(true);
      setAddCreditsLoading(false);
    } catch (err) {
      setError(err.message);
      setAddCreditsLoading(false);
    }
  };

  const handleCashout = async () => {
    const amount = parseFloat(cashoutAmount);
    if (!amount || amount < 10) {
      setError('Minimum cashout amount is $10');
      return;
    }

    if (!cashoutName || !cashoutRouting || !cashoutAccount) {
      setError('Please fill in all bank account details');
      return;
    }

    if (!/^\d{9}$/.test(cashoutRouting)) {
      setError('Routing number must be 9 digits');
      return;
    }

    if (walletData && amount > walletData.balance) {
      setError('Insufficient balance');
      return;
    }

    setCashoutLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/cashout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          bank_account_holder_name: cashoutName,
          bank_routing_number: cashoutRouting,
          bank_account_number: cashoutAccount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to request cashout');
      }

      alert('Cashout request submitted successfully! It will be processed within 3-5 business days.');
      setShowCashoutModal(false);
      setCashoutAmount('');
      setCashoutName('');
      setCashoutRouting('');
      setCashoutAccount('');
      fetchWalletData();
      fetchCashouts();
    } catch (err) {
      setError(err.message);
    } finally {
      setCashoutLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTransactionType = (type) => {
    const typeMap = {
      'credit_purchase': 'Credit Purchase',
      'email_received': 'Email Received',
      'email_responded': 'Email Response',
      'email_sent_deduction': 'Email Sent',
      'cashout': 'Cashout',
      'refund': 'Refund'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex items-center justify-center h-64">
            <div className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-light tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Payments & Wallet
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Manage your credits, earnings, and cashouts
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddCreditsModal(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Plus size={16} />
              Add Credits
            </button>
            {walletData && walletData.balance >= 10 && (
              <button
                onClick={() => setShowCashoutModal(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isDark
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Cash Out
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className={`mb-6 border rounded-lg px-4 py-3 ${
            isDark 
              ? 'bg-red-900/20 border-red-800 text-red-400' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {error}
          </div>
        )}

        {/* Wallet Overview Cards */}
        {walletData && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Wallet}
              label="Balance"
              value={walletData.balance}
              prefix="$"
              isDark={isDark}
              onClick={() => setShowAddCreditsModal(true)}
            />
            
            <StatCard
              icon={TrendingUp}
              label="Total Earned"
              value={walletData.total_earned}
              prefix="$"
              isDark={isDark}
            />
            
            <StatCard
              icon={TrendingDown}
              label="Total Spent"
              value={walletData.total_spent}
              prefix="$"
              isDark={isDark}
            />
            
            <StatCard
              icon={DollarSign}
              label="Cashed Out"
              value={walletData.total_cashed_out}
              prefix="$"
              isDark={isDark}
            />
          </div>
        )}

        {/* Tab Selector */}
        <div className={`flex items-center gap-1 p-1 rounded-lg border mb-6 ${
          isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
        }`}>
          {[
            { id: 'wallet', label: 'Transactions' },
            { id: 'payments', label: 'Credit Purchases' },
            { id: 'cashouts', label: 'Cashouts' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-1.5 rounded text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? isDark
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-900'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-300'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transactions Tab */}
        {activeTab === 'wallet' && (
          <div className={`p-6 border mb-6 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="mb-6">
              <h3 className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Recent Transactions
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                All your wallet transactions
              </p>
            </div>
            <div className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {transactions.length === 0 ? (
                <div className={`py-12 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  No transactions yet
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className={`py-4 transition ${
                    isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {transaction.amount > 0 ? (
                          <ArrowDownRight className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {formatTransactionType(transaction.type)}
                          </div>
                          <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {formatDate(transaction.created_at)}
                          </div>
                          {transaction.description && (
                            <div className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {transaction.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          transaction.amount > 0 
                            ? 'text-emerald-500' 
                            : 'text-red-500'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                        </div>
                        {transaction.balance_after !== null && (
                          <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Balance: {formatCurrency(transaction.balance_after)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className={`p-6 border mb-6 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="mb-6">
              <h3 className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Credit Purchase History
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                All credit card purchases
              </p>
            </div>
            <div className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {payments.length === 0 ? (
                <div className={`py-12 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  No credit purchases yet
                </div>
              ) : (
                payments.map((payment) => (
                  <div key={payment.id} className={`py-4 transition ${
                    isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <CreditCard className="w-5 h-5 text-blue-500" />
                        <div>
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Credit Card Payment
                          </div>
                          <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {formatDate(payment.created_at)}
                          </div>
                          {payment.card_brand && payment.card_last4 && (
                            <div className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {payment.card_brand} •••• {payment.card_last4}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-xs mt-1 text-emerald-500">
                          +{formatCurrency(payment.credits_added)} credits
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Cashouts Tab */}
        {activeTab === 'cashouts' && (
          <div className={`p-6 border mb-6 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="mb-6">
              <h3 className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Cashout History
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Withdrawal requests and history
              </p>
            </div>
            <div className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {cashouts.length === 0 ? (
                <div className={`py-12 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  No cashouts yet
                </div>
              ) : (
                cashouts.map((cashout) => (
                  <div key={cashout.id} className={`py-4 transition ${
                    isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <DollarSign className="w-5 h-5 text-orange-500" />
                        <div>
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Bank Transfer
                          </div>
                          <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {formatDate(cashout.created_at)}
                          </div>
                          <div className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {cashout.bank_account_holder_name}
                            {cashout.bank_account_last4 && ` •••• ${cashout.bank_account_last4}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {formatCurrency(cashout.amount)}
                        </div>
                        <div className={`text-xs mt-1 capitalize ${
                          cashout.status === 'completed' ? 'text-emerald-500' :
                          cashout.status === 'pending' || cashout.status === 'processing' ? 'text-yellow-500' :
                          'text-red-500'
                        }`}>
                          {cashout.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Add Credits Modal */}
        {(showAddCreditsModal || showPaymentForm) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'
            }`}>
              {!showPaymentForm ? (
                <>
                  <h2 className={`text-2xl font-light mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Add Credits</h2>
                  <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Enter the amount you want to add to your wallet.
                  </p>
                  <div className="mb-6">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Amount (USD)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className={`h-5 w-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                      </div>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={addCreditsAmount}
                        onChange={(e) => setAddCreditsAmount(e.target.value)}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 text-white' 
                            : 'border-slate-300'
                        }`}
                        placeholder="10.00"
                      />
                    </div>
                    <p className={`mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                      Minimum: $1.00
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowAddCreditsModal(false);
                        setError('');
                      }}
                      disabled={addCreditsLoading}
                      className={`flex-1 px-4 py-3 border rounded-lg font-medium transition disabled:opacity-50 ${
                        isDark
                          ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCredits}
                      disabled={addCreditsLoading}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {addCreditsLoading ? 'Processing...' : 'Continue'}
                    </button>
                  </div>
                </>
              ) : paymentIntentData && stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret: paymentIntentData.clientSecret }}>
                  <div>
                    <h2 className={`text-2xl font-light mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Complete Payment</h2>
                    <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Enter your card details to add ${paymentIntentData.amount.toFixed(2)} to your wallet.
                    </p>
                    <PaymentForm
                      clientSecret={paymentIntentData.clientSecret}
                      paymentIntentId={paymentIntentData.paymentIntentId}
                      amount={paymentIntentData.amount}
                      getAuthToken={getAuthToken}
                      isDark={isDark}
                      onSuccess={() => {
                        setShowPaymentForm(false);
                        setShowAddCreditsModal(false);
                        setPaymentIntentData(null);
                        setAddCreditsAmount('');
                        setError('');
                        fetchWalletData();
                        fetchTransactions();
                        fetchPayments();
                        alert('Payment successful! Credits have been added to your wallet.');
                      }}
                      onCancel={() => {
                        setShowPaymentForm(false);
                        setPaymentIntentData(null);
                        setAddCreditsAmount('');
                      }}
                    />
                  </div>
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <Loader className={`w-8 h-8 mx-auto mb-4 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Loading payment form...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cashout Modal */}
        {showCashoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'
            }`}>
              <h2 className={`text-2xl font-light mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Request Cashout</h2>
              <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Enter your bank account details to receive your earnings. Minimum cashout is $10.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className={`h-5 w-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                    </div>
                    <input
                      type="number"
                      min="10"
                      step="0.01"
                      value={cashoutAmount}
                      onChange={(e) => setCashoutAmount(e.target.value)}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'border-slate-300'
                      }`}
                      placeholder="10.00"
                    />
                  </div>
                  <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    Available: {walletData ? formatCurrency(walletData.balance) : '$0.00'}
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={cashoutName}
                    onChange={(e) => setCashoutName(e.target.value)}
                    className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'border-slate-300'
                    }`}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Routing Number
                  </label>
                  <input
                    type="text"
                    value={cashoutRouting}
                    onChange={(e) => setCashoutRouting(e.target.value)}
                    maxLength="9"
                    className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'border-slate-300'
                    }`}
                    placeholder="110000000"
                  />
                  <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>9 digits</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={cashoutAccount}
                    onChange={(e) => setCashoutAccount(e.target.value)}
                    className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'border-slate-300'
                    }`}
                    placeholder="000123456789"
                  />
                </div>
              </div>

              <div className={`border rounded-lg p-4 mb-6 ${
                isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <p className={`text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-800'}`}>
                  <strong>Note:</strong> Cashouts typically take 3-5 business days to process.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCashoutModal(false);
                    setError('');
                  }}
                  disabled={cashoutLoading}
                  className={`flex-1 px-4 py-3 border rounded-lg font-medium transition disabled:opacity-50 ${
                    isDark
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCashout}
                  disabled={cashoutLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {cashoutLoading ? 'Processing...' : 'Request Cashout'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
