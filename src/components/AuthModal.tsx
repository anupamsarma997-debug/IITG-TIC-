import React, { useState } from 'react';
import { store } from '../services/store';
import { UserRole } from '../types';
import { X, ShieldCheck, Smartphone, KeyRound, User as UserIcon, Mail, Lock, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRole?: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccessRole }) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [role, setRole] = useState<UserRole>('owner');
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [sentOtpCode, setSentOtpCode] = useState('1234');

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email) {
      alert('Please complete all required fields.');
      return;
    }

    // Generate random 4-digit OTP for simulation
    const generated = Math.floor(1000 + Math.random() * 9000).toString();
    setSentOtpCode(generated);
    setStep('otp');
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== sentOtpCode && otp !== '1234') {
      alert(`Invalid OTP! Please enter code ${sentOtpCode} (or 1234).`);
      return;
    }

    // Register user in store
    const newUser = store.registerUser({
      name,
      email,
      phone,
      whatsapp: whatsapp || phone,
      role,
    });

    if (onSuccessRole) {
      onSuccessRole(role);
    }

    alert(`Welcome to THIKANA, ${newUser.name}! Your ${role} account is now active.`);
    onClose();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = store.getUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase() || u.phone === phone);

    if (found) {
      store.setCurrentUserId(found.id);
      if (onSuccessRole) onSuccessRole(found.role);
      alert(`Logged in successfully as ${found.name} (${found.role}).`);
      onClose();
    } else {
      // Demo login shortcut
      const demoUser = store.registerUser({
        name: email.split('@')[0] || 'Demo User',
        email,
        phone: phone || '+919876543210',
        whatsapp: phone || '919876543210',
        role,
      });
      if (onSuccessRole) onSuccessRole(role);
      alert(`Welcome ${demoUser.name}! Account ready.`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-black text-2xl flex items-center justify-center mx-auto mb-2">
            T
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {mode === 'register' ? 'Create THIKANA Account' : 'Welcome Back'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'register' ? 'Register your Homestay / Hotel or Customer profile' : 'Sign in to manage your listings'}
          </p>
        </div>

        {/* Register / Login Mode Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-5">
          <button
            onClick={() => { setMode('register'); setStep('form'); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'register' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => { setMode('login'); setStep('form'); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'
            }`}
          >
            Sign In
          </button>
        </div>

        {mode === 'register' ? (
          step === 'form' ? (
            <form onSubmit={handleSendOTP} className="space-y-3">
              
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  I want to join as:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('owner')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      role === 'owner'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Homestay / Hotel Owner
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      role === 'customer'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Traveler / Customer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9816012345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Same as mobile"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer mt-2"
              >
                Send OTP Verification
              </button>

            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center">
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                  OTP sent to mobile <span className="font-bold">{phone}</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Simulated OTP Code: <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">{sentOtpCode}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Enter 4-Digit OTP
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="e.g. 1234"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-center text-lg tracking-widest font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md"
                >
                  Verify & Register
                </button>
              </div>
            </form>
          )
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email or Mobile Number
              </label>
              <input
                type="text"
                required
                placeholder="bikram@himalayanhaven.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer mt-2"
            >
              Sign In
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
