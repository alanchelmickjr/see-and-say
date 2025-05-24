import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Head from 'next/head';

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    agreeToTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();
  const { register } = useAuth();

  const steps = [
    {
      title: "Welcome to Simply eBay",
      subtitle: "AI-powered mobile selling made simple",
      component: WelcomeStep
    },
    {
      title: "Join Simply eBay",
      subtitle: "Create your account or sign in",
      component: AuthStep
    },
    {
      title: "You're all set!",
      subtitle: "Start scanning and selling",
      component: SuccessStep
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOAuthSignIn = (provider) => {
    // OAuth implementation would go here
    console.log(`Signing in with ${provider}`);
    // For demo purposes, let's just proceed to success
    handleNext();
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    setError(null);
    setShowRetryButton(false);

    // Client-side validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long. Please choose a stronger password.');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords don\'t match. Please check and try again.');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setRetryCount(0);
      handleNext();
      
    } catch (error) {
      console.error('Sign up error:', error);
      setRetryCount(prev => prev + 1);
      
      if (error.message.includes('timeout') || error.message.includes('network')) {
        setError('Connection timeout. Please check your internet connection and try again.');
        setShowRetryButton(true);
      } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        setError('An account with this email already exists. Please try signing in instead.');
      } else {
        setError(error.message || 'Registration failed. Please try again.');
        if (retryCount < 2) {
          setShowRetryButton(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setShowRetryButton(false);
    handleSignUp();
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate password strength
  useEffect(() => {
    const calculateStrength = (password) => {
      let strength = 0;
      if (password.length >= 8) strength += 25;
      if (password.length >= 12) strength += 25;
      if (/[A-Z]/.test(password)) strength += 25;
      if (/[0-9]/.test(password)) strength += 25;
      return strength;
    };

    setPasswordStrength(calculateStrength(formData.password));
  }, [formData.password]);

  // Real-time form validation
  const validateForm = () => {
    const errors = {};
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (formData.password && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };

  const formErrors = validateForm();
  const isFormValid = formData.email && formData.password && formData.confirmPassword && 
                     formData.agreeToTerms && Object.keys(formErrors).length === 0;

  // Welcome Step Component
  function WelcomeStep() {
    return (
      <div className="centered-layout">
        <div className="form-container">
          <div className="neumorphic-card p-8 text-center">
            <div className="relative mb-8">
              <div className="w-20 h-20 mx-auto neumorphic-circle">
                <div className="text-3xl">📱</div>
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 neumorphic-mini-circle">
                <div className="text-lg">🤖</div>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Simply eBay
            </h1>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              Point your camera at any item and get instant AI-powered price suggestions. 
              Create eBay listings with one tap.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 neumorphic-mini-circle">
                  <span className="text-green-500 text-sm">✓</span>
                </div>
                <span className="text-gray-700 text-sm">AI-powered item recognition</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 neumorphic-mini-circle">
                  <span className="text-green-500 text-sm">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Real-time price suggestions</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 neumorphic-mini-circle">
                  <span className="text-green-500 text-sm">✓</span>
                </div>
                <span className="text-gray-700 text-sm">One-tap eBay listing</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 neumorphic-mini-circle">
                  <span className="text-green-500 text-sm">✓</span>
                </div>
                <span className="text-gray-700 text-sm">Local AI processing</span>
              </div>
            </div>
            
            <button
              onClick={handleNext}
              className="neumorphic-button-primary w-full py-4 px-6 text-white font-semibold rounded-2xl"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Auth Step Component
  function AuthStep() {
    return (
      <div className="centered-layout">
        <div className="form-container">
          <div className="neumorphic-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Join Simply eBay
              </h2>
              <p className="text-gray-600">
                Choose your preferred sign-in method
              </p>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleOAuthSignIn('google')}
                className="neumorphic-button-oauth w-full py-4 px-6 rounded-2xl"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button
                onClick={() => handleOAuthSignIn('github')}
                className="neumorphic-button-oauth w-full py-4 px-6 rounded-2xl"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 text-gray-500">Or continue with email</span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="text-red-800 text-sm">{error}</div>
                {showRetryButton && (
                  <button
                    onClick={handleRetry}
                    className="text-sm text-red-600 underline hover:text-red-800 mt-2"
                    disabled={isLoading}
                  >
                    Try Again
                  </button>
                )}
              </div>
            )}

            {/* Email Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  className="neumorphic-input w-full p-4 rounded-xl"
                  placeholder="Enter your first name"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className="neumorphic-input w-full p-4 rounded-xl"
                  placeholder="your@email.com"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    className="neumorphic-input w-full p-4 pr-12 rounded-xl"
                    placeholder="Choose a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="neumorphic-progress-track h-2">
                      <div 
                        className="neumorphic-progress-fill"
                        style={{ 
                          width: `${passwordStrength}%`,
                          background: passwordStrength < 50 ? 
                            'linear-gradient(90deg, #ef4444, #dc2626)' : 
                            passwordStrength < 75 ? 
                            'linear-gradient(90deg, #f59e0b, #d97706)' : 
                            'linear-gradient(90deg, #10b981, #059669)'
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Password strength: {
                        passwordStrength < 50 ? 'Weak' : 
                        passwordStrength < 75 ? 'Fair' : 'Strong'
                      }
                    </p>
                  </div>
                )}
                
                {formErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  className="neumorphic-input w-full p-4 rounded-xl"
                  placeholder="Confirm your password"
                />
                {formErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
                )}
              </div>

              <div className="flex items-start space-x-3">
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => updateFormData('agreeToTerms', e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the{' '}
                    <button 
                      type="button"
                      onClick={() => router.push('/terms')}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button 
                      type="button"
                      onClick={() => router.push('/privacy')}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                onClick={handleBack}
                className="neumorphic-button flex-1 py-4 px-6 rounded-xl"
              >
                Back
              </button>
              <button
                onClick={handleSignUp}
                disabled={!isFormValid || isLoading}
                className={`neumorphic-button-primary flex-1 py-4 px-6 text-white font-semibold rounded-xl ${
                  (!isFormValid || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
      
    } catch (err) {
      console.error('Registration error:', err);
      setRetryCount(prev => prev + 1);
      
      // Enhanced error handling with user-friendly messages
      if (err.message.includes('Password too short') || err.message.includes('PASSWORD_TOO_SHORT')) {
        setError('Password must be at least 8 characters long. Please choose a stronger password.');
      } else if (err.message.includes('User already created') || err.message.includes('USER_EXISTS')) {
        setError('An account with this email already exists. Try logging in instead.');
      } else if (err.message.includes('Passwords do not match')) {
        setError('Passwords don\'t match. Please check and try again.');
      } else if (err.message.includes('Invalid email')) {
        setError('Please enter a valid email address.');
      } else if (err.message.includes('timeout') || err.message.includes('Network') || err.message.includes('SERVICE_UNAVAILABLE')) {
        setError('Connection problem. Please check your internet and try again.');
        setShowRetryButton(true);
      } else {
        setError('Registration temporarily unavailable. Please try again in a moment.');
        setShowRetryButton(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setShowRetryButton(false);
    handleSignUp();
  };

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 25;
    return strength;
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Update password strength when password changes
    if (field === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  // Real-time form validation
  const validateForm = () => {
    const errors = {};
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (formData.password && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };

  const formErrors = validateForm();
  const isFormValid = formData.email && formData.password && formData.confirmPassword && 
                     formData.agreeToTerms && Object.keys(formErrors).length === 0;

  // Welcome Step Component
  function WelcomeStep() {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="neumorphic-card w-full max-w-sm p-8 mb-8">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto neumorphic-circle flex items-center justify-center">
              <div className="text-4xl">📱</div>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 neumorphic-mini-circle flex items-center justify-center">
              <div className="text-lg">🤖</div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Simply eBay
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Point your camera at any item and get instant AI-powered price suggestions. 
            Create eBay listings with one tap.
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 neumorphic-mini-circle flex items-center justify-center">
                <span className="text-green-500 text-sm">✓</span>
              </div>
              <span className="text-gray-700">AI item recognition</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 neumorphic-mini-circle flex items-center justify-center">
                <span className="text-green-500 text-sm">✓</span>
              </div>
              <span className="text-gray-700">Smart price suggestions</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 neumorphic-mini-circle flex items-center justify-center">
                <span className="text-green-500 text-sm">✓</span>
              </div>
              <span className="text-gray-700">One-tap listing creation</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleNext}
          className="neumorphic-button-primary w-full max-w-sm py-4 text-lg font-medium"
        >
          Get Started
        </button>
      </div>
    );
  }

  // Sign Up Step Component
  function SignUpStep() {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="neumorphic-card w-full max-w-sm p-8 mb-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto neumorphic-circle flex items-center justify-center mb-4">
              <div className="text-2xl">🔐</div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h2>
            <p className="text-gray-600">Join thousands of successful sellers</p>
          </div>

          {error && (
            <div className="neumorphic-error mb-6 p-4 rounded-2xl">
              <div className="flex items-start space-x-3">
                <span className="text-red-500 text-lg mt-0.5">⚠️</span>
                <div className="flex-1">
                  <span className="text-red-700 text-sm block mb-2">{error}</span>
                  {showRetryButton && (
                    <button
                      onClick={handleRetry}
                      className="text-xs text-blue-600 underline hover:text-blue-800"
                      disabled={isLoading}
                    >
                      Try Again
                    </button>
                  )}
                  {retryCount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Attempt {retryCount + 1}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => updateFormData('firstName', e.target.value)}
                className="neumorphic-input w-full p-4 rounded-2xl"
                placeholder="Enter your first name"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                className="neumorphic-input w-full p-4 rounded-2xl"
                placeholder="your@email.com"
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  className="neumorphic-input w-full p-4 pr-12 rounded-2xl"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-gray-500">
                    Minimum 8 characters required
                  </p>
                  {formData.password && (
                    <p className="text-xs text-gray-500">
                      {passwordStrength < 50 ? 'Weak' : passwordStrength < 75 ? 'Good' : 'Strong'}
                    </p>
                  )}
                </div>
                {formData.password && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        passwordStrength < 50 ? 'bg-red-400' : 
                        passwordStrength < 75 ? 'bg-yellow-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                )}
              </div>
              {formErrors.password && (
                <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                className="neumorphic-input w-full p-4 rounded-2xl"
                placeholder="Confirm your password"
              />
              {formErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
              )}
            </div>

            <div className="flex items-start space-x-3">
              <button
                type="button"
                onClick={() => updateFormData('agreeToTerms', !formData.agreeToTerms)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  formData.agreeToTerms ? 'neumorphic-checked' : 'neumorphic-checkbox'
                }`}
              >
                {formData.agreeToTerms && <span className="text-blue-600 text-sm">✓</span>}
              </button>
              <p className="text-xs text-gray-600 leading-relaxed">
                I agree to the <a href="/terms" className="text-blue-600 underline font-medium">Terms of Service</a> and <a href="/privacy" className="text-blue-600 underline font-medium">Privacy Policy</a>
                <br />
                <span className="text-green-600 font-medium">🔒 100% local processing - your data stays private</span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 w-full max-w-sm">
          <button
            onClick={handleSignUp}
            disabled={isLoading || !isFormValid}
            className="neumorphic-button-primary w-full py-4 text-lg font-medium disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </button>

          <button
            onClick={handleBack}
            className="neumorphic-button-secondary w-full py-4 text-lg font-medium"
          >
            Back
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <button
            onClick={() => router.push('/auth/login')}
            className="text-blue-600 font-medium"
          >
            Sign In
          </button>
        </p>
      </div>
    );
  }

  // Success Step Component
  function SuccessStep() {
    useEffect(() => {
      const timer = setTimeout(() => {
        router.push('/items/scan');
      }, 3000);
      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="neumorphic-card w-full max-w-sm p-8 mb-8">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto neumorphic-circle flex items-center justify-center bg-green-50">
              <div className="text-4xl">🎉</div>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 neumorphic-mini-circle flex items-center justify-center bg-green-100">
              <div className="text-lg">✓</div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Welcome, {formData.firstName}!
          </h2>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your account is ready! Starting the camera in 3 seconds...
          </p>
          
          <div className="w-16 h-2 mx-auto bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-progress"></div>
          </div>
        </div>
        
        <button
          onClick={() => router.push('/items/scan')}
          className="neumorphic-button-primary w-full max-w-sm py-4 text-lg font-medium"
        >
          Start Scanning Now
        </button>
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-neumorphic">
      {/* Progress Indicators */}
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'bg-blue-600 scale-125'
                  : index < currentStep
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      <CurrentStepComponent />

      <style jsx>{`
        .bg-neumorphic {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        
        .neumorphic-card {
          background: linear-gradient(145deg, #ffffff 0%, #f0f0f0 100%);
          box-shadow: 
            20px 20px 60px #bebebe,
            -20px -20px 60px #ffffff;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.8);
        }
        
        .neumorphic-circle {
          background: linear-gradient(145deg, #ffffff 0%, #f0f0f0 100%);
          box-shadow: 
            15px 15px 30px #bebebe,
            -15px -15px 30px #ffffff;
          border-radius: 50%;
        }
        
        .neumorphic-mini-circle {
          background: linear-gradient(145deg, #ffffff 0%, #f0f0f0 100%);
          box-shadow: 
            5px 5px 10px #bebebe,
            -5px -5px 10px #ffffff;
          border-radius: 50%;
        }
        
        .neumorphic-input {
          background: linear-gradient(145deg, #f0f0f0 0%, #ffffff 100%);
          box-shadow: 
            inset 8px 8px 16px #bebebe,
            inset -8px -8px 16px #ffffff;
          border: none;
          outline: none;
          transition: all 0.3s ease;
        }
        
        .neumorphic-input:focus {
          box-shadow: 
            inset 6px 6px 12px #bebebe,
            inset -6px -6px 12px #ffffff,
            0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .neumorphic-button-primary {
          background: linear-gradient(145deg, #3b82f6 0%, #2563eb 100%);
          box-shadow: 
            8px 8px 16px rgba(37, 99, 235, 0.3),
            -8px -8px 16px rgba(59, 130, 246, 0.3);
          border: none;
          color: white;
          border-radius: 16px;
          transition: all 0.3s ease;
        }
        
        .neumorphic-button-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 
            10px 10px 20px rgba(37, 99, 235, 0.4),
            -10px -10px 20px rgba(59, 130, 246, 0.4);
        }
        
        .neumorphic-button-primary:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 
            4px 4px 8px rgba(37, 99, 235, 0.3),
            -4px -4px 8px rgba(59, 130, 246, 0.3);
        }
        
        .neumorphic-button-secondary {
          background: linear-gradient(145deg, #ffffff 0%, #f0f0f0 100%);
          box-shadow: 
            8px 8px 16px #bebebe,
            -8px -8px 16px #ffffff;
          border: none;
          color: #374151;
          border-radius: 16px;
          transition: all 0.3s ease;
        }
        
        .neumorphic-button-secondary:hover {
          transform: translateY(-2px);
          box-shadow: 
            10px 10px 20px #bebebe,
            -10px -10px 20px #ffffff;
        }
        
        .neumorphic-checkbox {
          background: linear-gradient(145deg, #f0f0f0 0%, #ffffff 100%);
          box-shadow: 
            inset 4px 4px 8px #bebebe,
            inset -4px -4px 8px #ffffff;
        }
        
        .neumorphic-checked {
          background: linear-gradient(145deg, #dbeafe 0%, #bfdbfe 100%);
          box-shadow: 
            inset 4px 4px 8px #a5b4fc,
            inset -4px -4px 8px #e0e7ff;
        }
        
        .neumorphic-error {
          background: linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%);
          box-shadow: 
            8px 8px 16px rgba(239, 68, 68, 0.1),
            -8px -8px 16px rgba(254, 226, 226, 0.8);
        }
        
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        
        .animate-progress {
          animation: progress 3s ease-out;
        }
      `}</style>
    </div>
  );
}
