import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { FaEye, FaEyeSlash, FaCheckCircle, FaRegCircle, FaArrowLeft, FaExclamationCircle } from 'react-icons/fa' 

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [view, setView] = useState('signin') 
  const [showPassword, setShowPassword] = useState(false) 
  const [rememberMe, setRememberMe] = useState(false)     
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')

  // --- PASSWORD CHECKS ---
  const requirements = [
    { text: "At least 6 characters", met: password.length >= 6 },
    { text: "One lowercase letter", met: /[a-z]/.test(password) },
    { text: "One uppercase letter", met: /[A-Z]/.test(password) },
    { text: "One number", met: /[0-9]/.test(password) },
    { text: "One symbol (!@#$)", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
  const isPasswordValid = requirements.every(req => req.met);
  // Check match only if view is signup
  const doPasswordsMatch = view === 'signup' ? password === confirmPassword : true;

  // 1. On Mount: Check Remember Me
  useEffect(() => {
    const savedEmail = localStorage.getItem('taskendar_saved_email');
    if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageType('error')

    try {
        let result;
        if (view === 'forgot') {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin 
            });
            if (error) throw error;
            setMessageType('success');
            setMessage('Password reset link sent! Check your email.');
            setLoading(false);
            return; 
        }

        if (view === 'signup') {
            if (password !== confirmPassword) {
                throw new Error("Passwords do not match!");
            }
            if (!isPasswordValid) {
                throw new Error("Please satisfy all password requirements.");
            }
            result = await supabase.auth.signUp({ email, password });
            if (result.error) throw result.error;
            setMessageType('success');
            setMessage('Account created! Please check your email then Sign In.');
            setView('signin');
            setPassword('');    
            setConfirmPassword('');
        } else if (view === 'signin') {
            result = await supabase.auth.signInWithPassword({ email, password });
            if (result.error) throw result.error;
            if (rememberMe) localStorage.setItem('taskendar_saved_email', email);
            else localStorage.removeItem('taskendar_saved_email');
        }

    } catch (error) {
        console.error("Auth Error:", error.message);
        setMessage(error.message);
        setMessageType('error');
    } finally {
        setLoading(false);
    }
  }

  const switchView = (newView) => {
    setView(newView);
    setMessage('');
    setMessageType('error');
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#F2F0E9]">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96 border-2 border-gray-900 animate-in fade-in zoom-in duration-300">
        
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 tracking-tighter uppercase text-center relative">
          {view === 'signup' && 'Join Taskendar'}
          {view === 'signin' && 'Welcome Back'}
          {view === 'forgot' && 'Reset Password'}
          {view === 'forgot' && (
              <button onClick={() => switchView('signin')} className="absolute left-0 top-1 text-gray-400 hover:text-gray-900">
                  <FaArrowLeft size={16} />
              </button>
          )}
        </h1>
        
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <input
            className="p-3 bg-gray-50 border-2 border-gray-200 rounded-lg font-bold text-gray-800 focus:border-gray-900 outline-none transition"
            type="email"
            placeholder="Your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {view !== 'forgot' && (
            <div className="relative">
                <input
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg font-bold text-gray-800 focus:border-gray-900 outline-none transition pr-10"
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-800 transition"
                >
                    {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
            </div>
          )}

          {view === 'signin' && (
              <div className="flex justify-end -mt-2">
                  <button 
                    type="button"
                    onClick={() => switchView('forgot')}
                    className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-wide"
                  >
                    Forgot Password?
                  </button>
              </div>
          )}

          {view === 'signup' && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Password Requirements:</p>
                <div className="space-y-1">
                    {requirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2">
                            {req.met ? (
                                <FaCheckCircle className="text-green-500 text-xs" />
                            ) : (
                                <FaRegCircle className="text-gray-300 text-xs" />
                            )}
                            <span className={`text-[10px] font-bold transition-colors ${req.met ? 'text-green-600' : 'text-gray-400'}`}>
                                {req.text}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {view === 'signup' && (
            <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    // 🛑 VISUAL ERROR: Red border + Red background on mismatch
                    className={`
                        w-full p-3 border-2 rounded-lg font-bold text-gray-800 focus:outline-none transition
                        ${confirmPassword && !doPasswordsMatch ? 'border-red-500 bg-red-50' : 'bg-gray-50 border-gray-200 focus:border-gray-900'}
                    `}
                />
                {/* 🛑 Exclamation Icon if mismatch */}
                {confirmPassword && !doPasswordsMatch && (
                    <div className="absolute right-3 top-3.5 text-red-500 animate-pulse">
                        <FaExclamationCircle size={20} />
                    </div>
                )}
            </div>
          )}

          {view === 'signin' && (
            <div className="flex items-center gap-2 px-1">
                <input 
                    type="checkbox" 
                    id="remember"
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs font-bold text-gray-500 uppercase tracking-wide cursor-pointer select-none">
                    Remember Me
                </label>
            </div>
          )}

          <button
            className={`
                text-white font-bold py-3 rounded-lg transition uppercase tracking-wider mt-2 active:scale-95 transform duration-100
                ${view === 'signup' && (!isPasswordValid || !doPasswordsMatch)
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                    : 'bg-gray-900 hover:bg-blue-700'
                }
            `}
            disabled={loading || (view === 'signup' && (!isPasswordValid || !doPasswordsMatch))}
          >
            {loading ? 'Loading...' : 
                view === 'signup' ? 'Sign Up' : 
                view === 'forgot' ? 'Send Reset Link' : 'Sign In'
            }
          </button>
        </form>

        {message && (
            <div className={`mt-4 text-center text-sm font-bold p-2 rounded-lg ${messageType === 'error' ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                {message}
            </div>
        )}
        
        {view !== 'forgot' && (
            <button 
            onClick={() => switchView(view === 'signin' ? 'signup' : 'signin')}
            className="w-full mt-6 text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest"
            >
            {view === 'signin' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
            </button>
        )}
      </div>
    </div>
  )
}