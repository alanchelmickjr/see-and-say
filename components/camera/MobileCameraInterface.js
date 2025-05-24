import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LiveCamera from '../../components/camera/LiveCamera';

/**
 * Mobile Camera Interface - Full screen camera with mobile-first UX
 * Optimized for one-handed operation and quick item recognition
 */
const MobileCameraInterface = ({ 
  onRecognitionResult,
  isProcessing = false,
  apiBaseUrl = 'http://localhost:8080'
}) => {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanMode, setScanMode] = useState('auto'); // auto, manual, burst
  const [lastRecognition, setLastRecognition] = useState(null);

  const handleRecognition = (result) => {
    setLastRecognition(result);
    if (onRecognitionResult) {
      onRecognitionResult(result);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const quickActions = [
    {
      id: 'list',
      icon: '💰',
      label: 'Quick List',
      color: 'bg-green-500',
      action: () => {
        if (lastRecognition?.itemId) {
          router.push(`/items/${lastRecognition.itemId}?fromScan=true&quick=true`);
        }
      }
    },
    {
      id: 'similar',
      icon: '🔍',
      label: 'Similar',
      color: 'bg-blue-500',
      action: () => {
        // Show similar items
        console.log('Show similar items:', lastRecognition?.similarItems);
      }
    },
    {
      id: 'manual',
      icon: '📝',
      label: 'Manual',
      color: 'bg-gray-500',
      action: () => {
        router.push('/items/new');
      }
    }
  ];

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} bg-black`}>
      {/* Camera Component */}
      <div className="relative w-full h-full">
        <LiveCamera
          onRecognitionResult={handleRecognition}
          isProcessing={isProcessing}
          apiBaseUrl={apiBaseUrl}
          instruction="Identify this item for eBay listing. Focus on: item name, condition, estimated market price, and eBay category."
          interval={scanMode === 'burst' ? 500 : scanMode === 'auto' ? 1000 : 2000}
        />
        
        {/* Mobile Controls Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4 pointer-events-auto">
            <div className="flex items-center justify-between text-white">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center"
              >
                ←
              </button>
              
              <div className="text-center">
                <div className="text-lg font-semibold">Scan Items</div>
                <div className="text-xs opacity-80">Point camera at items</div>
              </div>
              
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center"
              >
                ⛶
              </button>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pointer-events-auto">
            {/* Recognition Result */}
            {lastRecognition && (
              <div className="mb-4 bg-white/10 backdrop-blur rounded-lg p-3 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{lastRecognition.itemName}</span>
                  <span className="text-green-400 font-bold">{lastRecognition.suggestedPrice}</span>
                </div>
                <div className="text-xs opacity-80">
                  {lastRecognition.category} • {Math.round((lastRecognition.confidence || 0.75) * 100)}% confidence
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {lastRecognition && (
              <div className="flex space-x-3 mb-4">
                {quickActions.map(action => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className={`flex-1 ${action.color} text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 font-medium`}
                  >
                    <span className="text-lg">{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Scan Mode Toggle */}
            <div className="flex items-center justify-center space-x-4">
              <div className="flex bg-white/10 rounded-full p-1">
                {['auto', 'manual', 'burst'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setScanMode(mode)}
                    className={`px-4 py-2 text-xs font-medium rounded-full transition-colors ${
                      scanMode === mode 
                        ? 'bg-white text-black' 
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    {mode === 'auto' && <>⚡ Auto</>}
                    {mode === 'manual' && <>📷 Manual</>}
                    {mode === 'burst' && <>🔥 Burst</>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-6 py-3 rounded-lg pointer-events-auto">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileCameraInterface;
