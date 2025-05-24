import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

/**
 * Simply eBay Privacy Policy
 * Transparent privacy policy emphasizing local processing and data ownership
 */
export default function PrivacyPolicy() {
  const router = useRouter();
  const [showAIChat, setShowAIChat] = useState(false);

  return (
    <>
      <Head>
        <title>Privacy Policy - Simply eBay</title>
        <meta name="description" content="Privacy Policy for Simply eBay - Your data stays private and local" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="neumorphic-button-mini w-10 h-10 rounded-full flex items-center justify-center"
                >
                  ←
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Privacy Policy</h1>
                  <p className="text-gray-600 text-sm">Your data, your device, your choice</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-20 px-6 max-w-4xl mx-auto pb-8">
          {/* Hero Privacy Statement */}
          <div className="neumorphic-card p-6 mb-6 bg-gradient-to-r from-green-50 to-blue-50">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white text-2xl">🔒</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">100% Private by Design</h2>
              <p className="text-gray-600">Last updated: May 24, 2025</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h3 className="font-bold text-green-800 mb-2">🎯 Our Privacy Promise</h3>
              <p className="text-green-700 text-sm leading-relaxed">
                Simply eBay is built with privacy as the foundation. Your photos, data, and AI conversations 
                never leave your device unless you explicitly choose to create an eBay listing. 
                No tracking, no data collection, no corporate surveillance.
              </p>
            </div>
          </div>

          {/* Privacy Sections */}
          <div className="space-y-6">
            <div className="neumorphic-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                📱 <span className="ml-2">Local-First Architecture</span>
              </h3>
              <div className="space-y-3 text-gray-700 text-sm">
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="font-semibold mb-1">🤖 AI Processing</h4>
                  <p>All AI recognition happens on your device using LlamaFile and SmolVLM. Your photos are processed locally and never uploaded anywhere.</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="font-semibold mb-1">💾 Data Storage</h4>
                  <p>Account data stored locally using Gun.js peer-to-peer database. No centralized servers collecting your information.</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="font-semibold mb-1">🔐 Encryption</h4>
                  <p>All local data is encrypted and only accessible through your device authentication.</p>
                </div>
              </div>
            </div>

            <div className="neumorphic-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                🚫 <span className="ml-2">What We DON'T Collect</span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center space-x-3 text-gray-700 text-sm">
                  <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600">✗</span>
                  <span>Your photos or camera data</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700 text-sm">
                  <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600">✗</span>
                  <span>Your location or device identifiers</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700 text-sm">
                  <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600">✗</span>
                  <span>Your browsing habits or usage analytics</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700 text-sm">
                  <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600">✗</span>
                  <span>Your personal conversations with AI</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700 text-sm">
                  <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600">✗</span>
                  <span>Any marketing or advertising data</span>
                </div>
              </div>
            </div>

            <div className="neumorphic-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                ✅ <span className="ml-2">What We DO Handle</span>
              </h3>
              <div className="space-y-3">
                <div className="bg-green-50 rounded-lg p-3">
                  <h4 className="font-semibold text-green-800 mb-1">📧 Account Creation</h4>
                  <p className="text-green-700 text-sm">
                    Email and encrypted password stored locally for authentication. 
                    No email verification or marketing communications.
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <h4 className="font-semibold text-green-800 mb-1">🔗 eBay Integration</h4>
                  <p className="text-green-700 text-sm">
                    Only when you choose to create a listing, minimal data (item title, description, price) 
                    is sent to eBay through their official API.
                  </p>
                </div>
              </div>
            </div>

            <div className="neumorphic-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                🛠️ <span className="ml-2">Technical Implementation</span>
              </h3>
              <div className="space-y-2 text-gray-700 text-sm">
                <div className="flex items-start space-x-3">
                  <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs mt-0.5">T</span>
                  <span><strong>TensorFlow.js:</strong> Runs AI models in your browser without sending data externally</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs mt-0.5">G</span>
                  <span><strong>Gun.js:</strong> Peer-to-peer database eliminates centralized data collection</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs mt-0.5">L</span>
                  <span><strong>LlamaFile:</strong> Local AI server runs entirely on your device</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs mt-0.5">N</span>
                  <span><strong>Next.js:</strong> Progressive web app that works offline</span>
                </div>
              </div>
            </div>

            <div className="neumorphic-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                🔧 <span className="ml-2">Your Controls</span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center space-x-3 text-gray-700 text-sm">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</span>
                  <span>Delete all local data anytime through settings</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700 text-sm">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</span>
                  <span>Control which photos get processed by AI</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700 text-sm">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</span>
                  <span>Choose when and what to list on eBay</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700 text-sm">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</span>
                  <span>Use app completely offline if desired</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Open Source */}
          <div className="neumorphic-card p-6 mt-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">🌟</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Open Source Transparency</h3>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              Complete source code available on GitHub. Verify our privacy practices yourself, 
              contribute improvements, or fork the project. Built with transparency and community in mind.
            </p>
            <div className="space-y-2">
              <button className="neumorphic-button-secondary px-6 py-2 text-sm">
                View Source Code
              </button>
            </div>
          </div>
        </div>

        {/* AI Chat Popup */}
        {showAIChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-96 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">🔒 Privacy Assistant</h3>
                    <p className="text-sm opacity-90">Questions about privacy?</p>
                  </div>
                  <button
                    onClick={() => setShowAIChat(false)}
                    className="text-white hover:text-gray-200 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      🛡️ I can explain how your data stays private and secure. Ask me about local AI processing, data storage, or eBay integration!
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAIChat(false)}
                    className="w-full bg-green-500 text-white px-4 py-3 rounded-xl hover:bg-green-600 transition-colors font-medium"
                  >
                    Start Privacy Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Prevent the default layout with header from being applied
PrivacyPolicy.getLayout = function getLayout(page) {
  return page;
};
