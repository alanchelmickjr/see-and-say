# Phase 3: Pseudocode for Inventory Management

This document outlines the pseudocode for the Inventory Management feature in ebay-helper. This covers creating new items (manually, if not via image upload flow initially), viewing, updating, and deleting them.

## 1. Create New Item (Manual Entry)

While image upload is the primary way to add items, a manual fallback or initial creation before image upload might be needed.

**Endpoint:** `POST /api/items`

**Inputs:** `itemName`, `description` (optional), `status` (optional, defaults to "new"), `sessionToken` (Authorization header)

**Outputs:** `newItemRecord` or `error`

```pseudocode
FUNCTION handle_create_manual_item(request):
  // TEST: Request must be authenticated.
  currentUser = get_user_from_session_token(request.headers.Authorization)
  IF NOT currentUser:
    RETURN error_response("Unauthorized", 401)

  // TEST: itemName must be provided in the request body.
  itemName = request.body.itemName
  IF NOT itemName:
    RETURN error_response("Missing itemName", 400)

  description = request.body.description OR ""
  status = request.body.status OR "new" // Default status

  // TEST: Status must be a valid enum value from Item model.
  VALIDATE item_status_enum(status)
  IF validation_fails:
    RETURN error_response("Invalid status value", 400)

  newItemData = {
    userId: currentUser.userId,
    itemName: itemName,
    description: description,
    status: status,
    // suggestedPriceRangeMin/Max, aiRecognizedItem would be null initially
  }

  // TEST: New Item record should be created successfully in the database.
  newItem = create_item_record(newItemData) // Uses Item model
  IF creation_fails:
    LOG_ERROR "Database failed to create manual item for user " + currentUser.userId
    RETURN error_response("Failed to create item", 500)

  // TEST: Successful response includes the new item record.
  RETURN success_response(newItem, 201)
```

## 2. Get User's Inventory Items (List View)

**Endpoint:** `GET /api/items`

**Inputs:** `sessionToken` (Authorization header). Optional query parameters: `status` (filter by status), `searchTerm` (search by name/description), `page`, `limit` (for pagination).

**Outputs:** Array of `Item` records, pagination info, or `error`.

```pseudocode
FUNCTION handle_get_inventory_items(request):
  // TEST: Request must be authenticated.
  currentUser = get_user_from_session_token(request.headers.Authorization)
  IF NOT currentUser:
    RETURN error_response("Unauthorized", 401)

  // --- Filtering and Pagination ---
  filters = { userId: currentUser.userId }
  // TEST: Filtering by status should work if 'status' query param is provided.
  IF request.query.status:
    VALIDATE item_status_enum(request.query.status)
    IF validation_succeeds:
      filters.status = request.query.status
    ELSE:
      RETURN error_response("Invalid status filter value", 400)

  // TEST: Searching by searchTerm should apply to itemName and description.
  searchTerm = request.query.searchTerm OR null

  // TEST: Pagination parameters (page, limit) should be handled correctly.
  page = request.query.page (integer, default 1)
  limit = request.query.limit (integer, default 20, max 100)
  offset = (page - 1) * limit

  // --- Database Query ---
  // TEST: Query should fetch items belonging to the current user, applying filters and search.
  // TEST: Query should include related data like primary image URL for list display.
  queryOptions = {
    filters: filters,
    searchTerm: searchTerm,
    limit: limit,
    offset: offset,
    sortBy: "updatedAt", // Or createdAt, itemName
    sortOrder: "DESC"   // Or ASC
  }
  items = find_items_with_details(queryOptions) // Fetches items and their primary images
  totalItemsCount = count_items(queryOptions)   // Counts total matching items for pagination

  // TEST: Successful response includes items array and pagination metadata.
  paginationInfo = {
    currentPage: page,
    itemsPerPage: limit,
    totalItems: totalItemsCount,
    totalPages: CEIL(totalItemsCount / limit)
  }
  RETURN success_response({ items: items, pagination: paginationInfo }, 200)
```

## 3. Get Single Item Details

**Endpoint:** `GET /api/items/{itemId}`

**Inputs:** `itemId` (path parameter), `sessionToken` (Authorization header)

**Outputs:** Single `Item` record with full details (including all images, price data, listing info if any), or `error`.

```pseudocode
FUNCTION handle_get_single_item(request):
  // TEST: Request must be authenticated.
  currentUser = get_user_from_session_token(request.headers.Authorization)
  IF NOT currentUser:
    RETURN error_response("Unauthorized", 401)

  itemId = request.pathParameters.itemId
  // TEST: itemId must be provided in the path.
  IF NOT itemId:
    RETURN error_response("Missing itemId", 400)

  // TEST: Item must exist and belong to the current user.
  // TEST: Query should fetch the item and all its related data (images, priceData, listing).
  item = find_item_by_id_with_all_relations(itemId, currentUser.userId)
  IF NOT item:
    RETURN error_response("Item not found or access denied", 404)

  // TEST: Successful response includes the full item details.
  RETURN success_response(item, 200)
```

## 4. Update Item Details

**Endpoint:** `PUT /api/items/{itemId}`

**Inputs:** `itemId` (path parameter), `sessionToken` (Authorization header). Request body can contain fields to update (e.g., `itemName`, `description`, `status`, `suggestedPriceRangeMin/Max` if manually adjusted).

**Outputs:** Updated `Item` record or `error`.

```pseudocode
FUNCTION handle_update_item(request):
  // TEST: Request must be authenticated.
  currentUser = get_user_from_session_token(request.headers.Authorization)
  IF NOT currentUser:
    RETURN error_response("Unauthorized", 401)

  itemId = request.pathParameters.itemId
  // TEST: itemId must be provided in the path.
  IF NOT itemId:
    RETURN error_response("Missing itemId", 400)

  // TEST: Item must exist and belong to the current user before updating.
  itemToUpdate = find_item_by_id_and_user_id(itemId, currentUser.userId)
  IF NOT itemToUpdate:
    RETURN error_response("Item not found or access denied for update", 404)

  updateData = {}
  allowedFieldsToUpdate = ["itemName", "description", "status", "suggestedPriceRangeMin", "suggestedPriceRangeMax"]

  FOR EACH field IN allowedFieldsToUpdate:
    IF request.body.has(field):
      updateData[field] = request.body[field]
      // TEST: If 'status' is updated, it must be a valid enum value.
      IF field == "status":
        VALIDATE item_status_enum(request.body.status)
        IF validation_fails:
          RETURN error_response("Invalid status value for update", 400)
      // TEST: If price range is updated, min <= max.
      IF field == "suggestedPriceRangeMin" AND request.body.has("suggestedPriceRangeMax"):
        IF request.body.suggestedPriceRangeMin > request.body.suggestedPriceRangeMax:
          RETURN error_response("Price range min cannot exceed max", 400)
      ELIF field == "suggestedPriceRangeMax" AND request.body.has("suggestedPriceRangeMin"):
         IF request.body.suggestedPriceRangeMin > request.body.suggestedPriceRangeMax:
          RETURN error_response("Price range min cannot exceed max", 400)


  IF IS_EMPTY(updateData):
    RETURN error_response("No valid fields provided for update", 400)

  updateData.updatedAt = NOW() // Ensure updatedAt timestamp is refreshed

  // TEST: Item record should be updated successfully in the database.
  updatedItem = update_item_record_in_db(itemId, updateData) // Merges with existing record
  IF update_failed:
    LOG_ERROR "Database failed to update item " + itemId
    RETURN error_response("Failed to update item", 500)

  // TEST: Successful response includes the updated item record.
  RETURN success_response(updatedItem, 200)
```

## 5. Delete Item

**Endpoint:** `DELETE /api/items/{itemId}`

**Inputs:** `itemId` (path parameter), `sessionToken` (Authorization header)

**Outputs:** Success message or `error`.

```pseudocode
FUNCTION handle_delete_item(request):
  // TEST: Request must be authenticated.
  currentUser = get_user_from_session_token(request.headers.Authorization)
  IF NOT currentUser:
    RETURN error_response("Unauthorized", 401)

  itemId = request.pathParameters.itemId
  // TEST: itemId must be provided in the path.
  IF NOT itemId:
    RETURN error_response("Missing itemId", 400)

  // TEST: Item must exist and belong to the current user before deleting.
  itemToDelete = find_item_by_id_and_user_id(itemId, currentUser.userId)
  IF NOT itemToDelete:
    RETURN error_response("Item not found or access denied for deletion", 404)

  // --- Cascade Deletion / Cleanup ---
  // TEST: Associated images in cloud storage should be deleted.
  itemImages = find_images_for_item(itemId)
  FOR EACH image IN itemImages:
    delete_image_from_cloud(image.storageUrl) // Needs actual filename/key from URL
    delete_image_record_from_db(image.imageId)

  // TEST: Associated PriceData records should be deleted.
  delete_price_data_for_item_from_db(itemId)

  // TEST: Associated Listing record should be handled (e.g., if active on eBay, it might need to be ended first or marked locally).
  // For simplicity, we'll assume local deletion. Ending live eBay listings is a separate, complex operation.
  // If an eBay listing exists, this might just "archive" the item locally or prevent deletion if live.
  // For now:
  delete_listing_record_for_item_from_db(itemId)


  // TEST: Item record should be deleted successfully from the database.
  result = delete_item_record_from_db(itemId)
  IF deletion_fails:
    LOG_ERROR "Database failed to delete item " + itemId
    RETURN error_response("Failed to delete item", 500)

  // TEST: Successful response confirms deletion.
  RETURN success_response({ message: "Item deleted successfully" }, 200) // Or 204 No Content
```

## Helper Functions (Conceptual)

```pseudocode
FUNCTION get_user_from_session_token(authHeader): // (Covered)
FUNCTION create_item_record(data): // (Covered in manual create)
FUNCTION find_item_by_id_and_user_id(itemId, userId): // (Covered)
FUNCTION update_item_record_in_db(itemId, dataToUpdate): // (Covered)
FUNCTION delete_item_record_from_db(itemId): // DB delete operation
FUNCTION validate_item_status_enum(status): // Checks against Item.status enum

FUNCTION find_items_with_details(queryOptions):
  // DB query for items, joining with primary image. Handles filters, search, pagination, sorting.
  // TEST: Returns array of item objects.

FUNCTION count_items(queryOptions):
  // DB query to count items matching filters/search.
  // TEST: Returns integer.

FUNCTION find_item_by_id_with_all_relations(itemId, userId):
  // DB query for a single item, joining with Images, PriceData, Listing tables.
  // Ensures item belongs to userId.
  // TEST: Returns full item object or null.

FUNCTION find_images_for_item(itemId): // (Covered in eBay Listing)
FUNCTION delete_image_from_cloud(storageUrlOrKey): // (Covered in Image Upload)
FUNCTION delete_image_record_from_db(imageId): // DB delete operation
FUNCTION delete_price_data_for_item_from_db(itemId): // DB delete operation
FUNCTION delete_listing_record_for_item_from_db(itemId): // DB delete operation
```

This completes the pseudocode for the core features. The next steps would involve validation, suggesting specific technologies/APIs, and then moving to architecture design.