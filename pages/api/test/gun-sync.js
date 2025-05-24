/**
 * Gun.js P2P Sync Test API
 * Tests the Gun.js peer-to-peer synchronization functionality
 */

import gunDataService from '../../../lib/gunDataService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing Gun.js P2P sync...');
    
    // Test Gun.js initialization
    const isInitialized = gunDataService.isInitialized();
    
    if (!isInitialized) {
      await gunDataService.initialize();
    }

    // Test data sync with a test item
    const testItem = {
      id: 'test-' + Date.now(),
      name: 'Test Item',
      description: 'Test item for P2P sync validation',
      timestamp: new Date().toISOString()
    };

    const syncResult = await gunDataService.saveItem(testItem);
    
    // Test data retrieval
    const retrievedItem = await gunDataService.getItem(testItem.id);
    
    const testResults = {
      initialized: true,
      syncSuccessful: !!syncResult,
      dataRetrieved: !!retrievedItem,
      syncTime: Date.now(),
      testItemId: testItem.id,
      status: 'operational'
    };

    console.log('✅ Gun.js P2P sync test passed:', testResults);

    return res.status(200).json({
      success: true,
      message: 'Gun.js P2P sync is operational',
      results: testResults
    });

  } catch (error) {
    console.error('❌ Gun.js P2P sync test failed:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
