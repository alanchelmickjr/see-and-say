import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';

// Gun.js for local database
let gun;
if (typeof window !== 'undefined') {
  const Gun = require('gun');
  require('gun/sea');
  gun = Gun(['http://localhost:8765/gun']);
}

/**
 * Simply eBay Dashboard - Local Gun.js powered experience
 */
export default function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [stats, setStats] = useState({
    totalItems: 0,
    itemsScannedToday: 0,
    totalValue: 0,
    pendingListings: 0,
    soldItems: 0
  });
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    if (!gun) {
      console.log('Gun.js not available on server side');
      setLoading(false);
      return;
    }

    console.log('🔗 Loading REAL data from Gun.js database...');
    
    try {
      const items = [];
      let hasCheckedForData = false;
      let dataCheckTimer = null;
      
      // Real-time listener for Gun.js items
      gun.get('items').map().on((item, key) => {
        if (item && typeof item === 'object' && !item._ && key !== '_') {
          const existingIndex = items.findIndex(i => i.id === key);
          const newItem = { id: key, ...item };
          
          if (existingIndex >= 0) {
            items[existingIndex] = newItem;
          } else {
            items.push(newItem);
          }
          
          updateStatsFromItems(items);
          
          // Cancel seeding timer if we get data
          if (dataCheckTimer && !hasCheckedForData) {
            clearTimeout(dataCheckTimer);
            hasCheckedForData = true;
            console.log(`✅ Found existing data: ${items.length} items from Gun.js`);
            setLoading(false);
          }
        }
      });

      // Only seed if no data comes in within reasonable time
      dataCheckTimer = setTimeout(() => {
        if (!hasCheckedForData && items.length === 0) {
          hasCheckedForData = true;
          console.log('📊 No existing data found - seeding demo data ONCE...');
          seedDemoData();
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Failed to load real data:', error);
      // Fallback to demo data on error
      seedDemoData();
    }
  };

  const updateStatsFromItems = (items) => {
    const totalItems = items.length;
    const soldItems = items.filter(item => item.status === 'sold').length;
    const pendingListings = items.filter(item => item.status === 'pending' || item.status === 'draft').length;
    const totalValue = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    
    // Items scanned today
    const today = new Date().toDateString();
    const itemsScannedToday = items.filter(item => {
      const itemDate = new Date(item.createdAt || 0).toDateString();
      return itemDate === today;
    }).length;

    setStats({
      totalItems,
      itemsScannedToday,
      totalValue,
      pendingListings,
      soldItems
    });

    // Get recent items
    const recent = items
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 3);
    
    setRecentItems(recent);
    setLoading(false);
  };

  const seedDemoData = async () => {
    if (!gun) return;

    // Double-check we don't already have data before seeding
    let existingItems = 0;
    gun.get('items').map().once((item, key) => {
      if (item && typeof item === 'object' && !item._ && key !== '_') {
        existingItems++;
      }
    });

    // Wait a moment to let the check complete
    setTimeout(() => {
      if (existingItems > 0) {
        console.log(`🚫 Skipping seed - found ${existingItems} existing items`);
        setLoading(false);
        return;
      }

      console.log('🌱 Seeding demo data for beta testing (NO existing data found)...');
      
      const demoItems = [
        {
          name: 'iPhone 14 Pro Max 256GB',
          description: 'Space Black, excellent condition',
          price: 899.99,
          status: 'sold',
          category: 'Electronics',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          aiConfidence: 0.95
        },
        {
          name: 'Nike Air Jordan 1 Retro',
          description: 'Size 10.5, Chicago colorway',
          price: 299.99,
          status: 'listed',
          category: 'Shoes', 
          createdAt: new Date(Date.now() - 43200000).toISOString(),
          aiConfidence: 0.88
        },
        {
          name: 'MacBook Pro M2 14-inch',
          description: '512GB SSD, Space Gray',
          price: 1899.99,
          status: 'pending',
          category: 'Computers',
          createdAt: new Date().toISOString(),
          aiConfidence: 0.92
        }
      ];

      // Store in Gun.js
      demoItems.forEach((item, index) => {
        const key = `demo_${Date.now()}_${index}`;
        gun.get('items').get(key).put(item);
      });

      console.log('✅ Demo data seeded successfully!');
      setLoading(false);
    }, 500);
  };

  const quickActions = [
    {
      title: "Scan New Item",
      subtitle: "Point camera to identify",
      icon: "📸",
      action: () => router.push('/items/scan'),
      gradient: "from-orange-400 to-orange-600",
      primary: true
    },
    {
      title: "My Items",
      subtitle: `${stats.totalItems} total items`,
      icon: "📦", 
      action: () => router.push('/items'),
      gradient: "from-blue-400 to-blue-600"
    },
    {
      title: "Sold Items",
      subtitle: `$${stats.totalValue.toFixed(2)} earned`,
      icon: "💰",
      action: () => router.push('/items?filter=sold'),
      gradient: "from-green-400 to-green-600"
    },
    {
      title: "Seed Demo Data",
      subtitle: "For beta testing",
      icon: "🌱",
      action: seedDemoData,
      gradient: "from-purple-400 to-purple-600"
    }
  ];

  // Recent activity is now derived from Gun.js data in real-time
  const recentActivity = recentItems.map(item => ({
    item: item.name || 'Unknown Item',
    status: item.status === 'sold' ? 'Sold' : 
           item.status === 'listed' ? 'Listed' : 
           item.status === 'pending' ? 'Pending' : 'Draft',
    value: item.price ? `$${parseFloat(item.price).toFixed(2)}` : '—',
    time: getTimeAgo(item.createdAt)
  }));

  // Helper function to format time ago
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const itemTime = new Date(timestamp);
    const diffMs = now - itemTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  // Gun.js helper functions for real database operations
  const addNewItem = async (itemData) => {
    if (!gun) return null;
    
    const key = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const item = {
      ...itemData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    gun.get('items').get(key).put(item);
    console.log('✅ Added new item to Gun.js:', item.name);
    return { id: key, ...item };
  };

  const updateItemStatus = async (itemId, status) => {
    if (!gun || !itemId) return;
    
    gun.get('items').get(itemId).get('status').put(status);
    gun.get('items').get(itemId).get('updatedAt').put(new Date().toISOString());
    console.log(`✅ Updated item ${itemId} status to:`, status);
  };

  const deleteItem = async (itemId) => {
    if (!gun || !itemId) return;
    
    gun.get('items').get(itemId).put(null);
    console.log('🗑️ Deleted item:', itemId);
  };

  return (
    <>
      <Head>
        <title>Dashboard - Simply eBay</title>
        <meta name="description" content="Your AI-powered selling dashboard" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Header */}
        <div className="neumorphic-header p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Simply eBay</h1>
              <p className="text-gray-600">Welcome back, {user?.email?.split('@')[0] || 'there'}!</p>
            </div>
            <div className="flex space-x-4">
              {/* AI Test Chat Button */}
              <button
                onClick={() => setChatOpen(true)}
                className="neumorphic-button-mini w-12 h-12 rounded-full flex items-center justify-center"
              >
                🧠
              </button>
              {/* Settings/Logout */}
              <button
                onClick={logout}
                className="neumorphic-button-mini w-12 h-12 rounded-full flex items-center justify-center"
              >
                👋
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="neumorphic-card p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalItems}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="neumorphic-card p-4 text-center">
              <div className="text-2xl font-bold text-green-600">${stats.totalValue}</div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`neumorphic-card p-6 text-left transition-all duration-300 hover:scale-105 ${
                    action.primary ? 'neumorphic-primary' : ''
                  }`}
                >
                  <div className="text-3xl mb-2">{action.icon}</div>
                  <div className="font-semibold text-gray-800">{action.title}</div>
                  <div className="text-sm text-gray-600">{action.subtitle}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
            <div className="neumorphic-card p-4 space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex justify-between items-center py-2">
                  <div>
                    <div className="font-medium text-gray-800">{activity.item}</div>
                    <div className="text-sm text-gray-600">{activity.status} • {activity.time}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-800">{activity.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="neumorphic-card p-4 bg-gradient-to-r from-blue-50 to-green-50">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🔒</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">100% Private & Local</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Your photos and data stay on your device. AI processing happens locally. 
                  Nothing shared unless you choose to list an item.
                </p>
              </div>
            </div>
          </div>

          {/* Terms & Privacy Links */}
          <div className="text-center space-x-4 text-sm text-gray-500 pb-8">
            <button 
              onClick={() => router.push('/terms')}
              className="underline hover:text-gray-700 transition-colors"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button 
              onClick={() => router.push('/privacy')}
              className="underline hover:text-gray-700 transition-colors"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button 
              onClick={() => router.push('/about')}
              className="underline hover:text-gray-700 transition-colors"
            >
              About
            </button>
          </div>
        </div>

        {/* AI Chat Popup */}
        {chatOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[500px] overflow-hidden animate-scale-up">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">🧠 Simply eBay AI</h3>
                    <p className="text-sm opacity-90">Your local selling assistant</p>
                  </div>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="text-white hover:text-gray-200 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
                    aria-label="Close AI chat"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">👋</span>
                      <span className="font-semibold text-orange-800">Hi there!</span>
                    </div>
                    <p className="text-sm text-orange-700">
                      I'm your local AI assistant, running entirely on your device. I can help you sell more effectively!
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                      <span className="mr-2">🎯</span>
                      What I can help with:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 📸 Identify items from photos instantly</li>
                      <li>• 💰 Research current market prices</li>
                      <li>• ✍️ Write compelling listing descriptions</li>
                      <li>• 📊 Suggest optimal pricing strategies</li>
                      <li>• ❓ Answer eBay selling questions</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">🔒</span>
                      <span className="font-semibold text-green-800">100% Private</span>
                    </div>
                    <p className="text-xs text-green-700">
                      All conversations stay on your device. No data leaves your phone unless you create a listing.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      setChatOpen(false);
                      router.push('/items/scan');
                    }}
                    className="bg-orange-500 text-white px-3 py-3 rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium shadow-md hover:shadow-lg flex items-center justify-center space-x-1"
                  >
                    <span>📸</span>
                    <span>Scan Item</span>
                  </button>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="bg-blue-500 text-white px-3 py-3 rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium shadow-md hover:shadow-lg flex items-center justify-center space-x-1"
                  >
                    <span>💬</span>
                    <span>Full Chat</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Neumorphic CSS Styles */}
        <style jsx>{`
          .neumorphic-header {
            background: linear-gradient(145deg, #f0f0f0, #ffffff);
            box-shadow: 
              20px 20px 60px #d1d1d1,
              -20px -20px 60px #ffffff;
          }
          
          .neumorphic-card {
            background: linear-gradient(145deg, #f8f9fa, #e9ecef);
            box-shadow: 
              8px 8px 16px #d1d1d1,
              -8px -8px 16px #ffffff;
            border-radius: 20px;
          }
          
          .neumorphic-card:hover {
            box-shadow: 
              12px 12px 24px #d1d1d1,
              -12px -12px 24px #ffffff;
          }
          
          .neumorphic-primary {
            background: linear-gradient(145deg, #ff8c42, #ff6b1a);
            color: white;
            box-shadow: 
              8px 8px 16px #d1d1d1,
              -8px -8px 16px #ffffff;
          }
          
          .neumorphic-primary:hover {
            box-shadow: 
              12px 12px 24px #d1d1d1,
              -12px -12px 24px #ffffff;
          }
          
          .neumorphic-button-mini {
            background: linear-gradient(145deg, #f8f9fa, #e9ecef);
            box-shadow: 
              5px 5px 10px #d1d1d1,
              -5px -5px 10px #ffffff;
          }
          
          .neumorphic-button-mini:active {
            box-shadow: 
              inset 5px 5px 10px #d1d1d1,
              inset -5px -5px 10px #ffffff;
          }

          /* Animations */
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
          
          .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
          }
          
          .animate-scale-up {
            animation: scale-up 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </>
  );
}
