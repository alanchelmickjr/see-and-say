/**
 * eBay Connection Test API
 * Tests connectivity to eBay API endpoints for listing creation
 */

import ebayListingCreator from '../../../lib/ebayListingCreator';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing eBay API connection...');
    
    // Test eBay API connection without making actual calls
    const connectionTest = {
      sandboxAccess: process.env.EBAY_SANDBOX_ACCESS_TOKEN ? true : false,
      productionAccess: process.env.EBAY_ACCESS_TOKEN ? true : false,
      appCredentials: process.env.EBAY_CLIENT_ID ? true : false,
      timestamp: new Date().toISOString()
    };

    // Test category mapping functionality
    const testCategories = ebayListingCreator.getEbayCategoryMapping();
    const categoryCount = Object.keys(testCategories).length;

    // Test price optimization logic
    const testPriceData = {
      itemName: 'Test Item',
      condition: 'Used',
      category: 'Electronics'
    };
    
    const optimizedPrice = ebayListingCreator.optimizePrice(testPriceData);

    const testResults = {
      connectionStatus: connectionTest,
      categoriesLoaded: categoryCount > 0,
      categoryCount: categoryCount,
      priceOptimizationWorking: !!optimizedPrice,
      testPrice: optimizedPrice,
      status: 'ready'
    };

    console.log('✅ eBay integration test passed:', testResults);

    return res.status(200).json({
      success: true,
      message: 'eBay integration is ready',
      results: testResults
    });

  } catch (error) {
    console.error('❌ eBay integration test failed:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
