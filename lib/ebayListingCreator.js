/**
 * eBay Listing Creator - Convert AI recognition results to eBay listings
 * Handles automatic price optimization, category mapping, and listing creation
 */

class EbayListingCreator {
  constructor() {
    this.apiUrl = '/api/items';
    this.categoryMappings = {
      // AI categories to eBay category IDs
      'Electronics': 293,
      'Clothing': 11450,
      'Home & Garden': 11700,
      'Toys & Hobbies': 220,
      'Books': 267,
      'Health & Beauty': 26395,
      'Sports': 888,
      'Automotive': 6000,
      'Collectibles': 1
    };
  }

  async createListingFromRecognition(recognitionData, options = {}) {
    try {
      const listing = this.buildListingData(recognitionData, options);
      
      // Save to Gun.js first for offline support
      const itemData = await this.saveToDataPipeline(listing);
      
      // Then attempt eBay listing creation
      if (options.publishToEbay) {
        const ebayResult = await this.publishToEbay(listing);
        listing.ebayListingId = ebayResult.listingId;
        listing.ebayUrl = ebayResult.url;
      }
      
      return {
        success: true,
        item: listing,
        itemId: itemData.id,
        published: !!options.publishToEbay
      };
    } catch (error) {
      console.error('Failed to create listing:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  buildListingData(recognition, options) {
    const {
      itemName,
      suggestedPrice,
      category,
      condition,
      description,
      imageData,
      confidence
    } = recognition;

    // Parse price from AI suggestion
    const priceRange = this.parsePrice(suggestedPrice);
    const optimizedPrice = this.optimizePrice(priceRange, category);

    // Generate enhanced description
    const enhancedDescription = this.generateDescription(
      itemName,
      description,
      condition,
      confidence
    );

    // Map to eBay category
    const ebayCategory = this.categoryMappings[category] || this.categoryMappings['Other'] || 293;

    return {
      title: this.optimizeTitle(itemName),
      description: enhancedDescription,
      price: optimizedPrice,
      condition: this.mapCondition(condition),
      category: category,
      ebayCategoryId: ebayCategory,
      images: imageData ? [imageData] : [],
      tags: this.generateTags(itemName, category),
      aiConfidence: confidence || 0.75,
      status: options.publishToEbay ? 'active' : 'draft',
      createdBy: 'ai_recognition',
      timestamp: new Date().toISOString()
    };
  }

  parsePrice(priceString) {
    if (!priceString) return { min: 5, max: 20 };
    
    // Extract numbers from price string like "$10-25" or "$15"
    const numbers = priceString.match(/\d+(\.\d{2})?/g);
    if (!numbers) return { min: 5, max: 20 };
    
    if (numbers.length === 1) {
      const price = parseFloat(numbers[0]);
      return { min: price * 0.8, max: price * 1.2 };
    }
    
    return {
      min: parseFloat(numbers[0]),
      max: parseFloat(numbers[1]) || parseFloat(numbers[0]) * 1.5
    };
  }

  optimizePrice(priceRange, category) {
    // Apply category-specific pricing strategies
    const categoryMultipliers = {
      'Electronics': 1.1,
      'Collectibles': 1.3,
      'Books': 0.8,
      'Clothing': 0.9
    };
    
    const multiplier = categoryMultipliers[category] || 1.0;
    const basePrice = (priceRange.min + priceRange.max) / 2;
    
    // Round to reasonable increments
    let optimizedPrice = basePrice * multiplier;
    
    if (optimizedPrice < 10) {
      optimizedPrice = Math.round(optimizedPrice * 2) / 2; // Round to $0.50
    } else if (optimizedPrice < 100) {
      optimizedPrice = Math.round(optimizedPrice); // Round to $1
    } else {
      optimizedPrice = Math.round(optimizedPrice / 5) * 5; // Round to $5
    }
    
    return Math.max(optimizedPrice, 0.99); // Minimum $0.99
  }

  optimizeTitle(itemName) {
    // eBay title optimization (80 character limit)
    let title = itemName || 'Vintage Item';
    
    // Add compelling keywords
    const keywords = ['Rare', 'Vintage', 'Excellent', 'Perfect', 'Amazing'];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    
    if (title.length < 60) {
      title = `${randomKeyword} ${title}`;
    }
    
    // Ensure under 80 characters
    return title.substring(0, 80).trim();
  }

  generateDescription(itemName, aiDescription, condition, confidence) {
    const confidenceText = confidence > 0.8 ? 'High accuracy' : confidence > 0.6 ? 'Good accuracy' : 'AI assisted';
    
    return `
🔍 AI-Identified Item: ${itemName}

📝 DESCRIPTION:
${aiDescription || 'Carefully inspected and ready for a new home.'}

✅ CONDITION: ${condition || 'Good'}
🤖 AI Analysis: ${confidenceText} identification
📦 Fast shipping with careful packaging
💯 Satisfaction guaranteed

Perfect for collectors, enthusiasts, or anyone looking for quality items at great prices!

#eBayFinds #QualityItems #FastShipping
    `.trim();
  }

  mapCondition(aiCondition) {
    const conditionMap = {
      'new': 'Brand New',
      'excellent': 'Like New',
      'good': 'Very Good',
      'fair': 'Good',
      'poor': 'Acceptable',
      'used': 'Very Good'
    };
    
    return conditionMap[aiCondition?.toLowerCase()] || 'Very Good';
  }

  generateTags(itemName, category) {
    const baseTags = ['quality', 'fast-shipping', 'ai-verified'];
    const categoryTags = {
      'Electronics': ['tech', 'gadget', 'electronic'],
      'Clothing': ['fashion', 'style', 'apparel'],
      'Books': ['reading', 'literature', 'collection'],
      'Collectibles': ['rare', 'vintage', 'collectible']
    };
    
    const specificTags = categoryTags[category] || [];
    const itemTags = itemName?.toLowerCase().split(' ').slice(0, 3) || [];
    
    return [...baseTags, ...specificTags, ...itemTags].slice(0, 10);
  }

  async saveToDataPipeline(listing) {
    // Import dynamically to avoid SSR issues
    if (typeof window !== 'undefined') {
      const mobileDataPipeline = await import('../../lib/mobileDataPipeline').then(m => m.default);
      return mobileDataPipeline.createItem(listing);
    }
    return { id: Date.now().toString() };
  }

  async publishToEbay(listing) {
    // This would integrate with eBay API
    // For now, return mock success
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          listingId: `ebay_${Date.now()}`,
          url: `https://ebay.com/itm/mock-${Date.now()}`,
          success: true
        });
      }, 1000);
    });
  }

  /**
   * Get eBay category mappings
   */
  getEbayCategoryMapping() {
    return this.categoryMappings;
  }

  /**
   * Optimize price based on item data and market conditions
   */
  optimizePrice(itemData) {
    try {
      const basePrice = itemData.suggestedPrice || 10;
      const condition = itemData.condition || 'Used';
      const category = itemData.category || 'Other';
      
      // Basic price optimization logic
      let optimizedPrice = basePrice;
      
      // Condition adjustments
      if (condition === 'New') {
        optimizedPrice *= 1.2;
      } else if (condition === 'Poor') {
        optimizedPrice *= 0.6;
      }
      
      // Category adjustments
      if (category === 'Electronics') {
        optimizedPrice *= 1.1; // Electronics hold value better
      } else if (category === 'Collectibles') {
        optimizedPrice *= 1.3; // Collectibles often appreciate
      }
      
      // Round to reasonable price points
      return Math.round(optimizedPrice * 100) / 100;
    } catch (error) {
      console.warn('Price optimization failed:', error);
      return 10.00; // Default fallback price
    }
  }

  // Quick listing with minimal user input
  async quickList(recognitionData) {
    return this.createListingFromRecognition(recognitionData, {
      publishToEbay: false, // Draft first
      optimize: true
    });
  }

  // Full listing with eBay publication
  async fullList(recognitionData, userOverrides = {}) {
    const mergedData = { ...recognitionData, ...userOverrides };
    return this.createListingFromRecognition(mergedData, {
      publishToEbay: true,
      optimize: true
    });
  }
}

// Export singleton instance
const ebayListingCreator = new EbayListingCreator();
export default ebayListingCreator;
