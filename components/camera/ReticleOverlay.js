import { useState, useEffect } from 'react';

/**
 * Reticle Overlay Component for Camera Recognition
 * Shows targeting reticles with price information and confidence levels
 */
const ReticleOverlay = ({ 
  detectedItems = [], 
  videoRef, 
  showPrices = true, 
  showConfidence = true,
  onItemClick = null 
}) => {
  const [overlayDimensions, setOverlayDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (videoRef?.current) {
        const { clientWidth, clientHeight } = videoRef.current;
        setOverlayDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, [videoRef]);

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'border-green-400 bg-green-400';
    if (confidence >= 0.6) return 'border-yellow-400 bg-yellow-400';
    return 'border-red-400 bg-red-400';
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.8) return 'HIGH';
    if (confidence >= 0.6) return 'MED';
    return 'LOW';
  };

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ 
        width: overlayDimensions.width, 
        height: overlayDimensions.height 
      }}
    >
      {/* Center crosshair */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-12 h-12 border-2 border-white border-opacity-60 rounded-full">
          <div className="w-full h-full border border-gray-300 border-opacity-40 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
          </div>
        </div>
        {/* Crosshair lines */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-0.5 bg-white opacity-60"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 bg-white opacity-60"></div>
      </div>

      {/* Item reticles */}
      {detectedItems.map((item, index) => (
        <div
          key={item.id || index}
          className={`absolute border-2 bg-opacity-20 rounded-lg transition-all duration-300 ${getConfidenceColor(item.confidence || 0.75)}`}
          style={{
            left: `${item.x || 50}%`,
            top: `${item.y || 50}%`,
            width: `${item.width || 100}px`,
            height: `${item.height || 80}px`,
            transform: 'translate(-50%, -50%)',
            cursor: onItemClick ? 'pointer' : 'default'
          }}
          onClick={() => onItemClick && onItemClick(item)}
        >
          {/* Price bubble */}
          {showPrices && item.estimatedPrice && (
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
              {item.estimatedPrice}
            </div>
          )}
          
          {/* Item name */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded max-w-24 truncate shadow-lg">
            {item.name || 'Unknown'}
          </div>
          
          {/* Confidence indicator */}
          {showConfidence && (
            <div className="absolute -top-3 -right-3 bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded-full">
              {getConfidenceText(item.confidence || 0.75)}
            </div>
          )}
          
          {/* Corner markers */}
          <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-current"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-current"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-current"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-current"></div>
        </div>
      ))}

      {/* Scan status indicator */}
      <div className="absolute top-4 left-4 bg-gray-900 bg-opacity-80 text-white text-xs px-3 py-2 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Scanning...</span>
        </div>
      </div>

      {/* Item count */}
      {detectedItems.length > 0 && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg">
          {detectedItems.length} item{detectedItems.length !== 1 ? 's' : ''} detected
        </div>
      )}
    </div>
  );
};

export default ReticleOverlay;
