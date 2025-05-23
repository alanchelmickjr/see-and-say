# Phase 3: Pseudocode for Image Capture & Upload

This document outlines the pseudocode for the Image Capture & Upload feature in ebay-helper.

## 1. Client-Side: Image Selection & Upload Trigger

**Context:** User is on an item creation/editing page.

```pseudocode
// In a mobile-first UI component (e.g., React, Vue, Svelte)

FUNCTION handle_select_image_button_press():
  // TEST: Opens native camera or file picker.
  selectedFiles = open_image_picker(allowMultiple: true, sourceType: ["camera", "gallery"])

  IF selectedFiles AND selectedFiles.length > 0:
    FOR EACH file IN selectedFiles:
      // TEST: Each selected file should be validated for type and size on client-side before upload.
      IF is_valid_image_file(file, {maxSizeMB: 5, allowedTypes: ["jpeg", "png", "webp"]}):
        // TEST: A preview of the selected image should be displayed to the user.
        display_image_preview(file)
        // TEST: Upload process should be initiated for each valid file.
        upload_image_to_server(file, currentItemId, currentUser.sessionToken)
      ELSE:
        // TEST: User should be notified if a file is invalid (type/size).
        show_error_message("Invalid file: " + file.name + ". Max 5MB, JPEG/PNG/WEBP only.")
  ELSE:
    // TEST: No action if user cancels image selection.
    LOG "User cancelled image selection."

FUNCTION upload_image_to_server(file, itemId, sessionToken):
  // TEST: FormData should be correctly constructed with the file and itemId.
  formData = CREATE FormData()
  formData.append("imageFile", file)
  formData.append("itemId", itemId) // Assuming item is already created or an ID is available

  // TEST: Upload request should include Authorization header with sessionToken.
  // TEST: Upload progress should be displayed to the user.
  // TEST: Network errors during upload should be handled gracefully.
  // TEST: Server errors (e.g., 4xx, 5xx) should be handled and reported to the user.
  api_response = http_post_request(
    url: "/api/items/images/upload",
    data: formData,
    headers: { "Authorization": "Bearer " + sessionToken },
    onProgress: update_upload_progress_indicator,
    onError: handle_upload_error
  )

  IF api_response.is_successful:
    // TEST: Successful upload response should contain new image details (e.g., imageId, storageUrl).
    newImageRecord = api_response.data
    // TEST: UI should be updated to reflect the newly uploaded image associated with the item.
    add_image_to_item_view(itemId, newImageRecord)
    show_success_message("Image uploaded successfully!")
  ELSE:
    // Error handled by handle_upload_error or inline
    show_error_message("Upload failed: " + api_response.errorMessage)

```

## 2. Server-Side: Image Upload Handling

**Endpoint:** `POST /api/items/images/upload`

**Inputs:** `imageFile` (multipart/form-data), `itemId` (form data), `sessionToken` (Authorization header)

**Outputs:** `newImageRecord` or `error`

```pseudocode
FUNCTION handle_image_upload(request):
  // TEST: Request must be authenticated.
  currentUser = get_user_from_session_token(request.headers.Authorization)
  IF NOT currentUser:
    RETURN error_response("Unauthorized", 401)

  // TEST: Request must contain 'imageFile' and 'itemId'.
  imageFile = request.files.imageFile
  itemId = request.form.itemId
  IF NOT imageFile OR NOT itemId:
    RETURN error_response("Missing imageFile or itemId", 400)

  // TEST: Item specified by itemId must exist and belong to the current user.
  item = find_item_by_id_and_user_id(itemId, currentUser.userId)
  IF NOT item:
    RETURN error_response("Item not found or access denied", 404)

  // TEST: Uploaded file must be a valid image type (e.g., JPEG, PNG, WEBP).
  // TEST: Uploaded file size must be within limits (e.g., < 5MB).
  VALIDATE imageFile_properties(imageFile, {maxSizeMB: 5, allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]})
  IF validation_fails:
    RETURN error_response("Invalid file type or size", 400)

  // TEST: Image should be stored securely in cloud storage (e.g., S3, Supabase Storage).
  // Generate a unique filename to prevent collisions.
  uniqueFileName = generate_unique_filename(currentUser.userId, itemId, imageFile.originalName)
  storageResult = store_image_in_cloud(imageFile.path, uniqueFileName, {bucket: "item-images", acl: "private"})
  IF storage_fails:
    LOG_ERROR "Cloud storage failed for " + uniqueFileName
    RETURN error_response("Failed to store image", 500)

  storageUrl = storageResult.url

  // TEST: A new Image record should be created in the database.
  // Determine if this is the first image for the item to set as primary.
  isPrimary = count_images_for_item(itemId) == 0

  newImageRecordData = {
    itemId: itemId,
    userId: currentUser.userId,
    storageUrl: storageUrl,
    isPrimary: isPrimary,
    metadata: {
      originalName: imageFile.originalName,
      size: imageFile.size,
      mimeType: imageFile.mimeType
      // Potentially add dimensions after processing if needed
    }
  }
  newImage = create_image_record(newImageRecordData)
  IF creation_fails:
    LOG_ERROR "Database failed to create image record for " + storageUrl
    // Consider deleting the file from cloud storage if DB record fails (cleanup)
    delete_image_from_cloud(uniqueFileName, {bucket: "item-images"})
    RETURN error_response("Failed to save image record", 500)

  // TEST: Successful response includes the new image record details.
  RETURN success_response(newImage, 201)

```

## Helper Functions (Conceptual)

```pseudocode
// Client-Side
FUNCTION open_image_picker(allowMultiple, sourceType):
  // Native OS call to open camera or file browser
  // TEST: Returns array of File objects or null.

FUNCTION is_valid_image_file(file, rules):
  // Checks file.type and file.size against rules
  // TEST: Returns true if valid, false otherwise.

FUNCTION display_image_preview(file):
  // Uses FileReader to show image in UI
  // TEST: Image preview is visible.

// Server-Side
FUNCTION get_user_from_session_token(authHeader):
  // Validates session token and returns user object
  // (Covered in Auth pseudocode)

FUNCTION find_item_by_id_and_user_id(itemId, userId):
  // Database lookup for item, ensuring ownership
  // TEST: Returns item object or null.

FUNCTION validate_image_file_properties(file, rules):
  // Checks file properties (mime type, size) on server
  // TEST: Returns true if valid, false otherwise.

FUNCTION generate_unique_filename(userId, itemId, originalName):
  // Creates a unique name, e.g., userId_itemId_timestamp_originalName
  // TEST: Generates a unique string.

FUNCTION store_image_in_cloud(filePath, fileName, options):
  // Uploads file to S3, Google Cloud Storage, Supabase Storage, etc.
  // TEST: Returns {url: "...", ...} or error.

FUNCTION create_image_record(data):
  // Inserts new image metadata into Image table (see Data Models)
  // TEST: Returns new image object or error.

FUNCTION count_images_for_item(itemId):
  // DB query: SELECT COUNT(*) FROM Images WHERE itemId = ?
  // TEST: Returns integer count.

FUNCTION delete_image_from_cloud(fileName, options):
  // Deletes file from cloud storage (for rollback)
  // TEST: Returns success or error.