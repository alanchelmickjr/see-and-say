import { supabase } from '../../../../lib/supabaseClient';
import axios from 'axios';
// Ensure you have your eBay App ID in your environment variables
const EBAY_APP_ID = process.env.EBAY_APP_ID;

// Helper function to call eBay Finding API
async function searchEbayListings(keyword, searchType = 'findCompletedItems') {
    const endpoint = 'https://svcs.ebay.com/services/search/FindingService/v1';
    const params = {
        'OPERATION-NAME': searchType,
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': EBAY_APP_ID,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': '',
        'keywords': keyword,
        'paginationInput.entriesPerPage': '25', // Fetch a reasonable number of listings
        'sortOrder': 'PricePlusShippingLowest', // Example sort order
    };

    if (searchType === 'findCompletedItems') {
        params['itemFilter(0).name'] = 'SoldItemsOnly';
        params['itemFilter(0).value'] = 'true';
    }

    try {
        const response = await axios.get(endpoint, { params });
        if (response.data && response.data[`${searchType}Response`]?.[0]?.ack?.[0] === 'Success') {
            return response.data[`${searchType}Response`]?.[0]?.searchResult?.[0]?.item || [];
        }
        console.error(`eBay API Error (${searchType}):`, response.data);
        return [];
    } catch (error) {
        console.error(`Error calling eBay API (${searchType}) for keyword "${keyword}":`, error.response ? error.response.data : error.message);
        throw new Error(`Failed to fetch data from eBay for ${searchType}`);
    }
}

// Helper function to calculate price range
function calculatePriceRange(completedItems, activeItems) {
    const soldPrices = completedItems
        .map(item => parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__))
        .filter(price => !isNaN(price) && price > 0);

    const activePrices = activeItems
        .map(item => parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__))
        .filter(price => !isNaN(price) && price > 0);
    
    if (soldPrices.length === 0 && activePrices.length === 0) {
        return { min: null, max: null, avg: null };
    }

    // Basic logic: use sold prices if available, otherwise active.
    // More sophisticated logic can be added here (e.g., weighted averages, outlier removal)
    const pricesToConsider = soldPrices.length > 0 ? soldPrices : activePrices;
    pricesToConsider.sort((a, b) => a - b);

    const minPrice = pricesToConsider[0] || null;
    const maxPrice = pricesToConsider[pricesToConsider.length - 1] || null;
    const avgPrice = pricesToConsider.length > 0 
        ? (pricesToConsider.reduce((sum, price) => sum + price, 0) / pricesToConsider.length).toFixed(2) 
        : null;

    return { 
        min: minPrice ? parseFloat(minPrice.toFixed(2)) : null, 
        max: maxPrice ? parseFloat(maxPrice.toFixed(2)) : null,
        avg: avgPrice ? parseFloat(avgPrice) : null
    };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const { itemId } = req.query;

    // 1. Authenticate user (get user from session/token)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error('Authentication error:', userError);
        return res.status(401).json({ message: 'Authentication required.' });
    }

    try {
        // 2. Fetch item details from DB
        const { data: item, error: itemError } = await supabase
            .from('items')
            .select('id, user_id, item_name, ai_recognized_name')
            .eq('id', itemId)
            .single();

        if (itemError || !item) {
            console.error(`Error fetching item ${itemId}:`, itemError);
            return res.status(404).json({ message: 'Item not found.' });
        }

        // 3. Verify user owns the item
        if (item.user_id !== user.id) {
            return res.status(403).json({ message: 'You are not authorized to modify this item.' });
        }

        // 4. Determine search keyword
        const searchKeyword = item.ai_recognized_name || item.item_name;
        if (!searchKeyword) {
            return res.status(400).json({ message: 'Item name is required to suggest a price.' });
        }

        // 5. Call eBay Finding API
        const [completedItems, activeItems] = await Promise.all([
            searchEbayListings(searchKeyword, 'findCompletedItems'),
            searchEbayListings(searchKeyword, 'findItemsAdvanced')
        ]);
        
        if (completedItems.length === 0 && activeItems.length === 0) {
            await supabase
                .from('items')
                .update({
                    price_suggestion_last_updated_at: new Date().toISOString(),
                    suggested_price_range_min: null,
                    suggested_price_range_max: null,
                    // Potentially add a status field like 'no_ebay_data_found'
                })
                .eq('id', itemId);
            return res.status(200).json({ message: 'No relevant listings found on eBay to suggest a price.', item_id: itemId, suggested_price_range_min: null, suggested_price_range_max: null });
        }

        // 6. Process eBay API response and store PriceData
        const priceDataToInsert = [];
        const processEbayItem = (ebayItem, type) => {
            const price = parseFloat(ebayItem.sellingStatus?.[0]?.currentPrice?.[0]?.__value__);
            if (!isNaN(price) && price > 0) {
                priceDataToInsert.push({
                    item_id: itemId,
                    source: 'ebay',
                    listing_id: ebayItem.itemId?.[0],
                    listing_title: ebayItem.title?.[0],
                    price: price,
                    currency: ebayItem.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'],
                    condition_id: ebayItem.condition?.[0]?.conditionId?.[0],
                    condition_display_name: ebayItem.condition?.[0]?.conditionDisplayName?.[0],
                    listing_type: type, // 'completed' or 'active'
                    listing_url: ebayItem.viewItemURL?.[0],
                    fetched_at: new Date().toISOString(),
                });
            }
        };

        completedItems.forEach(it => processEbayItem(it, 'completed'));
        activeItems.forEach(it => processEbayItem(it, 'active'));

        if (priceDataToInsert.length > 0) {
            const { error: priceDataError } = await supabase.from('price_data').insert(priceDataToInsert);
            if (priceDataError) {
                console.error(`Error inserting price data for item ${itemId}:`, priceDataError);
                // Continue, but log the error. Price suggestion can still proceed.
            }
        }
        
        // 7. Calculate suggested price range
        const { min: suggestedPriceRangeMin, max: suggestedPriceRangeMax, avg: suggestedPriceAvg } = calculatePriceRange(completedItems, activeItems);

        // 8. Update Item record in DB
        const updatePayload = {
            suggested_price_range_min: suggestedPriceRangeMin,
            suggested_price_range_max: suggestedPriceRangeMax,
            // We could also store suggestedPriceAvg if the model supports it
            price_suggestion_last_updated_at: new Date().toISOString(),
        };

        const { data: updatedItem, error: updateError } = await supabase
            .from('items')
            .update(updatePayload)
            .eq('id', itemId)
            .select()
            .single();

        if (updateError) {
            console.error(`Error updating item ${itemId} with price suggestion:`, updateError);
            return res.status(500).json({ message: 'Failed to update item with price suggestion.' });
        }

        // 9. Return success response
        return res.status(200).json({ 
            message: 'Price suggestion successful.', 
            item: updatedItem 
        });

    } catch (error) {
        console.error('Error in suggest-price API:', error);
        return res.status(500).json({ message: error.message || 'Internal server error during price suggestion.' });
    }
}