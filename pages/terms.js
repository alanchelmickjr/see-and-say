import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

/**
 * Simply eBay Terms of Service
 * Privacy-first, transparent terms for our open source app
 */
export default function TermsOfService() {
  const router = useRouter();
  const [showAIChat, setShowAIChat] = useState(false);

  return (
    <>
      <Head>
        <title>Terms of Service - Simply eBay</title>
        <meta name="description" content="Terms of Service for Simply eBay - AI-powered mobile selling app" />
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
                  <h1 className="text-xl font-bold text-gray-800">Terms of Service</h1>
                  <p className="text-gray-600 text-sm">Simply eBay v1.0.0</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-20 px-6 max-w-4xl mx-auto pb-8">
          {/* Introduction */}
          <div className="neumorphic-card p-6 mb-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white text-2xl">📱</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Simply eBay</h2>
              <p className="text-gray-600">Last updated: May 24, 2025</p>
            </div>

            <div className="space-y-4 text-gray-700">
              <p className="leading-relaxed">
                Simply eBay is an open-source, privacy-first mobile application that helps you sell items on eBay using AI-powered recognition and pricing.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">🔒 Privacy First Promise</h3>
                <p className="text-green-700 text-sm">
                  All AI processing happens locally on your device. Your photos, data, and conversations never leave your phone unless you explicitly choose to list an item on eBay.
                </p>
              </div>
            </div>
          </div>

          {/* Key Terms */}
          <div className="space-y-6">
            <div className="neumorphic-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🤖 AI & Local Processing</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• All AI recognition runs locally using your device's processing power</li>
                <li>• No photos or data are sent to external servers for AI analysis</li>
                <li>• LlamaFile and SmolVLM models run entirely on your device</li>
                <li>• You maintain full control over your data at all times</li>
              </ul>
            </div>

            <div className="neumorphic-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Data Usage</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Account data stored locally using Gun.js peer-to-peer database</li>
                <li>• No centralized servers collecting your personal information</li>
                <li>• eBay integration only activates when you choose to create a listing</li>
                <li>• You can delete all local data at any time</li>
              </ul>
            </div>

            <div className="neumorphic-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🔗 eBay Integration</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• eBay listings created only when you explicitly choose to do so</li>
                <li>• You maintain full control over what gets listed and when</li>
                <li>• eBay's terms and policies apply to any listings you create</li>
                <li>• Simply eBay acts as a tool to help format and submit listings</li>
              </ul>
            </div>

            <div className="neumorphic-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">⚖️ Open Source</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Complete source code available under MIT License</li>
                <li>• Community contributions welcome and encouraged</li>
                <li>• Transparent development with no hidden functionality</li>
                <li>• Built with love by Claude Sonnet 3.5, Alan Helmick, and Maximus</li>
              </ul>
            </div>

            <div className="neumorphic-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">⚠️ Disclaimers</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• AI suggestions are estimates - verify pricing before listing</li>
                <li>• Users responsible for compliance with eBay policies</li>
                <li>• App provided "as-is" without warranties</li>
                <li>• Use at your own risk for commercial activities</li>
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div className="neumorphic-card p-6 mt-6 text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Questions?</h3>
            <p className="text-gray-600 text-sm mb-4">
              This is an open-source project. For issues, feature requests, or contributions, 
              visit our GitHub repository.
            </p>
            <div className="space-y-2">
              <button className="neumorphic-button-secondary px-6 py-2 text-sm">
                View on GitHub
              </button>
            </div>
          </div>
        </div>

        {/* AI Chat Popup */}
        {showAIChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-96 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">🧠 AI Legal Assistant</h3>
                    <p className="text-sm opacity-90">Questions about terms?</p>
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
                      📜 I can explain our terms in simple language. Ask me anything about privacy, data usage, or eBay integration!
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAIChat(false)}
                    className="w-full bg-blue-500 text-white px-4 py-3 rounded-xl hover:bg-blue-600 transition-colors font-medium"
                  >
                    Start Chat
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
TermsOfService.getLayout = function getLayout(page) {
  return page;
};
