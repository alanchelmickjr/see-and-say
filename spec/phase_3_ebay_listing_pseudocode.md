# Phase 3: Pseudocode for eBay Listing Preparation

This document outlines the pseudocode for the eBay Listing Preparation feature in ebay-helper.

## 1. Create eBay Listing Draft

**Endpoint:** `POST /api/items/{itemId}/create-ebay-listing`

**Inputs:** `itemId` (path parameter), `sessionToken` (Authorization header)
Optionally, the request body could contain overrides or additional details for the eBay listing if not all are to be pulled from the `Item` record (e.g., specific eBay category, listing duration, return policy). For simplicity, we'll assume most data comes from the `Item` and its related entities.

**Outputs:** `newListingRecord` (local `Listing` model) and potentially `ebayDraftListingId`, or `error`.

```pseudocode
FUNCTION handle_create_ebay_listing_request(request):
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

  // TEST: Item should not already have an active or draft listing to prevent duplicates.
  existingListing = find_active_or_draft_listing_for_item(itemId)
  IF existingListing:
    RETURN error_response("Item already has an active/draft listing: " + existingListing.listingId, 409) // Conflict

  // --- Gather all necessary data for the eBay listing ---
  // TEST: Item name must be available.
  listingTitle = item.itemName OR item.aiRecognizedItem.suggestedName
  IF NOT listingTitle:
    RETURN error_response("Item name is required for eBay listing", 400)

  // TEST: Item description must be available.
  listingDescription = item.description OR "Generated description based on AI recognition: " + item.aiRecognizedItem.summary
  IF NOT listingDescription:
    listingDescription = listingTitle // Fallback

  // TEST: Item must have at least one image.
  itemImages = find_images_for_item(itemId) // Array of Image records
  IF itemImages.length == 0:
    RETURN error_response("At least one image is required for eBay listing", 400)
  
  // TEST: Item must have a suggested price (or user-defined price).
  listingPrice = item.suggestedPriceRangeMin // Or an average, or a user-confirmed price.
  IF listingPrice IS NULL OR listingPrice <= 0:
    RETURN error_response("Valid item price is required for eBay listing", 400)

  // Other details: condition, eBay category (this is complex, might need user input or smart mapping from AI)
  itemCondition = map_item_status_to_ebay_condition(item.status) // e.g., "Used", "New"
  ebayCategoryId = determine_ebay_category(item.aiRecognizedItem, item.itemName) // This is a significant sub-problem.

  // --- Prepare payload for eBay API (e.g., AddItem call from Trading API) ---
  // TEST: eBay API payload should be correctly structured according to eBay's requirements.
  ebayApiPayload = {
    Item: {
      Title: listingTitle,
      Description: listingDescription,
      PrimaryCategory: { CategoryID: ebayCategoryId },
      StartPrice: listingPrice,
      Currency: "USD", // Should be configurable
      ConditionID: map_condition_to_ebay_condition_id(itemCondition), // e.g., 1000 for New, 3000 for Used
      Country: "US", // Should be configurable
      Location: currentUser.defaultLocation OR "USA", // User profile might have this
      DispatchTimeMax: 3, // Handling time, configurable
      PaymentMethods: ["PayPal"], // Configurable, PayPal often required
      PayPalEmailAddress: currentUser.paypalEmail, // User profile
      PictureDetails: {
        PictureURL: itemImages.map(img => img.storageUrl) // eBay might have limits or prefer self-hosting
      },
      ReturnPolicy: { // Example, should be configurable by user
        ReturnsAcceptedOption: "ReturnsAccepted",
        RefundOption: "MoneyBack",
        ReturnsWithinOption: "Days_30",
        ShippingCostPaidByOption: "Buyer"
      },
      ShippingDetails: { // Example, highly configurable
        ShippingType: "Flat",
        ShippingServiceOptions: {
          ShippingServicePriority: 1,
          ShippingService: "USPSPriority",
          ShippingServiceCost: calculate_shipping_cost() // Another complex sub-problem or user input
        }
      },
      ListingDuration: "Days_7", // Configurable
      // ... other required and optional fields
    }
  }

  // --- Call eBay API to create draft or publish listing ---
  // TEST: eBay API integration should be configurable and handle OAuth tokens securely.
  TRY:
    ebayTradingApiConfig = get_ebay_trading_api_configuration(currentUser.ebayAuthToken) // User-specific token
    // For a draft, some APIs might have a "VerifyAddItem" first, then "AddItem".
    // Or, create as a full listing but in a "scheduled" or "draft" state if API supports.
    // Let's assume AddItem creates it directly or as a draft that can be revised.
    // TEST: eBay API call should handle network errors and API-specific errors gracefully.
    ebayApiResponse = call_ebay_add_item_api(ebayApiPayload, ebayTradingApiConfig)

    IF ebayApiResponse.Ack == "Success" OR ebayApiResponse.Ack == "Warning":
      ebayListingId = ebayApiResponse.ItemID
      ebayListingUrl = construct_ebay_listing_url(ebayListingId) // Helper based on eBay site
      listingStatus = "active" // Or "draft" if API indicates
      IF ebayApiResponse.Ack == "Warning":
        LOG_WARNING "eBay AddItem successful with warnings: " + ebayApiResponse.Errors.join(", ")
    ELSE:
      LOG_ERROR "eBay AddItem API failed: " + ebayApiResponse.Errors.join(", ")
      RETURN error_response("Failed to create eBay listing: " + ebayApiResponse.Errors[0].ShortMessage, 502) // Bad Gateway

  CATCH exception (e.g., EbayApiError, TokenExpiredError, ConfigurationError):
    LOG_ERROR "eBay Trading API call failed for item " + itemId + ": " + exception.message
    RETURN error_response("eBay API interaction failed: " + exception.message, 503)

  // --- Create local Listing record ---
  newListingData = {
    itemId: itemId,
    userId: currentUser.userId,
    ebayListingId: ebayListingId,
    title: listingTitle,
    description: listingDescription,
    price: listingPrice,
    currency: "USD",
    condition: itemCondition,
    categoryEbayId: ebayCategoryId,
    listingUrl: ebayListingUrl,
    status: listingStatus, // "active", "draft", "error"
    // expiresAt: from ebayApiResponse if available
  }
  // TEST: Local Listing record should be created successfully.
  newLocalListing = create_listing_record(newListingData)
  IF creation_fails:
    LOG_ERROR "Failed to create local listing record for eBay ID " + ebayListingId
    // Critical: eBay listing is live/drafted but local record failed. Needs reconciliation strategy.
    RETURN error_response("eBay listing created, but local record failed. Please check.", 500)

  // --- Update Item status ---
  // TEST: Item status should be updated to 'listed_on_ebay'.
  update_item_record(itemId, { status: "listed_on_ebay" })

  // TEST: Successful response includes the new local listing record and eBay listing ID/URL.
  RETURN success_response({ localListing: newLocalListing, ebayListingId: ebayListingId, ebayListingUrl: ebayListingUrl }, 201)

```

## Helper Functions (Conceptual)

```pseudocode
FUNCTION get_user_from_session_token(authHeader): // (Covered)
FUNCTION find_item_by_id_and_user_id(itemId, userId): // (Covered)

FUNCTION find_active_or_draft_listing_for_item(itemId):
  // DB query: SELECT * FROM Listings WHERE itemId = ? AND status IN ('active', 'draft') LIMIT 1
  // TEST: Returns listing object or null.

FUNCTION find_images_for_item(itemId):
  // DB query: SELECT * FROM Images WHERE itemId = ? ORDER BY isPrimary DESC, uploadedAt ASC
  // TEST: Returns array of image objects.

FUNCTION map_item_status_to_ebay_condition(itemStatus): // Simplified
  // Maps internal status (e.g. from AI or user) to eBay condition string.
  // TEST: Returns "Used", "New", "For parts or not working", etc.

FUNCTION determine_ebay_category(aiData, itemName):
  // Complex: Map AI categories/keywords or item name to specific eBay CategoryID.
  // May involve calling eBay GetSuggestedCategories API or a local mapping table.
  // TEST: Returns a valid eBay CategoryID string. For now, placeholder.
  RETURN "175672" // Example: Cell Phones & Smartphones category

FUNCTION map_condition_to_ebay_condition_id(conditionString):
  // Maps "Used" to 3000, "New" to 1000, etc. (eBay specific Condition IDs)
  // TEST: Returns integer ID.
  IF conditionString == "New": RETURN 1000
  ELSE: RETURN 3000 // Default to Used

FUNCTION calculate_shipping_cost():
  // Placeholder for shipping calculation logic or user input.
  // TEST: Returns a decimal value.
  RETURN 5.00 // Example flat rate

FUNCTION get_ebay_trading_api_configuration(userEbayAuthToken):
  // Reads eBay App ID, Cert ID, Dev ID, API endpoint from env vars.
  // Uses the user-specific eBay OAuth token for the call.
  // TEST: Returns config object or throws ConfigurationError.

FUNCTION call_ebay_add_item_api(payload, config):
  // Makes a call to eBay Trading API's AddItem (or AddFixedPriceItem, etc.).
  // Handles XML request/response format and eBay-specific headers (X-EBAY-API-SITEID, X-EBAY-API-COMPATIBILITY-LEVEL, etc.).
  // TEST: Returns parsed eBay API response object or throws EbayApiError.

FUNCTION construct_ebay_listing_url(ebayListingId):
  // e.g., "https://www.ebay.com/itm/" + ebayListingId
  // TEST: Returns valid URL string.

FUNCTION create_listing_record(data):
  // Inserts new record into local Listings table.
  // TEST: Returns new listing object or error.

FUNCTION update_item_record(itemId, dataToUpdate): // (Covered)
```

## Key Considerations for eBay API:
- **API Choice:** Trading API is powerful but older (XML-based). Newer RESTful APIs (like Sell API) might be preferred for new development if they cover all needed features (e.g., draft creation, full listing details). This pseudocode leans towards Trading API concepts due to its comprehensiveness.
- **Authentication:** User-specific OAuth tokens are required for listing on their behalf. Secure storage and refresh mechanisms for these tokens are vital.
- **Error Handling:** eBay API responses can be complex, with multiple errors or warnings. Robust parsing is needed.
- **Rate Limits:** Be mindful of API call limits.
- **Sandbox:** Extensive testing in eBay's sandbox environment is crucial before going live.