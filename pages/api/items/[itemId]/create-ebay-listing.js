// pages/api/items/[itemId]/create-ebay-listing.js
import { supabase } from '../../../../lib/supabaseClient'; // Adjusted path
import { getApiConfig, addItem } from '../../../../lib/ebayApi'; // To be created

// Helper function stubs (as per pseudocode, to be defined or moved to utils)
function mapItemStatusToEbayCondition(itemStatus) {
  // Maps internal status (e.g. from AI or user) to eBay condition string.
  // TEST: Returns "Used", "New", "For parts or not working", etc.
  if (itemStatus === 'new_with_tags' || itemStatus === 'new_without_tags' || itemStatus === 'new_open_box') return "New";
  // Add more specific mappings as needed
  return "Used"; // Default
}

function determineEbayCategory(aiData, itemName) {
  // Complex: Map AI categories/keywords or item name to specific eBay CategoryID.
  // May involve calling eBay GetSuggestedCategories API or a local mapping table.
  // TEST: Returns a valid eBay CategoryID string. For now, placeholder.
  console.log('Determining eBay category for:', aiData, itemName); // Placeholder
  return "175672"; // Example: Cell Phones & Smartphones category
}

function mapConditionToEbayConditionId(conditionString) {
  // Maps "Used" to 3000, "New" to 1000, etc. (eBay specific Condition IDs)
  // TEST: Returns integer ID.
  if (conditionString === "New") return 1000;
  return 3000; // Default to Used
}

function calculateShippingCost(item) {
  // Placeholder for shipping calculation logic or user input.
  // TEST: Returns a decimal value.
  console.log('Calculating shipping for item:', item.id); // Placeholder
  return 5.99; // Example flat rate
}

function constructEbayListingUrl(ebayListingId) {
  // e.g., "https://www.ebay.com/itm/" + ebayListingId
  // TEST: Returns valid URL string.
  if (!ebayListingId) return null;
  return `https://www.ebay.com/itm/${ebayListingId}`;
}


/**
 * @swagger
 * /api/items/{itemId}/create-ebay-listing:
 *   post:
 *     summary: Creates a draft eBay listing for an item.
 *     description: Authenticates the user, gathers item details, constructs an eBay API payload, calls the eBay Trading API to create a listing, and stores the listing details.
 *     tags:
 *       - eBay Listing
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         description: The ID of the item to list on eBay.
 *         schema:
 *           type: string
 *           format: uuid
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: eBay listing created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 localListing:
 *                   $ref: '#/components/schemas/Listing'
 *                 ebayListingId:
 *                   type: string
 *                 ebayListingUrl:
 *                   type: string
 *       400:
 *         description: Bad request (e.g., missing item ID, item name, image, or price).
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Item not found or access denied.
 *       409:
 *         description: Item already has an active/draft listing.
 *       500:
 *         description: Internal server error or error creating local listing record.
 *       502:
 *         description: Bad Gateway (eBay API call failed).
 *       503:
 *         description: Service Unavailable (eBay API interaction failed).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { itemId } = req.query;

  if (!itemId) {
    return res.status(400).json({ message: 'Missing itemId' });
  }

  // 1. Authenticate user
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or malformed' });
  }
  const token = authHeader.split('Bearer ')[1];
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return res.status(401).json({ message: userError?.message || 'Unauthorized' });
  }

  try {
    // 2. Fetch item and verify ownership, include user profile for PayPal email and location
    const { data: itemData, error: itemError } = await supabase
      .from('items')
      .select(`
        *,
        images (*),
        user:users (paypal_email, location) 
      `)
      .eq('id', itemId)
      .eq('user_id', user.id)
      .single();

    if (itemError || !itemData) {
      return res.status(404).json({ message: itemError?.message || 'Item not found or access denied' });
    }
    
    // Supabase returns user data nested under 'user' if joined like that.
    // If 'users' is the table name and you aliased it to 'user', then itemData.user should be correct.
    // If not, you might need to fetch user profile separately or adjust the query.
    // For now, assuming itemData.user contains { paypal_email, location }

    // 3. Check for existing listing
    const { data: existingListing, error: existingListingError } = await supabase
      .from('listings')
      .select('id, ebay_listing_id')
      .eq('item_id', itemId)
      .in('status', ['active', 'draft'])
      .maybeSingle();

    if (existingListingError) {
      console.error('Error checking for existing listing:', existingListingError);
      return res.status(500).json({ message: 'Error checking for existing listing: ' + existingListingError.message });
    }

    if (existingListing) {
      return res.status(409).json({ message: `Item already has an active/draft listing: ${existingListing.ebay_listing_id}` });
    }

    // 4. Gather data for eBay listing
    const listingTitle = itemData.name || itemData.ai_recognized_item?.suggestedName;
    if (!listingTitle) {
      return res.status(400).json({ message: 'Item name is required for eBay listing' });
    }

    let listingDescription = itemData.description || `Generated description based on AI recognition: ${itemData.ai_recognized_item?.summary}`;
    if (!listingDescription) {
      listingDescription = listingTitle; // Fallback
    }
    
    const itemImages = itemData.images;
    if (!itemImages || itemImages.length === 0) {
      return res.status(400).json({ message: 'At least one image is required for eBay listing' });
    }

    const listingPrice = itemData.suggested_price_min;
    if (listingPrice == null || listingPrice <= 0) {
      return res.status(400).json({ message: 'Valid item price is required for eBay listing' });
    }
    
    const itemCondition = mapItemStatusToEbayCondition(itemData.status); 
    const ebayCategoryId = determineEbayCategory(itemData.ai_recognized_item, itemData.name);
    const conditionID = mapConditionToEbayConditionId(itemCondition);

    // 5. Prepare eBay API Payload
    const userPaypalEmail = itemData.user?.paypal_email || process.env.EBAY_DEFAULT_PAYPAL_EMAIL || 'fallback_paypal@example.com';
    const userLocation = itemData.user?.location || 'USA';

    const ebayApiPayload = {
      Item: {
        Title: listingTitle,
        Description: listingDescription,
        PrimaryCategory: { CategoryID: ebayCategoryId },
        StartPrice: listingPrice.toString(),
        Currency: "USD",
        ConditionID: conditionID,
        Country: "US", // eBay site country
        Location: userLocation, // Item location
        DispatchTimeMax: 3, // Handling time in days
        PaymentMethods: "PayPal", // Common requirement
        PayPalEmailAddress: userPaypalEmail,
        PictureDetails: {
          PictureURL: itemImages.map(img => img.storage_url) // Array of public URLs
        },
        ReturnPolicy: {
          ReturnsAcceptedOption: "ReturnsAccepted",
          RefundOption: "MoneyBack",
          ReturnsWithinOption: "Days_30",
          ShippingCostPaidByOption: "Buyer"
        },
        ShippingDetails: {
          ShippingType: "Flat", // Or Calculated
          ShippingServiceOptions: {
            ShippingServicePriority: 1,
            ShippingService: "USPSPriority", // Example, make configurable
            ShippingServiceCost: calculateShippingCost(itemData).toString() // Example
          }
        },
        ListingDuration: "GTC", // Good 'Til Cancelled is common for fixed price
        // Site: "US" // Required by Trading API, usually 0 for US or based on user's eBay site
      }
    };
    
    // 6. Call eBay API
    const userEbayAuthToken = process.env.EBAY_USER_OAUTH_TOKEN_PLACEHOLDER; 
    if (!userEbayAuthToken) {
        console.error('EBAY_USER_OAUTH_TOKEN_PLACEHOLDER environment variable is not set.');
        return res.status(500).json({ message: 'eBay user token configuration missing. Cannot proceed with eBay API call.' });
    }

    const ebayApiConfig = getApiConfig(userEbayAuthToken); // This will get AppID, DevID, CertID, ServerURL
    let ebayApiResponse;
    try {
        ebayApiResponse = await addItem(ebayApiPayload, ebayApiConfig); // addItem is the actual API call function
    } catch (apiError) {
        console.error('eBay addItem API call failed:', apiError);
        return res.status(503).json({ message: `eBay API interaction failed: ${apiError.message}` });
    }

    // 7. Process eBay API Response
    let newEbayListingId, newEbayListingUrl, newListingStatus;

    if (ebayApiResponse.Ack === "Success" || ebayApiResponse.Ack === "Warning") {
      newEbayListingId = ebayApiResponse.ItemID;
      newEbayListingUrl = constructEbayListingUrl(newEbayListingId);
      newListingStatus = "active"; // Or "draft" if API indicates, AddItem usually makes it active
      if (ebayApiResponse.Ack === "Warning") {
        console.warn("eBay AddItem successful with warnings: ", ebayApiResponse.Errors);
      }
    } else {
      console.error("eBay AddItem API failed: ", ebayApiResponse.Errors);
      const errorMessage = ebayApiResponse.Errors?.[0]?.ShortMessage || "Unknown eBay API error.";
      return res.status(502).json({ message: `Failed to create eBay listing: ${errorMessage}` });
    }

    // 8. Create local Listing record
    const newListingData = {
      item_id: itemId,
      user_id: user.id,
      ebay_listing_id: newEbayListingId,
      title: listingTitle,
      description: listingDescription,
      price: listingPrice,
      currency: "USD",
      condition: itemCondition,
      category_ebay_id: ebayCategoryId,
      listing_url: newEbayListingUrl,
      status: newListingStatus,
      // expires_at: from ebayApiResponse if available and relevant
    };

    const { data: newLocalListing, error: localListingError } = await supabase
      .from('listings')
      .insert(newListingData)
      .select()
      .single();

    if (localListingError) {
      console.error('Failed to create local listing record:', localListingError);
      // Critical: eBay listing might be live/drafted but local record failed. Needs reconciliation.
      return res.status(500).json({ message: `eBay listing created (ID: ${newEbayListingId}), but local record failed. Please check. Error: ${localListingError.message}` });
    }

    // 9. Update Item status
    const { error: updateItemError } = await supabase
      .from('items')
      .update({ status: 'listed_on_ebay' })
      .eq('id', itemId);

    if (updateItemError) {
      console.error('Failed to update item status:', updateItemError);
      // Non-critical for the response, but log it.
    }

    // 10. Return success response
    return res.status(201).json({
      localListing: newLocalListing,
      ebayListingId: newEbayListingId,
      ebayListingUrl: newEbayListingUrl,
    });

  } catch (error) {
    console.error('Error in create-ebay-listing handler:', error);
    return res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
}