import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Show splash for 3 seconds, then redirect based on auth status
    const timer = setTimeout(() => {
      setShowSplash(false);
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

  if (!showSplash && !loading) {
    return null; // Let the redirect happen
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-orange-400 animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 rounded-full bg-blue-400 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-32 w-12 h-12 rounded-full bg-green-400 animate-pulse delay-2000"></div>
        <div className="absolute bottom-32 right-16 w-24 h-24 rounded-full bg-purple-400 animate-pulse delay-500"></div>
      </div>

      {/* Main splash content */}
      <div className="text-center z-10 px-8">
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
        <div className="space-y-2 mb-8 max-w-md mx-auto">
          <div className="flex items-center justify-center space-x-3 text-gray-700">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm">AI-powered item recognition</span>
          </div>
          <div className="flex items-center justify-center space-x-3 text-gray-700">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm">100% local processing - your data stays private</span>
          </div>
          <div className="flex items-center justify-center space-x-3 text-gray-700">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm">One-tap eBay listing creation</span>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full animate-progress"></div>
          </div>
        </div>

        {/* Loading text */}
        <p className="text-gray-500 text-sm">
          Initializing AI models...
        </p>
      </div>

      {/* AI Chat Test Button (bottom right) */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-20"
      >
        <div className="text-white text-xl">🧠</div>
      </button>

      {/* AI Chat Popup */}
      {chatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-96 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">🧠 AI Test Chat</h3>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-white hover:text-gray-200 text-xl"
                >
                  ×
                </button>
              </div>
              <p className="text-sm opacity-90">Testing local AI model connection</p>
            </div>
            <div className="p-4">
              <iframe
                src="/api/chat-test"
                className="w-full h-64 border-0 rounded-lg"
                title="AI Chat Test"
              />
            </div>
          </div>
        </div>
      )}

      {/* CSS for progress animation */}
      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
