# Phase 3: Pseudocode for Pricing Engine

This document outlines the pseudocode for the Pricing Engine feature in ebay-helper.

## 1. Trigger Price Suggestion

**Endpoint:** `POST /api/items/{itemId}/suggest-price`

**Inputs:** `itemId` (path parameter), `sessionToken` (Authorization header)
Optionally, `keywords` or `identifiedItemName` from `item.aiRecognizedItem` can be used if not relying solely on `item.itemName`.

**Outputs:** Updated `Item` record with `suggestedPriceRangeMin`, `suggestedPriceRangeMax`, and new `PriceData` entries, or `error`.

```pseudocode
FUNCTION handle_price_suggestion_request(request):
  // TEST: Request must be authenticated.
  currentUser = get_user_from_session_token(request.headers.Authorization)
  IF NOT currentUser:
    RETURN error_response("Unauthorized", 401)

  itemId = request.pathParameters.itemId
  // TEST: itemId must be provided in the path.
  IF NOT itemId:
    RETURN error_response("Missing itemId", 400)

  // TEST: Item specified by itemId must exist and belong to the current user.
  item = find_item_by_id_and_user_id(itemId, currentUser.userId)
  IF NOT item:
    RETURN error_response("Item not found or access denied", 404)

  // Determine search query: use AI recognized name, user's item name, or a combination.
  searchQuery = item.aiRecognizedItem.suggestedName OR item.itemName
  IF NOT searchQuery:
    RETURN error_response("Item name not available for price search", 400)

  allPriceDataPoints = []

  // --- Fetch data from eBay ---
  // TEST: eBay API integration should be configurable and handle API keys securely.
  TRY:
    ebayConfig = get_ebay_api_configuration() // Reads from env vars
    // TEST: Fetching active eBay listings should work and handle API errors.
    activeEbayListings = fetch_active_ebay_listings(searchQuery, ebayConfig, {condition: "used", limit: 20})
    FOR EACH listing IN activeEbayListings:
      priceData = transform_ebay_listing_to_price_data(listing, "ebay_active", itemId)
      add_price_data_point(allPriceDataPoints, priceData)
      // TEST: PriceData record should be created for each fetched eBay active listing.
      create_price_data_record(priceData)


    // TEST: Fetching sold eBay listings should work and handle API errors.
    soldEbayListings = fetch_sold_ebay_listings(searchQuery, ebayConfig, {condition: "used", limit: 20})
    FOR EACH listing IN soldEbayListings:
      priceData = transform_ebay_listing_to_price_data(listing, "ebay_sold", itemId)
      add_price_data_point(allPriceDataPoints, priceData)
      // TEST: PriceData record should be created for each fetched eBay sold listing.
      create_price_data_record(priceData)

  CATCH exception (e.g., EbayApiError, ConfigurationError):
    LOG_ERROR "eBay API call failed for item " + itemId + ": " + exception.message
    // Continue if possible, or return partial results/error based on strategy

  // --- Fetch data from other web sources (Conceptual) ---
  // This is highly complex and provider-dependent. Example: Google Shopping.
  // TEST: Integration with other pricing sources should be modular.
  TRY:
    otherSourcesConfig = get_other_sources_configuration() // e.g., Google Shopping API, scrapers
    IF otherSourcesConfig.googleShopping.enabled:
      googleShoppingListings = fetch_google_shopping_listings(searchQuery, otherSourcesConfig.googleShopping, {limit: 10})
      FOR EACH listing IN googleShoppingListings:
        priceData = transform_google_listing_to_price_data(listing, "google_shopping", itemId)
        add_price_data_point(allPriceDataPoints, priceData)
        // TEST: PriceData record should be created for each fetched Google Shopping listing.
        create_price_data_record(priceData)
  CATCH exception (e.g., ScraperBlockedError, ApiError):
    LOG_WARNING "Other source fetching failed for item " + itemId + ": " + exception.message
    // Continue with available data

  // --- Calculate Price Range ---
  // TEST: Price suggestion algorithm should handle cases with no data or few data points.
  IF allPriceDataPoints.length < 3: // Arbitrary threshold for meaningful range
    LOG_WARNING "Not enough data points to suggest a reliable price for item " + itemId
    // Optionally, update item with a note or don't update price range
    // RETURN error_response("Not enough pricing data found", 404) or partial success
    // For now, let's proceed but the range might be wide or based on defaults.
    suggestedRange = {min: 0, max: 0, note: "Insufficient data"}
  ELSE:
    // TEST: Price suggestion algorithm should correctly calculate min/max based on collected data.
    // Consider filtering outliers, weighting sold items more, etc.
    suggestedRange = calculate_suggested_price_range(allPriceDataPoints)


  // --- Update Item Record ---
  updateData = {
    suggestedPriceRangeMin: suggestedRange.min,
    suggestedPriceRangeMax: suggestedRange.max,
    // Potentially add a timestamp for when the price was last suggested
    priceLastSuggestedAt: NOW()
  }
  // TEST: Item record should be updated successfully with the new price range.
  updatedItem = update_item_record(itemId, updateData)
  IF update_failed:
    LOG_ERROR "Failed to update item " + itemId + " with price range."
    RETURN error_response("Failed to save price range to item", 500)

  // TEST: Successful response includes the updated item record and collected price points.
  RETURN success_response({item: updatedItem, collectedPricePoints: allPriceDataPoints}, 200)

```

## Helper Functions (Conceptual)

```pseudocode
FUNCTION get_user_from_session_token(authHeader):
  // (Covered in Auth pseudocode)

FUNCTION find_item_by_id_and_user_id(itemId, userId):
  // (Covered in Image Upload pseudocode)

FUNCTION get_ebay_api_configuration():
  // Reads eBay API credentials (App ID, Cert ID, Dev ID, token) and endpoint from env vars.
  // TEST: Returns config object or throws ConfigurationError.

FUNCTION fetch_active_ebay_listings(query, config, options):
  // Calls eBay Finding API (findItemsAdvanced or findItemsByKeywords).
  // Filters by condition, item specifics if available.
  // TEST: Returns array of listing objects or throws EbayApiError.

FUNCTION fetch_sold_ebay_listings(query, config, options):
  // Calls eBay Finding API (findCompletedItems).
  // Filters by `soldItemsOnly=true`.
  // TEST: Returns array of listing objects or throws EbayApiError.

FUNCTION transform_ebay_listing_to_price_data(ebayListing, sourceName, itemId):
  // Maps fields from eBay API response to PriceData model structure.
  // Extracts price, currency, condition, URL, etc.
  // TEST: Returns a valid PriceData object.
  RETURN {
    itemId: itemId,
    source: sourceName, // "ebay_active" or "ebay_sold"
    price: ebayListing.sellingStatus.currentPrice.value,
    currency: ebayListing.sellingStatus.currentPrice.currencyId,
    observedAt: NOW(),
    sourceUrl: ebayListing.viewItemURL,
    metadata: {
      condition: ebayListing.condition.conditionDisplayName,
      ebayItemId: ebayListing.itemId
      // Add other relevant fields like sellerInfo, shippingCost if available and useful
    }
  }

FUNCTION add_price_data_point(collection, priceData):
  // Appends priceData to the collection.
  // TEST: Collection size increases.

FUNCTION create_price_data_record(priceData):
  // Inserts new PriceData record into database.
  // TEST: Returns new PriceData object or error.

FUNCTION get_other_sources_configuration():
  // Reads configs for other APIs (e.g., Google Shopping Content API) or scraper settings.
  // TEST: Returns config object.

FUNCTION fetch_google_shopping_listings(query, config, options):
  // Placeholder for Google Shopping API call or a web scraper.
  // This is complex due to API access or anti-scraping measures.
  // TEST: Returns array of listing-like objects.

FUNCTION transform_google_listing_to_price_data(googleListing, sourceName, itemId):
  // Maps fields from Google Shopping source to PriceData model.
  // TEST: Returns a valid PriceData object.

FUNCTION calculate_suggested_price_range(priceDataPoints):
  // Algorithm to determine min/max price.
  // Simple version:
  //   Filter out extreme outliers (e.g., top/bottom 5%).
  //   min = MIN(remaining prices from "sold" items, or overall if few sold)
  //   max = MAX(remaining prices from "sold" items, or overall if few sold)
  //   Adjust based on active listing prices if sold data is sparse.
  // More complex: consider condition, recency, statistical measures (e.g., interquartile range).
  // TEST: Returns {min: Decimal, max: Decimal, note: String (optional)}.
  // Example (very basic):
  prices = priceDataPoints.map(p => p.price)
  IF prices.length == 0: RETURN {min: 0, max: 0, note: "No prices found"}
  sortedPrices = prices.sort_numeric()
  // Remove outliers (e.g., 10% from each end if enough data)
  numToRemove = floor(sortedPrices.length * 0.1)
  IF sortedPrices.length > (2 * numToRemove + 2): // Ensure we don't remove everything
      trimmedPrices = sortedPrices.slice(numToRemove, sortedPrices.length - numToRemove)
  ELSE:
      trimmedPrices = sortedPrices
  
  IF trimmedPrices.length == 0: RETURN {min: MIN(sortedPrices), max: MAX(sortedPrices), note: "Few data points"}

  rangeMin = MIN(trimmedPrices)
  rangeMax = MAX(trimmedPrices)
  RETURN {min: rangeMin, max: rangeMax}


FUNCTION update_item_record(itemId, dataToUpdate):
  // Updates item in DB. (Covered previously)
```

## Web Scraping Considerations:
- **Legality/Ethics:** Always respect `robots.txt`. Be mindful of terms of service.
- **Reliability:** Scrapers are brittle and break when website structures change.
- **IP Blocking/CAPTCHAs:** Websites actively try to prevent scraping.
- **Alternatives:** Prefer official APIs (like eBay's) whenever available. For other sources, consider if a paid data provider API exists.

This pseudocode focuses on API-first for eBay and conceptually for others, acknowledging the challenges of web scraping.