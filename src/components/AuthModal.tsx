import React, { useState } from 'react';
import { store } from '../services/store';
import { UserRole } from '../types';
import { X, ShieldCheck, User as UserIcon, Mail, Lock, CheckCircle, KeyRound, RefreshCw, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRole?: (role: UserRole) => void;
  initialMode?: 'login' | 'register' | 'reset';
  targetPropertyTitle?: string;
  requiredOwnerId?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccessRole, 
  initialMode = 'register',
  targetPropertyTitle,
  requiredOwnerId
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [role, setRole] = useState<UserRole>('owner');
  const [step, setStep] = useState<'form' | 'otp' | 'reset_step1' | 'reset_step2'>('form');

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');

  // Login / Auth Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Password Reset Fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [sentResetCode, setSentResetCode] = useState('5678');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // OTP Verification for Register
  const [otp, setOtp] = useState('');
  const [sentOtpCode, setSentOtpCode] = useState('1234');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Helper notice if editing specific property
  const targetPropertyOwner = requiredOwnerId ? store.getUsers().find(u => u.id === requiredOwnerId) : null;

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!name || !username || !password || (!email && !googleEmail)) {
      setErrorMessage('Please fill in Name, Username, Password, and Email Address.');
      return;
    }

    // Generate random 4-digit OTP for simulation
    const generated = Math.floor(1000 + Math.random() * 9000).toString();
    setSentOtpCode(generated);
    setStep('otp');
  };

  const handleVerifyOTPAndRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (otp !== sentOtpCode && otp !== '1234') {
      setErrorMessage(`Invalid OTP! Please enter code ${sentOtpCode} (or 1234).`);
      return;
    }

    const effectiveGoogleEmail = googleEmail || email;

    // Register user in store
    const newUser = store.registerUser({
      name,
      username,
      password,
      googleEmail: effectiveGoogleEmail,
      email: email || effectiveGoogleEmail,
      phone,
      whatsapp: whatsapp || phone,
      role,
    });

    if (onSuccessRole) {
      onSuccessRole(role);
    }

    alert(`Account created successfully!\n\nUsername: @${newUser.username}\nRole: ${newUser.role.toUpperCase()}\n\nPlease remember your username and password to edit your listed property in the future.`);
    onClose();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!loginIdentifier || !loginPassword) {
      setErrorMessage('Please enter your Username/Email and Password.');
      return;
    }

    const res = store.loginWithUsernamePassword(loginIdentifier, loginPassword);
    
    if (!res.success) {
      setErrorMessage(res.message || 'Login failed. Invalid username or password.');
      return;
    }

    const loggedInUser = res.user!;

    // If a specific ownerId was required for editing a property, check match
    if (requiredOwnerId && loggedInUser.id !== requiredOwnerId && loggedInUser.role !== 'admin') {
      setErrorMessage(`Permission Denied! You logged in as @${loggedInUser.username}, but this property belongs to @${targetPropertyOwner?.username || targetPropertyOwner?.name || 'another host'}. Please log in with the correct owner credentials.`);
      return;
    }

    if (onSuccessRole) {
      onSuccessRole(loggedInUser.role);
    }

    alert(`Welcome back, ${loggedInUser.name}! (@${loggedInUser.username}) Logged in successfully.`);
    onClose();
  };

  const handleSendResetEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!resetEmail) {
      setErrorMessage('Please enter your registered Google Email address.');
      return;
    }

    const users = store.getUsers();
    const found = users.find(u => 
      (u.googleEmail && u.googleEmail.toLowerCase() === resetEmail.trim().toLowerCase()) ||
      (u.email && u.email.toLowerCase() === resetEmail.trim().toLowerCase())
    );

    if (!found) {
      setErrorMessage(`No account found matching Google Email "${resetEmail}". Please verify your email.`);
      return;
    }

    const generated = Math.floor(1000 + Math.random() * 9000).toString();
    setSentResetCode(generated);
    setNewUsername(found.username || '');
    setStep('reset_step2');
  };

  const handleCompleteReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (resetCode !== sentResetCode && resetCode !== '5678' && resetCode !== '1234') {
      setErrorMessage(`Invalid Verification Code! Use code ${sentResetCode} (or 5678).`);
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setErrorMessage('Please enter a new password (min 4 characters).');
      return;
    }

    const res = store.resetPasswordWithGoogleEmail(resetEmail, newPassword, newUsername);
    if (!res.success) {
      setErrorMessage(res.message || 'Password reset failed.');
      return;
    }

    if (onSuccessRole) {
      onSuccessRole(res.user?.role || 'owner');
    }

    alert(`Password reset successful!\n\nUsername: @${res.user?.username}\nNew Password: ${newPassword}\n\nYou are now logged in as ${res.user?.name}.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
            T
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {mode === 'register' ? 'Create Host / User Account' : mode === 'login' ? 'Host & User Login' : 'Reset Password via Google Email'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {targetPropertyTitle ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                🔒 Required to edit: "{targetPropertyTitle}"
              </span>
            ) : mode === 'register' ? (
              'Set your Username & Password to list and edit your properties'
            ) : mode === 'login' ? (
              'Enter your Username & Password to edit or manage listings'
            ) : (
              'Enter your registered Google Email to recover your password'
            )}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4 text-xs font-bold">
          <button
            onClick={() => { setMode('register'); setStep('form'); setErrorMessage(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'register' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => { setMode('login'); setStep('form'); setErrorMessage(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'login' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('reset'); setStep('reset_step1'); setErrorMessage(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'reset' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Reset Pass
          </button>
        </div>

        {/* Error / Warning Alert */}
        {errorMessage && (
          <div className="mb-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 p-3 rounded-2xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Notice</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Target Property Owner Hint */}
        {targetPropertyOwner && (
          <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Property Owner</p>
              <p className="font-extrabold">{targetPropertyOwner.name}</p>
            </div>
            <span className="bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
              @{targetPropertyOwner.username || 'owner'}
            </span>
          </div>
        )}

        {/* MODE 1: REGISTER */}
        {mode === 'register' && (
          step === 'form' ? (
            <form onSubmit={handleSendOTP} className="space-y-3">
              
              {/* Role selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('owner')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      role === 'owner'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
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
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Traveler / Customer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pranab Gogoi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Username field (Critical) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Create Username (Used to edit property)</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Mandatory</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">@</span>
                  <input
                    type="text"
                    required
                    placeholder="pranab_kaziranga"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Save this username! You must log in with it to edit your property later.
                </p>
              </div>

              {/* Password field (Critical) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Create Password
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

              {/* Google Email field (For Password Reset) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Google Email Address</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">For Password Recovery</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="pranab@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  If you ever forget your username or password, you will reset it using this Google email.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9435012345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
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

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer mt-2"
              >
                Continue & Verify Mobile OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTPAndRegister} className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center">
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                  OTP sent to mobile <span className="font-bold">{phone}</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Verification Code: <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">{sentOtpCode}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Enter 4-Digit Mobile OTP
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
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md cursor-pointer"
                >
                  Verify & Create Account
                </button>
              </div>
            </form>
          )
        )}

        {/* MODE 2: LOGIN WITH USERNAME & PASSWORD */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Username or Google Email / Mobile
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. pranab123 or pranab@gmail.com"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('reset'); setStep('reset_step1'); setErrorMessage(''); }}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Log In as Property Host
              </button>
            </div>

            {/* Google Email Password Reset Quick Banner */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Forgot your username or password?
              </p>
              <button
                type="button"
                onClick={() => { setMode('reset'); setStep('reset_step1'); setErrorMessage(''); }}
                className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-extrabold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Reset credentials using Google Email
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: FORGOT PASSWORD / RESET VIA GOOGLE EMAIL */}
        {mode === 'reset' && (
          step === 'reset_step1' ? (
            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/50 p-3 rounded-2xl border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-900 dark:text-amber-200 font-bold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                  Google Email Account Recovery
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                  Agar aap username ya password bhul gaye ho, toh aapne property list karte waqt joh Google Email diya tha, use yahan daalein.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Enter Registered Google Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. pranab@gmail.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md cursor-pointer"
                >
                  Verify Google Email
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCompleteReset} className="space-y-3">
              <div className="bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                  Google Email Verified! ({resetEmail})
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Verification Code sent to Google Email: <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">{sentResetCode}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Enter 4-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="e.g. 5678"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-center text-base tracking-widest font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Your Username (Update if needed)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">@</span>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Set New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('reset_step1')}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md cursor-pointer"
                >
                  Reset & Log In
                </button>
              </div>
            </form>
          )
        )}

      </div>
    </div>
  );
};
