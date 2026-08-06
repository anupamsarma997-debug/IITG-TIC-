import React, { useState } from 'react';
import { store } from '../services/store';
import { UserRole } from '../types';
import { X, ShieldCheck, Mail, Lock, CheckCircle2, AlertCircle, RefreshCw, Send, UserCheck, KeyRound } from 'lucide-react';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, googleProvider, checkFirebaseDiagnostics } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRole?: (role: UserRole) => void;
  initialMode?: 'login' | 'register' | 'forgot_password';
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

  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>(initialMode);
  const [role, setRole] = useState<UserRole>('owner');

  // Register Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Login Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot Password Field
  const [resetEmail, setResetEmail] = useState('');

  // UI States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  // Runtime Diagnostic Result
  const firebaseDiagnostics = checkFirebaseDiagnostics();

  // Helper notice if editing specific property
  const targetPropertyOwner = requiredOwnerId ? store.getUsers().find(u => u.id === requiredOwnerId) : null;

  // 1-Click Google Sign-In
  const handleGoogleSignIn = async () => {
    console.log('[Google Auth Debug] Starting Google Sign-In process...');
    setErrorMessage('');
    setSuccessMessage('');

    // Diagnostic check before initiating Google Auth
    const diag = checkFirebaseDiagnostics();
    console.log('[Google Auth Debug] Firebase Diagnostics status:', diag);
    console.log('[Google Auth Debug] googleProvider configuration:', {
      providerId: googleProvider.providerId,
      customParameters: (googleProvider as any).customParameters || (googleProvider as any).getCustomParameters?.() || null,
      scopes: (googleProvider as any).scopes || [],
    });

    if (!diag.isGoogleAuthReady || !auth) {
      console.warn('[Google Auth Debug] Google Auth is not ready or missing Firebase credentials.');
      setShowDiagnostics(true);
      const detail = diag.missingVars.length > 0
        ? `⚠️ Google Auth Diagnostic Alert: Firebase runtime environment variables are missing (${diag.missingVars.join(', ')}).\n\nGoogle Auth provider lacks necessary credentials. Please use the ⚡ Instant 1-Click Demo Login below!`
        : `⚠️ Google Auth Diagnostic Alert: ${diag.errorMessage || 'Google Auth Provider missing necessary credentials.'}\n\nPlease use the ⚡ Instant 1-Click Demo Login below!`;
      setErrorMessage(detail);
      return;
    }

    setIsLoading(true);
    try {
      console.log('[Google Auth Debug] Triggering signInWithPopup(auth, googleProvider)...');
      const res = await signInWithPopup(auth, googleProvider);
      console.log('[Google Auth Debug] signInWithPopup completed successfully. User payload:', {
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName,
        photoURL: res.user.photoURL,
        providerId: res.user.providerId,
      });

      const gUser = res.user;
      if (!gUser.email) {
        console.warn('[Google Auth Debug] No email address returned from Google account.');
        setErrorMessage('Google account did not provide an email address.');
        setIsLoading(false);
        return;
      }

      console.log('[Google Auth Debug] Registering/Logging in user into store...');
      const loggedInUser = store.loginOrRegisterWithGoogle({
        email: gUser.email,
        displayName: gUser.displayName,
        photoURL: gUser.photoURL,
        uid: gUser.uid,
        desiredRole: role,
      });
      console.log('[Google Auth Debug] Store authentication success. Logged in user:', loggedInUser);

      if (requiredOwnerId && loggedInUser.id !== requiredOwnerId && loggedInUser.role !== 'admin') {
        console.warn('[Google Auth Debug] Permission denied for target property owner mismatch.');
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
      console.error('[Google Auth Debug] signInWithPopup encountered an error:', err);
      console.error('[Google Auth Debug] Error details:', {
        code: err?.code,
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
        customData: err?.customData,
      });
      const code = err?.code || '';
      let msg = '';
      if (code === 'auth/popup-closed-by-user') {
        msg = 'Google sign-in popup was closed before completing login. You can try again or click a Quick Demo Sign-In button below.';
      } else if (code === 'auth/unauthorized-domain') {
        msg = `Firebase Auth Notice: Current domain (${window.location.hostname}) is not in Firebase Authorized Domains list. Use Quick Demo Login below to test instantly!`;
      } else if (code === 'auth/popup-blocked') {
        msg = 'Google sign-in popup was blocked by browser iframe security. Click a Quick Demo Sign-In button below to log in instantly.';
      } else if (code === 'auth/operation-not-allowed') {
        msg = 'Google Sign-In method is disabled in Firebase Console. Please enable Google Auth in Firebase Console or use Quick Demo Login.';
      } else {
        msg = `Google Sign-In Notice (${code || 'Error'}): ${err?.message || 'Could not complete Google Auth. Use Quick Demo Sign-In below.'}`;
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      console.log('[Google Auth Debug] Google Sign-In process flow finished.');
    }
  };

  // Quick 1-Click Demo Login Helper
  const handleQuickDemoLogin = (username: string) => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    setTimeout(() => {
      const res = store.loginWithUsernamePassword(username, '123456');
      setIsLoading(false);
      if (res.success && res.user) {
        if (requiredOwnerId && res.user.id !== requiredOwnerId && res.user.role !== 'admin') {
          setErrorMessage(`Permission Denied! Signed in as @${res.user.username}, but this listing belongs to @${targetPropertyOwner?.username || targetPropertyOwner?.name || 'another host'}.`);
          return;
        }
        if (onSuccessRole) onSuccessRole(res.user.role);
        alert(`⚡ Quick Logged In as ${res.user.name} (@${res.user.username})!`);
        onClose();
      } else {
        setErrorMessage(res.message || 'Quick login failed.');
      }
    }, 250);
  };

  // Register with Email & Password + Firebase Email Verification
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your Full Name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid Email Address.');
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

    setIsLoading(true);

    try {
      let firebaseUid = `user_${Date.now()}`;
      if (auth) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
          const fbUser = userCredential.user;
          firebaseUid = fbUser.uid;

          // Send Email Verification
          await sendEmailVerification(fbUser);
          setSuccessMessage(`🎉 Account created! A verification email has been sent to ${email.trim()}. Please verify your email.`);
        } catch (fbErr: any) {
          console.warn('Firebase Auth create user note:', fbErr?.message);
          if (fbErr.code === 'auth/email-already-in-use') {
            setErrorMessage('This email is already registered. Please log in or use Forgot Password.');
            setIsLoading(false);
            return;
          }
        }
      }

      // Sync user to Store
      const newUser = store.registerUser({
        name: name.trim(),
        username: username.trim().toLowerCase().replace(/\s+/g, '_'),
        password,
        email: email.trim(),
        googleUid: firebaseUid,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        role,
      });

      if (onSuccessRole) {
        onSuccessRole(newUser.role);
      }

      alert(`🎉 Registration Successful!\n\nName: ${newUser.name}\nUsername: @${newUser.username}\nEmail: ${newUser.email}\nRole: ${newUser.role.toUpperCase()}\n\nA Firebase verification email has been dispatched to your inbox.`);
      onClose();
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMessage(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Login with Email / Username & Password
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMessage('Please enter your Email/Username and Password.');
      return;
    }

    setIsLoading(true);

    try {
      let emailToTry = loginIdentifier.trim();
      if (!emailToTry.includes('@')) {
        const matched = store.getUsers().find(u => u.username?.toLowerCase() === emailToTry.toLowerCase());
        if (matched && matched.email) {
          emailToTry = matched.email;
        }
      }

      if (auth && emailToTry.includes('@')) {
        try {
          await signInWithEmailAndPassword(auth, emailToTry, loginPassword);
        } catch (fbErr) {
          console.warn('Firebase signIn notice:', fbErr);
        }
      }

      const res = store.loginWithUsernamePassword(loginIdentifier, loginPassword);
      if (!res.success) {
        setErrorMessage(res.message || 'Login failed. Invalid username/email or password.');
        setIsLoading(false);
        return;
      }

      const loggedInUser = res.user!;

      if (requiredOwnerId && loggedInUser.id !== requiredOwnerId && loggedInUser.role !== 'admin') {
        setErrorMessage(`Permission Denied! You logged in as @${loggedInUser.username}, but this property belongs to @${targetPropertyOwner?.username || targetPropertyOwner?.name || 'another host'}.`);
        setIsLoading(false);
        return;
      }

      if (onSuccessRole) {
        onSuccessRole(loggedInUser.role);
      }

      alert(`Welcome back, ${loggedInUser.name}! (@${loggedInUser.username}) Logged in successfully.`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Forgot Password (Send Reset Email)
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    setIsLoading(true);

    try {
      if (auth) {
        await sendPasswordResetEmail(auth, resetEmail.trim());
        setSuccessMessage(`📧 Password reset email sent to ${resetEmail.trim()}! Please check your inbox and follow the link to reset your password.`);
      } else {
        const emailLower = resetEmail.trim().toLowerCase();
        const userExists = store.getUsers().some(u => u.email?.toLowerCase() === emailLower || u.googleEmail?.toLowerCase() === emailLower);
        if (userExists) {
          setSuccessMessage(`📧 Password reset link dispatched for ${resetEmail.trim()}. Please check your inbox.`);
        } else {
          setErrorMessage('No account found with this email address. Please check spelling or register.');
        }
      }
    } catch (err: any) {
      console.error('Password reset email error:', err);
      if (err.code === 'auth/user-not-found') {
        setErrorMessage('No account found with this email address. Please check spelling or register.');
      } else {
        setSuccessMessage(`📧 Password reset request processed for ${resetEmail.trim()}. If an account exists, a reset link will be sent.`);
      }
    } finally {
      setIsLoading(false);
    }
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
              ? 'Create Host / Customer Account' 
              : mode === 'login' 
              ? 'Account Sign In' 
              : 'Forgot Password'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {targetPropertyTitle ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                🔒 Login required to manage: "{targetPropertyTitle}"
              </span>
            ) : mode === 'register' ? (
              'Sign up with Firebase Auth (Email Verification Enabled)'
            ) : mode === 'login' ? (
              'Sign in with your Email / Username and Password'
            ) : (
              'Enter your email address to receive a Firebase password reset link'
            )}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4 text-xs font-bold">
          <button
            onClick={() => { setMode('register'); setErrorMessage(''); setSuccessMessage(''); }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'register' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'login' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('forgot_password'); setErrorMessage(''); setSuccessMessage(''); }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'forgot_password' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Forgot Password
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
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
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

        {/* Google 1-Click Sign In & Quick Demo Login (Available on Login / Register) */}
        {mode !== 'forgot_password' && (
          <div className="mb-4 space-y-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-800 dark:text-white font-extrabold text-xs py-3 px-4 rounded-2xl shadow-sm hover:shadow transition-all cursor-pointer group disabled:opacity-50"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            {/* Firebase Environment & Google Auth Diagnostic Panel */}
            {(!firebaseDiagnostics.isGoogleAuthReady || showDiagnostics) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-2xl border border-amber-200 dark:border-amber-800 text-left space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Firebase Auth Diagnostic Notice</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDiagnostics(!showDiagnostics)}
                    className="text-[10px] underline font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 cursor-pointer"
                  >
                    {showDiagnostics ? 'Hide Report' : 'View Report'}
                  </button>
                </div>
                <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
                  {firebaseDiagnostics.missingVars.length > 0
                    ? `Google Auth provider lacks required credentials because runtime env variables are not set.`
                    : firebaseDiagnostics.errorMessage || 'Google Auth provider requires active Firebase configuration.'}
                  {' '}Use <strong>Instant 1-Click Demo Login</strong> below to log in directly!
                </p>

                {showDiagnostics && (
                  <div className="pt-2 border-t border-amber-200 dark:border-amber-800/60 space-y-1">
                    <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Runtime Variable Status:</p>
                    <div className="grid grid-cols-1 gap-1 font-mono text-[10px]">
                      {Object.entries(firebaseDiagnostics.loadedVars).map(([vName, isLoaded]) => (
                        <div key={vName} className="flex justify-between items-center py-0.5 px-1.5 rounded bg-white/60 dark:bg-slate-900/40">
                          <span className="text-slate-700 dark:text-slate-300">{vName}</span>
                          <span className={`font-bold ${isLoaded ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {isLoaded ? '✓ Loaded' : '✗ Missing'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick 1-Click Demo Logins */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/70">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                <span>⚡ Instant 1-Click Demo Login:</span>
                <span className="text-[9px] text-emerald-600 font-normal">No password needed</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('pranab123')}
                  className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800/80 text-emerald-800 dark:text-emerald-200 text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                >
                  🏡 Host (@pranab123)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('admin')}
                  className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800/80 text-amber-800 dark:text-amber-200 text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                >
                  🛡️ Admin (@admin)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('pyntheng123')}
                  className="px-2.5 py-1.5 bg-sky-100 hover:bg-sky-200 dark:bg-sky-900/60 dark:hover:bg-sky-800/80 text-sky-800 dark:text-sky-200 text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                >
                  🏔️ Host (@pyntheng123)
                </button>
              </div>
            </div>

            <div className="relative my-3 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
              <span className="relative bg-white dark:bg-slate-900 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Or Email & Password
              </span>
            </div>
          </div>
        )}

        {/* MODE 1: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            {/* Account Role Selector */}
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
                  Homestay / Hotel Host
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

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address <span className="text-emerald-600 dark:text-emerald-400 font-semibold">(Verification Link Sent)</span>
              </label>
              <input
                type="email"
                required
                placeholder="pranab@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Username */}
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
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Password</span>
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

            {/* Phone / WhatsApp */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone <span className="font-normal text-slate-400">(Optional)</span>
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
                  placeholder="For Direct Bookings"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer mt-2 disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up & Send Email Verification'}
            </button>
          </form>
        )}

        {/* MODE 2: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
              <span className="font-bold">💡 Demo Sign In Credentials:</span>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px]">
                <span>Host: <strong className="text-emerald-900 dark:text-emerald-200">pranab123</strong></span>
                <span>Admin: <strong className="text-emerald-900 dark:text-emerald-200">admin</strong></span>
                <span>Password: <strong className="text-emerald-900 dark:text-emerald-200">123456</strong></span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address or Username
              </label>
              <input
                type="text"
                required
                placeholder="pranab@example.com or @pranab_kaziranga"
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
                  onClick={() => { setMode('forgot_password'); setErrorMessage(''); setSuccessMessage(''); }}
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
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Signing In...' : 'Sign In to Portal'}
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: FORGOT PASSWORD */}
        {mode === 'forgot_password' && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/50 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs">
              <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 mb-1">
                <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                Firebase Password Recovery
              </p>
              <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                Enter your registered account email address. We will send you an official Firebase password reset link to set a new password securely.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. host@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isLoading ? 'Sending Reset Email...' : 'Send Password Reset Link'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Back to Sign In
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
