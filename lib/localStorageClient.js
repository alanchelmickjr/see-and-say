import Dexie from 'dexie';

// Local IndexedDB database for Simply eBay
class SimplyEbayDB extends Dexie {
  constructor() {
    super('SimplyEbayDB');
    
    this.version(1).stores({
      // User data (simple local auth)
      users: '++id, email, created_at',
      
      // Items with AI recognition data
      items: '++id, user_id, name, category, condition, price, description, confidence, images, created_at, updated_at, ebay_listing_id, status',
      
      // Recognition history for learning
      recognitions: '++id, item_id, image_data, ai_response, confidence, created_at',
      
      // eBay scraped data for price intelligence
      ebay_data: '++id, item_name, category, sold_prices, avg_price, scraped_at, keywords',
      
      // Local settings and preferences
      settings: '++id, key, value, updated_at'
    });
  }
}

const db = new SimplyEbayDB();

// Local storage service that replaces Supabase
class LocalStorageService {
  constructor() {
    this.currentUser = null;
    this.loadCurrentUser();
  }

  // Simple local authentication
  async signUp(email, password) {
    try {
      // Check if user already exists
      const existingUser = await db.users.where('email').equals(email).first();
      if (existingUser) {
        throw new Error('User already exists');
      }

      const user = {
        email,
        password_hash: btoa(password), // Simple base64 encoding (not secure for production)
        created_at: new Date().toISOString()
      };

      const id = await db.users.add(user);
      const newUser = { ...user, id };
      this.currentUser = newUser;
      localStorage.setItem('simply_ebay_user', JSON.stringify(newUser));
      
      return { user: newUser, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  }

  async signIn(email, password) {
    try {
      const user = await db.users.where('email').equals(email).first();
      if (!user || atob(user.password_hash) !== password) {
        throw new Error('Invalid credentials');
      }

      this.currentUser = user;
      localStorage.setItem('simply_ebay_user', JSON.stringify(user));
      
      return { user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('simply_ebay_user');
    return { error: null };
  }

  loadCurrentUser() {
    try {
      const userData = localStorage.getItem('simply_ebay_user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // Items management
  async createItem(itemData) {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      const item = {
        ...itemData,
        user_id: this.currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'draft'
      };

      const id = await db.items.add(item);
      return { ...item, id };
    } catch (error) {
      throw new Error(`Failed to create item: ${error.message}`);
    }
  }

  async getItems(filters = {}) {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      let query = db.items.where('user_id').equals(this.currentUser.id);
      
      if (filters.status) {
        query = query.and(item => item.status === filters.status);
      }

      const items = await query.toArray();
      return items.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    } catch (error) {
      throw new Error(`Failed to fetch items: ${error.message}`);
    }
  }

  async getItem(itemId) {
    try {
      const item = await db.items.get(itemId);
      if (!item || item.user_id !== this.currentUser?.id) {
        throw new Error('Item not found');
      }
      return item;
    } catch (error) {
      throw new Error(`Failed to fetch item: ${error.message}`);
    }
  }

  async updateItem(itemId, updates) {
    try {
      const item = await this.getItem(itemId);
      const updatedItem = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      await db.items.update(itemId, updatedItem);
      return { ...item, ...updatedItem };
    } catch (error) {
      throw new Error(`Failed to update item: ${error.message}`);
    }
  }

  async deleteItem(itemId) {
    try {
      await this.getItem(itemId); // Verify ownership
      await db.items.delete(itemId);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }

  // Recognition history
  async saveRecognition(itemId, imageData, aiResponse, confidence) {
    try {
      const recognition = {
        item_id: itemId,
        image_data: imageData,
        ai_response: aiResponse,
        confidence,
        created_at: new Date().toISOString()
      };

      const id = await db.recognitions.add(recognition);
      return { ...recognition, id };
    } catch (error) {
      throw new Error(`Failed to save recognition: ${error.message}`);
    }
  }

  // eBay data caching for price intelligence
  async cacheEbayData(itemName, category, priceData) {
    try {
      const ebayData = {
        item_name: itemName,
        category,
        sold_prices: priceData.soldPrices || [],
        avg_price: priceData.avgPrice || 0,
        keywords: priceData.keywords || [],
        scraped_at: new Date().toISOString()
      };

      // Check if we already have recent data for this item
      const existing = await db.ebay_data
        .where('item_name').equals(itemName)
        .and(data => {
          const scraped = new Date(data.scraped_at);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return scraped > oneDayAgo;
        })
        .first();

      if (existing) {
        await db.ebay_data.update(existing.id, ebayData);
        return { ...existing, ...ebayData };
      } else {
        const id = await db.ebay_data.add(ebayData);
        return { ...ebayData, id };
      }
    } catch (error) {
      throw new Error(`Failed to cache eBay data: ${error.message}`);
    }
  }

  async getEbayData(itemName) {
    try {
      return await db.ebay_data
        .where('item_name').equals(itemName)
        .first();
    } catch (error) {
      return null;
    }
  }

  // Settings management
  async setSetting(key, value) {
    try {
      const existing = await db.settings.where('key').equals(key).first();
      const settingData = {
        key,
        value: JSON.stringify(value),
        updated_at: new Date().toISOString()
      };

      if (existing) {
        await db.settings.update(existing.id, settingData);
      } else {
        await db.settings.add(settingData);
      }
      
      return true;
    } catch (error) {
      throw new Error(`Failed to save setting: ${error.message}`);
    }
  }

  async getSetting(key, defaultValue = null) {
    try {
      const setting = await db.settings.where('key').equals(key).first();
      return setting ? JSON.parse(setting.value) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  // Database utilities
  async clearAllData() {
    try {
      await db.transaction('rw', [db.users, db.items, db.recognitions, db.ebay_data, db.settings], async () => {
        await db.users.clear();
        await db.items.clear();
        await db.recognitions.clear();
        await db.ebay_data.clear();
        await db.settings.clear();
      });
      
      this.currentUser = null;
      localStorage.removeItem('simply_ebay_user');
      return true;
    } catch (error) {
      throw new Error(`Failed to clear data: ${error.message}`);
    }
  }

  async exportData() {
    try {
      const data = {
        users: await db.users.toArray(),
        items: await db.items.toArray(),
        recognitions: await db.recognitions.toArray(),
        ebay_data: await db.ebay_data.toArray(),
        settings: await db.settings.toArray(),
        exported_at: new Date().toISOString()
      };
      return data;
    } catch (error) {
      throw new Error(`Failed to export data: ${error.message}`);
    }
  }
}

// Create singleton instance
const localStorageService = new LocalStorageService();

export default localStorageService;
export { db };
