/**
 * Vector Store Test API
 * Tests the local vector store functionality for mobile data pipeline
 */

import localVectorStore from '../../../lib/localVectorStore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing vector store initialization...');
    
    // Test vector store initialization
    const isInitialized = await localVectorStore.initialize();
    
    if (!isInitialized) {
      throw new Error('Vector store failed to initialize');
    }

    // Test embedding generation
    const testEmbedding = await localVectorStore.generateEmbedding('test item description');
    
    if (!testEmbedding || testEmbedding.length === 0) {
      throw new Error('Embedding generation failed');
    }

    // Test vector search
    const searchResults = await localVectorStore.findSimilarItems(testEmbedding, 5);
    
    const testResults = {
      initialized: true,
      embeddingSize: testEmbedding.length,
      searchResultsCount: searchResults.length,
      timestamp: new Date().toISOString(),
      status: 'operational'
    };

    console.log('✅ Vector store test passed:', testResults);

    return res.status(200).json({
      success: true,
      message: 'Vector store is operational',
      results: testResults
    });

  } catch (error) {
    console.error('❌ Vector store test failed:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
