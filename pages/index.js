import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';

/**
 * Simply eBay Splash Screen - Beautiful branded entry point
 * Shows for 3 seconds then redirects to onboarding or dashboard
 */
export default function SplashScreen() {
  const [chatOpen, setChatOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Show splash for 3 seconds, then redirect based on auth status
    const timer = setTimeout(() => {
      if (!loading) {
        if (isAuthenticated) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, loading, router]);

  return (
    <>
      <Head>
        <title>Simply eBay - Point. Scan. Sell. Repeat.</title>
        <meta name="description" content="AI-powered mobile selling made simple" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#fb923c" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-orange-400 animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 rounded-full bg-blue-400 animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-32 w-12 h-12 rounded-full bg-green-400 animate-pulse delay-2000"></div>
          <div className="absolute bottom-32 right-16 w-24 h-24 rounded-full bg-purple-400 animate-pulse delay-500"></div>
        </div>

        {/* Main splash content */}
        <div className="text-center z-10 px-8 max-w-lg">
          {/* Logo/Icon */}
          <div className="mb-8 relative">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <div className="text-white text-5xl">📱</div>
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <div className="text-white text-xl">🤖</div>
            </div>
          </div>

          {/* Brand name */}
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent mb-4 animate-pulse">
            Simply eBay
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-600 mb-6 font-medium">
            Point. Scan. Sell. Repeat.
          </p>

          {/* Features preview */}
          <div className="space-y-3 mb-8 max-w-md mx-auto">
            <div className="flex items-center justify-center space-x-3 text-gray-700 animate-fade-in-up delay-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              <span className="text-sm font-medium">AI-powered item recognition</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-gray-700 animate-fade-in-up delay-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              <span className="text-sm font-medium">100% local processing - privacy first</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-gray-700 animate-fade-in-up delay-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              <span className="text-sm font-medium">One-tap eBay listing creation</span>
            </div>
          </div>

          {/* Loading indicator */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full animate-progress"></div>
            </div>
          </div>

          {/* Status text */}
          <p className="text-gray-500 text-sm animate-pulse">
            {loading ? 'Checking authentication...' : 'Initializing AI models...'}
          </p>

          {/* Version info */}
          <div className="mt-8 text-xs text-gray-400">
            <p>v1.0.0 • Open Source • Privacy First</p>
          </div>
        </div>

        {/* AI Chat Test Button (bottom right) */}
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-20 animate-bounce-gentle"
          aria-label="Test AI Chat"
        >
          <div className="text-white text-xl">🧠</div>
        </button>

        {/* AI Chat Popup */}
        {chatOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-96 overflow-hidden animate-scale-up">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">🧠 AI Test Chat</h3>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="text-white hover:text-gray-200 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
                    aria-label="Close chat"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm opacity-90">Testing local LlamaFile connection</p>
              </div>
              <div className="p-6">
                <div className="text-center text-gray-600">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <p className="font-medium mb-2">Local AI is ready!</p>
                  <p className="text-sm text-gray-500 mb-6">Chat functionality will be integrated into the main app experience</p>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="w-full bg-blue-500 text-white px-4 py-3 rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-md hover:shadow-lg"
                  >
                    Continue to App
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom CSS animations */}
        <style jsx>{`
          @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scale-up {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes bounce-gentle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          .animate-progress {
            animation: progress 3s ease-out forwards;
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
          }
          .animate-scale-up {
            animation: scale-up 0.3s ease-out forwards;
          }
          .animate-bounce-gentle {
            animation: bounce-gentle 3s ease-in-out infinite;
          }
          .delay-300 { animation-delay: 0.3s; }
          .delay-500 { animation-delay: 0.5s; }
          .delay-700 { animation-delay: 0.7s; }
        `}</style>
      </div>
    </>
  );
}
