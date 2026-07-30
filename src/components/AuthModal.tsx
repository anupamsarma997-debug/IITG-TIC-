import React, { useState } from 'react';
import { store } from '../services/store';
import { UserRole, User } from '../types';
import { X, ShieldCheck, User as UserIcon, Lock, CheckCircle, KeyRound, RefreshCw, AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRole?: (role: UserRole) => void;
  initialMode?: 'login' | 'register' | 'reset';
  targetPropertyTitle?: string;
  requiredOwnerId?: string;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3h3.88c2.28-2.1 3.665-5.2 3.665-9.12z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.09c.95-2.85 3.6-4.96 6.72-4.96z" />
  </svg>
);

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
  const [step, setStep] = useState<'form' | 'google_verify' | 'reset_step1' | 'reset_step2'>('form');

  // Registration Form Fields (Step 1)
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Login Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Reset Password Fields
  const [verifiedResetUser, setVerifiedResetUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // UI States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Helper notice if editing specific property
  const targetPropertyOwner = requiredOwnerId ? store.getUsers().find(u => u.id === requiredOwnerId) : null;

  // 1-Click Instant Google Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const gUser = res.user;
      if (!gUser.email) {
        setErrorMessage('Google account did not provide an email address.');
        setIsLoading(false);
        return;
      }

      const loggedInUser = store.loginOrRegisterWithGoogle({
        email: gUser.email,
        displayName: gUser.displayName,
        photoURL: gUser.photoURL,
        uid: gUser.uid,
        desiredRole: role,
      });

      if (requiredOwnerId && loggedInUser.id !== requiredOwnerId && loggedInUser.role !== 'admin') {
        setErrorMessage(`Permission Denied! You signed in as @${loggedInUser.username} (${loggedInUser.email}), but this property belongs to @${targetPropertyOwner?.username || targetPropertyOwner?.name || 'another host'}.`);
        setIsLoading(false);
        return;
      }

      if (onSuccessRole) {
        onSuccessRole(loggedInUser.role);
      }

      alert(`🎉 Signed in successfully with Google!\n\nName: ${loggedInUser.name}\nEmail: ${loggedInUser.email}\nUsername: @${loggedInUser.username}`);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setErrorMessage(err?.message || 'Google Sign-In failed or popup was closed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1 Registration Form Submit -> Validate & Move to Google Verification
  const handleRegisterStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your Full Name.');
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      setErrorMessage('Username must be at least 3 characters long.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setStep('google_verify');
    setSuccessMessage('Profile information saved! Now verify your identity with Google to activate your account.');
  };

  // Step 2 Registration Google Verification -> Verify & Create Account
  const handleRegisterGoogleVerify = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      const gUser = res.user;

      if (!gUser.email) {
        setErrorMessage('Google account did not provide a verified email address.');
        setIsLoading(false);
        return;
      }

      // Create account with verified Google Email and Google UID
      const newUser = store.registerUser({
        name: name.trim(),
        username: username.trim().toLowerCase().replace(/\s+/g, '_'),
        password,
        googleEmail: gUser.email,
        googleUid: gUser.uid,
        email: gUser.email,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        role,
      });

      if (onSuccessRole) {
        onSuccessRole(newUser.role);
      }

      alert(`🎉 Account created and verified with Google!\n\nName: ${newUser.name}\nUsername: @${newUser.username}\nVerified Email: ${newUser.email}\nRole: ${newUser.role.toUpperCase()}\n\nYou can now log in anytime with your username (@${newUser.username}) and password, or via Google.`);
      onClose();
    } catch (err: any) {
      console.error('Google Verification for registration failed:', err);
      setErrorMessage(err?.message || 'Google Sign-In failed or was cancelled. Please try again to activate your account.');
    } finally {
      setIsLoading(false);
    }
  };

  // Username & Password Login Handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!loginIdentifier || !loginPassword) {
      setErrorMessage('Please enter your Username or Email and Password.');
      return;
    }

    const res = store.loginWithUsernamePassword(loginIdentifier, loginPassword);
    
    if (!res.success) {
      setErrorMessage(res.message || 'Login failed. Invalid username or password.');
      return;
    }

    const loggedInUser = res.user!;

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

  // Password Reset Step 1: Verify Identity via Google Sign-In
  const handleResetGoogleVerify = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      const gUser = res.user;

      if (!gUser.email) {
        setErrorMessage('Google account did not provide an email address.');
        setIsLoading(false);
        return;
      }

      // 1. Look up user by Google UID
      let matchedUser = store.findUserByGoogleUid(gUser.uid);

      // 2. Fallback: match by googleEmail or email for legacy accounts
      if (!matchedUser) {
        const allUsers = store.getUsers();
        matchedUser = allUsers.find(
          (u) =>
            (u.googleEmail && u.googleEmail.toLowerCase() === gUser.email!.toLowerCase()) ||
            (u.email && u.email.toLowerCase() === gUser.email!.toLowerCase())
        );
      }

      if (!matchedUser) {
        setErrorMessage(`No account found linked to this Google account (${gUser.email}). Please register first.`);
        setIsLoading(false);
        return;
      }

      setVerifiedResetUser(matchedUser);
      setNewUsername(matchedUser.username || '');
      setStep('reset_step2');
      setSuccessMessage(`Google account verified for ${gUser.email}! You can now update your password.`);
    } catch (err: any) {
      console.error('Google verification for password reset error:', err);
      setErrorMessage(err?.message || 'Google verification failed or was cancelled. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Reset Step 2: Set New Password
  const handleCompleteReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!verifiedResetUser) {
      setErrorMessage('Session expired. Please verify with Google again.');
      setStep('reset_step1');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Please enter a new password (min 6 characters).');
      return;
    }

    const res = store.resetPasswordAfterGoogleVerification(verifiedResetUser.id, newPassword, newUsername);
    if (!res.success) {
      setErrorMessage(res.message || 'Password reset failed.');
      return;
    }

    if (onSuccessRole) {
      onSuccessRole(res.user?.role || 'owner');
    }

    alert(`🎉 Password reset successful!\n\nUsername: @${res.user?.username}\nYou are now logged in as ${res.user?.name}.`);
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
            {mode === 'register' 
              ? (step === 'google_verify' ? 'Verify Google Identity' : 'Create Host / User Account')
              : mode === 'login' 
              ? 'Host & User Login' 
              : 'Reset Password via Google'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {targetPropertyTitle ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                🔒 Required to edit: "{targetPropertyTitle}"
              </span>
            ) : mode === 'register' ? (
              step === 'google_verify'
                ? 'Almost done! Verify with Google to activate your account'
                : 'Step 1 of 2: Set your Username & Password details'
            ) : mode === 'login' ? (
              'Enter your Username & Password to manage listings'
            ) : (
              step === 'reset_step1'
                ? 'Verify identity with Google Sign-In to reset password'
                : 'Step 2 of 2: Set your new password'
            )}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4 text-xs font-bold">
          <button
            onClick={() => { setMode('register'); setStep('form'); setErrorMessage(''); setSuccessMessage(''); }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'register' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => { setMode('login'); setStep('form'); setErrorMessage(''); setSuccessMessage(''); }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'login' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('reset'); setStep('reset_step1'); setErrorMessage(''); setSuccessMessage(''); setVerifiedResetUser(null); }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'reset' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Reset Pass
          </button>
        </div>

        {/* Error / Alert Messages */}
        {errorMessage && (
          <div className="mb-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 p-3 rounded-2xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Notice</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && !errorMessage && (
          <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 p-3 rounded-2xl text-xs flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Information</p>
              <p>{successMessage}</p>
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

        {/* 1-Click Instant Google Sign-In (For direct Login/Register) */}
        {mode !== 'reset' && step === 'form' && (
          <div className="mb-4">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-800 dark:text-white font-extrabold text-xs py-3 px-4 rounded-2xl shadow-sm hover:shadow transition-all cursor-pointer group disabled:opacity-50"
            >
              <GoogleIcon />
              <span>Continue with Google Account</span>
            </button>
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
              <span className="relative bg-white dark:bg-slate-900 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Or with Username & Password
              </span>
            </div>
          </div>
        )}

        {/* MODE 1: REGISTER */}
        {mode === 'register' && (
          step === 'form' ? (
            <form onSubmit={handleRegisterStep1} className="space-y-3">
              {/* Role selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('owner')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      role === 'customer'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Traveler / Customer
                  </button>
                </div>
              </div>

              {/* Full Name */}
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

              {/* Username field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Create Username</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Min 3 chars</span>
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
                  Used to log in and manage your property listings.
                </p>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Create Password</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Min 6 chars</span>
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

              {/* Optional Contact Phone & WhatsApp */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number <span className="font-normal text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 9435012345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp <span className="font-normal text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="For WhatsApp booking"
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
                Continue to Google Verification →
              </button>
            </form>
          ) : (
            /* STEP 2: Google Sign-In Verification for Registration */
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/60 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-extrabold text-emerald-950 dark:text-emerald-200">
                  Almost Done — Verify with Google
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Verify your identity with Google to activate your account. Your verified Google email will be securely attached to your account for recovery and verification badges.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Name:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Username:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">@{username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Role:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{role}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleRegisterGoogleVerify}
                  className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 group"
                >
                  <GoogleIcon />
                  <span>Verify & Activate Account with Google</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setStep('form')}
                  className="w-full flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Edit Details</span>
                </button>
              </div>
            </div>
          )
        )}

        {/* MODE 2: LOGIN WITH USERNAME & PASSWORD */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Username or Email / Mobile
              </label>
              <input
                type="text"
                required
                placeholder="e.g. pranab_kaziranga or pranab@gmail.com"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('reset'); setStep('reset_step1'); setErrorMessage(''); setSuccessMessage(''); setVerifiedResetUser(null); }}
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

            {/* Quick Reset Password Link */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Forgot your credentials?
              </p>
              <button
                type="button"
                onClick={() => { setMode('reset'); setStep('reset_step1'); setErrorMessage(''); setSuccessMessage(''); setVerifiedResetUser(null); }}
                className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-extrabold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Reset password via Google Sign-In verification
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: PASSWORD RESET VIA GOOGLE VERIFICATION */}
        {mode === 'reset' && (
          step === 'reset_step1' ? (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/50 p-4 rounded-2xl border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-900 dark:text-amber-200 font-bold flex items-center gap-1.5 mb-1">
                  <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                  Google Identity Password Reset
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  Verify your identity using Google Sign-In to reset your password. Google sign-in itself serves as single-step verification.
                </p>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleResetGoogleVerify}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border-2 border-emerald-500 text-slate-800 dark:text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-md hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer disabled:opacity-50 group"
              >
                <GoogleIcon />
                <span>Verify with Google to Reset Password</span>
              </button>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setStep('form'); setErrorMessage(''); setSuccessMessage(''); }}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            </div>
          ) : (
            /* RESET STEP 2: Set New Password for verified account */
            <form onSubmit={handleCompleteReset} className="space-y-3">
              {verifiedResetUser && (
                <div className="bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">Identity Verified</p>
                    <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">{verifiedResetUser.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{verifiedResetUser.email || verifiedResetUser.googleEmail}</p>
                  </div>
                  <span className="bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-mono text-[10px] px-2 py-1 rounded-lg font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
                    Verified
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Your Username (Confirm or Update)
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
                  placeholder="Enter new password (min 6 chars)"
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
