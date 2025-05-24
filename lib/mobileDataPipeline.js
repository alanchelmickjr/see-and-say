import gunDataService from './gunDataService';
import localVectorStore from './localVectorStore';

/**
 * Mobile-First Data Pipeline for Simply eBay
 * Orchestrates Gun.js P2P sync, local vector storage, and AI recognition
 */
class MobileDataPipeline {
  constructor() {
    this.isInitialized = false;
    this.recognitionQueue = [];
    this.processingQueue = false;
    this.syncStats = {
      itemsSynced: 0,
      vectorsStored: 0,
      peersConnected: 0
    };
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Mobile-First Data Pipeline...');
      
      // Initialize vector store for AI similarity
      await localVectorStore.initialize();
      
      // Enable Gun.js offline mode
      gunDataService.enableOfflineMode();
      
      // Setup periodic sync status updates
      this.setupSyncMonitoring();
      
      this.isInitialized = true;
      console.log('✅ Mobile Data Pipeline initialized successfully');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to initialize data pipeline:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process AI recognition result and sync across all storage layers
   */
  async processRecognitionResult(recognitionData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const {
        itemName,
        category,
        condition,
        suggestedPrice,
        description,
        confidence,
        imageData,
        rawResponse
      } = recognitionData;

      // 1. Create item in Gun.js for P2P sync
      let gunItem = null;
      if (gunDataService.getCurrentUser()) {
        gunItem = gunDataService.createItem({
          name: itemName,
          category,
          condition,
          price: suggestedPrice,
          description,
          confidence,
          images: [imageData],
          status: 'recognized',
          source: 'ai_recognition'
        });

        // Store recognition metadata
        gunDataService.storeRecognition(gunItem.id, {
          ai_response: rawResponse,
          confidence,
          image_data: imageData,
          model: 'llava_v1.5_7b'
        });

        this.syncStats.itemsSynced++;
      }

      // 2. Generate and store vector embedding
      const itemId = gunItem?.id || Date.now().toString();
      await this.storeVectorEmbedding(itemId, imageData, {
        itemName,
        category,
        price: suggestedPrice,
        condition,
        confidence
      });

      // 3. Find similar items using vector search
      const similarItems = await this.findSimilarItems(imageData, 3);

      // 4. Enhanced pricing intelligence
      const priceInsights = await this.generatePriceInsights(itemName, category, similarItems);

      // 5. eBay category optimization
      const optimizedCategory = this.optimizeEbayCategory(category, itemName);

      return {
        success: true,
        item: gunItem,
        similarItems,
        priceInsights,
        optimizedCategory,
        stats: this.getSyncStats()
      };

    } catch (error) {
      console.error('❌ Error processing recognition result:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Store vector embedding with metadata
   */
  async storeVectorEmbedding(itemId, imageData, metadata) {
    try {
      // Create image element for vector generation
      const img = new Image();
      
      return new Promise((resolve, reject) => {
        img.onload = async () => {
          try {
            const embedding = await localVectorStore.generateImageEmbedding(img);
            localVectorStore.storeVector(itemId, embedding, {
              ...metadata,
              timestamp: Date.now(),
              source: 'ai_recognition'
            });
            
            this.syncStats.vectorsStored++;
            resolve(embedding);
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = reject;
        img.src = imageData;
      });
    } catch (error) {
      console.warn('Vector embedding failed:', error);
      return null;
    }
  }

  /**
   * Find similar items using vector similarity
   */
  async findSimilarItems(imageData, limit = 5) {
    try {
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = async () => {
          try {
            const queryEmbedding = await localVectorStore.generateImageEmbedding(img);
            const similar = localVectorStore.findSimilar(queryEmbedding, limit, 0.6);
            resolve(similar);
          } catch (error) {
            console.warn('Similarity search failed:', error);
            resolve([]);
          }
        };
        
        img.onerror = () => resolve([]);
        img.src = imageData;
      });
    } catch (error) {
      console.warn('Similar items search failed:', error);
      return [];
    }
  }

  /**
   * Generate pricing insights from similar items and market data
   */
  async generatePriceInsights(itemName, category, similarItems = []) {
    try {
      const insights = {
        suggestedRange: null,
        marketTrend: 'stable',
        confidence: 0.5,
        reasoning: [],
        similarPrices: []
      };

      // Extract prices from similar items
      if (similarItems.length > 0) {
        const prices = similarItems
          .map(item => this.extractPriceValue(item.metadata.price))
          .filter(price => price > 0);
        
        if (prices.length > 0) {
          const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          
          insights.suggestedRange = {
            min: Math.round(minPrice * 0.9),
            max: Math.round(maxPrice * 1.1),
            avg: Math.round(avgPrice)
          };
          
          insights.confidence = Math.min(0.9, 0.5 + (prices.length * 0.1));
          insights.reasoning.push(`Based on ${prices.length} similar items`);
          insights.similarPrices = prices;
        }
      }

      // Category-based pricing rules
      const categoryMultipliers = {
        'Electronics': 1.2,
        'Collectibles': 1.5,
        'Clothing': 0.8,
        'Books': 0.6,
        'Home & Garden': 1.0
      };

      if (categoryMultipliers[category]) {
        const multiplier = categoryMultipliers[category];
        if (insights.suggestedRange) {
          insights.suggestedRange.min = Math.round(insights.suggestedRange.min * multiplier);
          insights.suggestedRange.max = Math.round(insights.suggestedRange.max * multiplier);
          insights.suggestedRange.avg = Math.round(insights.suggestedRange.avg * multiplier);
        }
        insights.reasoning.push(`${category} category adjustment applied`);
      }

      return insights;
    } catch (error) {
      console.warn('Price insights generation failed:', error);
      return { suggestedRange: null, confidence: 0, reasoning: ['Price analysis unavailable'] };
    }
  }

  /**
   * Extract numeric price value from price string
   */
  extractPriceValue(priceString) {
    if (!priceString) return 0;
    
    // Extract first number from price string like "$10-25" or "$15.99"
    const match = priceString.match(/\$?(\d+(?:\.\d{2})?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Optimize eBay category for better listing performance
   */
  optimizeEbayCategory(aiCategory, itemName) {
    const categoryMappings = {
      'Electronics': {
        ebayId: 293,
        path: 'Consumer Electronics',
        keywords: ['phone', 'laptop', 'tablet', 'camera', 'headphones']
      },
      'Clothing': {
        ebayId: 11450,
        path: 'Clothing, Shoes & Accessories',
        keywords: ['shirt', 'pants', 'dress', 'shoes', 'jacket']
      },
      'Home & Garden': {
        ebayId: 11700,
        path: 'Home & Garden',
        keywords: ['furniture', 'decor', 'kitchen', 'garden', 'tools']
      },
      'Collectibles': {
        ebayId: 1,
        path: 'Collectibles',
        keywords: ['vintage', 'antique', 'rare', 'limited', 'collectible']
      },
      'Books': {
        ebayId: 267,
        path: 'Books',
        keywords: ['book', 'novel', 'textbook', 'magazine', 'manual']
      }
    };

    const mapping = categoryMappings[aiCategory];
    if (!mapping) {
      return { category: aiCategory, ebayId: null, confidence: 0.5 };
    }

    // Check if item name contains category-specific keywords
    const itemNameLower = itemName.toLowerCase();
    const keywordMatches = mapping.keywords.filter(keyword => 
      itemNameLower.includes(keyword)
    ).length;

    const confidence = Math.min(0.9, 0.6 + (keywordMatches * 0.1));

    return {
      category: mapping.path,
      ebayId: mapping.ebayId,
      confidence,
      originalCategory: aiCategory,
      keywordMatches
    };
  }

  /**
   * Setup monitoring for sync statistics
   */
  setupSyncMonitoring() {
    setInterval(() => {
      // Update peer count and other stats
      this.updateSyncStats();
    }, 10000); // Every 10 seconds
  }

  updateSyncStats() {
    // This would connect to Gun.js peer monitoring
    // For now, simulate basic stats
    this.syncStats.peersConnected = Math.floor(Math.random() * 3); // 0-2 peers
  }

  getSyncStats() {
    return {
      ...this.syncStats,
      lastUpdated: Date.now(),
      isOnline: navigator.onLine,
      vectorsInStorage: localVectorStore.getAllVectors().length
    };
  }

  /**
   * Export data for backup or migration
   */
  async exportData() {
    try {
      const userItems = gunDataService.getCurrentUser() ? 
        await gunDataService.getUserItems() : [];
      
      const vectors = localVectorStore.getAllVectors();
      
      return {
        timestamp: Date.now(),
        user: gunDataService.getCurrentUser(),
        items: userItems,
        vectors: vectors.map(v => ({
          id: v.id,
          metadata: v.metadata
          // Exclude actual vector data for size
        })),
        stats: this.getSyncStats()
      };
    } catch (error) {
      console.error('Data export failed:', error);
      return null;
    }
  }

  /**
   * Clear all local data (for testing or reset)
   */
  async clearAllData() {
    try {
      localVectorStore.clear();
      // Note: Gun.js data persists in P2P network
      console.log('✅ Local data cleared');
      return { success: true };
    } catch (error) {
      console.error('Data clearing failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const mobileDataPipeline = new MobileDataPipeline();
export default mobileDataPipeline;
