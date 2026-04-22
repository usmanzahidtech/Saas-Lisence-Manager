import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Validation
    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      // Login function already handles expiry and suspension validation
      await login(email, password);
      
      // Successful login - navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      
      // Display user-friendly error messages
      let message = error.message;
      
      if (message.includes('user-not-found') || message.includes('wrong-password')) {
        message = 'Invalid email or password';
      } else if (message.includes('too-many-requests')) {
        message = 'Too many failed login attempts. Please try again later.';
      } else if (message.includes('network-request-failed')) {
        message = 'Network error. Please check your internet connection.';
      }
      
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 animate-gradient-x p-4">
      <Helmet>
        <title>Login | SaaS License Manager</title>
        <meta name="description" content="Secure login for SaaS License Management System" />
      </Helmet>
      
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-md rounded-full shadow-2xl mb-6 animate-float border border-white/20">
            <Shield className="w-12 h-12 text-white drop-shadow-lg" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">SaaS License Manager</h1>
          <p className="text-purple-100">Secure access to your dashboard</p>
        </div>

        {/* Login Card */}
        <div className="glass-effect rounded-2xl shadow-2xl p-8 animate-slide-in backdrop-blur-xl bg-white/90">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Sign In
          </h2>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">Login Failed</h3>
                <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 bg-white/50 focus:bg-white text-gray-900 placeholder-gray-400 font-medium hover:border-purple-300"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 bg-white/50 focus:bg-white text-gray-900 placeholder-gray-400 font-medium hover:border-purple-300"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-purple-500/30 transform hover:scale-[1.02] active:scale-95"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Protected by enterprise-grade security
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-white text-sm">
          <p>© 2025 SaaS License Management System</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
