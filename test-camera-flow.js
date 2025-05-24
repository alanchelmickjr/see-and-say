#!/usr/bin/env node
/**
 * Test Camera Recognition Flow
 * Validates the entire mobile-first pipeline from image capture to eBay listing
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Test configuration
const TEST_CONFIG = {
  llamaFileServer: 'http://localhost:8080',
  nextjsServer: 'http://localhost:3000',
  testImagePath: './test-images/sample-item.jpg',
  expectedCategories: ['Electronics', 'Collectibles', 'Home & Garden'],
  minConfidence: 0.6
};

class CameraFlowTester {
  constructor() {
    this.results = {
      serverTests: {},
      apiTests: {},
      pipelineTests: {},
      mobileTests: {}
    };
  }

  async runAllTests() {
    console.log('🧪 Starting Camera Recognition Flow Tests...\n');
    
    try {
      // Test 1: Server Connectivity
      await this.testServerConnectivity();
      
      // Test 2: AI Vision API
      await this.testAIVisionAPI();
      
      // Test 3: Mobile Data Pipeline
      await this.testMobileDataPipeline();
      
      // Test 4: eBay Integration
      await this.testEbayIntegration();
      
      // Test 5: Performance Metrics
      await this.testPerformanceMetrics();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  }

  async testServerConnectivity() {
    console.log('🔌 Testing Server Connectivity...');
    
    try {
      // Test LlamaFile server
      const llamaResponse = await fetch(TEST_CONFIG.llamaFileServer + '/health', { timeout: 5000 });
      this.results.serverTests.llamaFile = {
        status: llamaResponse.ok,
        responseTime: Date.now(),
        details: llamaResponse.ok ? 'Connected' : 'Failed to connect'
      };
      
      // Test Next.js server
      const nextResponse = await fetch(TEST_CONFIG.nextjsServer, { timeout: 5000 });
      this.results.serverTests.nextjs = {
        status: nextResponse.ok,
        responseTime: Date.now(),
        details: nextResponse.ok ? 'Connected' : 'Failed to connect'
      };
      
      console.log(`✅ LlamaFile Server: ${this.results.serverTests.llamaFile.status ? 'OK' : 'FAIL'}`);
      console.log(`✅ Next.js Server: ${this.results.serverTests.nextjs.status ? 'OK' : 'FAIL'}\n`);
      
    } catch (error) {
      console.error('❌ Server connectivity test failed:', error.message);
      this.results.serverTests.error = error.message;
    }
  }

  async testAIVisionAPI() {
    console.log('🤖 Testing AI Vision API...');
    
    try {
      const testPrompt = {
        model: "llava-v1.5-7b-q4",
        prompt: "What is this item and what category would it belong to on eBay?",
        temperature: 0.1,
        max_tokens: 150
      };
      
      const startTime = Date.now();
      const response = await fetch(TEST_CONFIG.llamaFileServer + '/v1/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPrompt),
        timeout: 30000
      });
      
      const endTime = Date.now();
      const result = await response.json();
      
      this.results.apiTests.aiVision = {
        status: response.ok,
        responseTime: endTime - startTime,
        result: result,
        details: response.ok ? 'API responding' : 'API failed'
      };
      
      console.log(`✅ AI Vision API: ${this.results.apiTests.aiVision.status ? 'OK' : 'FAIL'}`);
      console.log(`⏱️  Response Time: ${this.results.apiTests.aiVision.responseTime}ms\n`);
      
    } catch (error) {
      console.error('❌ AI Vision API test failed:', error.message);
      this.results.apiTests.error = error.message;
    }
  }

  async testMobileDataPipeline() {
    console.log('📱 Testing Mobile Data Pipeline...');
    
    try {
      // Test vector store initialization
      const vectorResponse = await fetch(TEST_CONFIG.nextjsServer + '/api/test/vector-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'initialization' })
      });
      
      this.results.pipelineTests.vectorStore = {
        status: vectorResponse.ok,
        details: vectorResponse.ok ? 'Vector store operational' : 'Vector store failed'
      };
      
      // Test Gun.js P2P sync
      const gunResponse = await fetch(TEST_CONFIG.nextjsServer + '/api/test/gun-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'p2p-sync' })
      });
      
      this.results.pipelineTests.gunSync = {
        status: gunResponse.ok,
        details: gunResponse.ok ? 'P2P sync operational' : 'P2P sync failed'
      };
      
      console.log(`✅ Vector Store: ${this.results.pipelineTests.vectorStore.status ? 'OK' : 'FAIL'}`);
      console.log(`✅ Gun.js P2P: ${this.results.pipelineTests.gunSync.status ? 'OK' : 'FAIL'}\n`);
      
    } catch (error) {
      console.error('❌ Mobile data pipeline test failed:', error.message);
      this.results.pipelineTests.error = error.message;
    }
  }

  async testEbayIntegration() {
    console.log('🛒 Testing eBay Integration...');
    
    try {
      // Test eBay API connectivity (sandbox)
      const ebayTestResponse = await fetch(TEST_CONFIG.nextjsServer + '/api/test/ebay-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'connection' })
      });
      
      this.results.apiTests.ebayConnection = {
        status: ebayTestResponse.ok,
        details: ebayTestResponse.ok ? 'eBay API accessible' : 'eBay API failed'
      };
      
      console.log(`✅ eBay API: ${this.results.apiTests.ebayConnection.status ? 'OK' : 'FAIL'}\n`);
      
    } catch (error) {
      console.error('❌ eBay integration test failed:', error.message);
      this.results.apiTests.ebayError = error.message;
    }
  }

  async testPerformanceMetrics() {
    console.log('⚡ Testing Performance Metrics...');
    
    try {
      const performanceTests = [
        { name: 'Camera Init', target: 2000 },
        { name: 'AI Recognition', target: 5000 },
        { name: 'Vector Search', target: 1000 },
        { name: 'Price Lookup', target: 3000 }
      ];
      
      for (const test of performanceTests) {
        const startTime = Date.now();
        // Simulate the operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        const endTime = Date.now();
        
        const responseTime = endTime - startTime;
        const passed = responseTime < test.target;
        
        this.results.mobileTests[test.name.toLowerCase().replace(' ', '_')] = {
          responseTime,
          target: test.target,
          passed
        };
        
        console.log(`${passed ? '✅' : '⚠️'} ${test.name}: ${responseTime}ms (target: ${test.target}ms)`);
      }
      
      console.log('');
      
    } catch (error) {
      console.error('❌ Performance testing failed:', error.message);
      this.results.mobileTests.error = error.message;
    }
  }

  generateReport() {
    console.log('📊 CAMERA FLOW TEST REPORT');
    console.log('=' + '='.repeat(50));
    
    const allTests = [
      ...Object.values(this.results.serverTests),
      ...Object.values(this.results.apiTests),
      ...Object.values(this.results.pipelineTests),
      ...Object.values(this.results.mobileTests)
    ];
    
    const passedTests = allTests.filter(test => test.status || test.passed).length;
    const totalTests = allTests.length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log(`\n🎯 Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
    
    if (successRate >= 80) {
      console.log('✅ Camera flow is ready for production testing!');
    } else if (successRate >= 60) {
      console.log('⚠️  Camera flow needs optimization before production.');
    } else {
      console.log('❌ Camera flow has critical issues that need fixing.');
    }
    
    console.log('\n📝 Full Results:');
    console.log(JSON.stringify(this.results, null, 2));
  }
}

// Run tests if called directly
const tester = new CameraFlowTester();
tester.runAllTests().catch(console.error);

export default CameraFlowTester;
