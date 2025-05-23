# Phase 3: Pseudocode for AI Item Recognition

This document outlines the pseudocode for the AI Item Recognition feature in ebay-helper.

## 1. Trigger AI Item Recognition

**Endpoint:** `POST /api/items/{itemId}/recognize`

**Inputs:** `itemId` (path parameter), `sessionToken` (Authorization header)
Optionally, `imageId` could be a body parameter if a specific image (not necessarily primary) needs to be processed. For simplicity, we'll assume the primary image or the most recent one.

**Outputs:** Updated `Item` record with `aiRecognizedItem` data, or `error`.

```pseudocode
FUNCTION handle_ai_item_recognition(request):
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

  // TEST: Item must have at least one image to perform recognition.
  primaryImage = find_primary_image_for_item(itemId)
  IF NOT primaryImage:
    // Alternative: find most recent image if no primary is set.
    // primaryImage = find_most_recent_image_for_item(itemId)
    // IF NOT primaryImage:
    RETURN error_response("No image found for item to perform recognition", 400)

  imageToRecognizeUrl = primaryImage.storageUrl

  // TEST: AI recognition service should be configurable (e.g., via environment variables).
  // TEST: API keys for AI service must not be hard-coded and should be securely managed.
  TRY:
    aiServiceConfig = get_ai_service_configuration() // Reads from env vars
    // TEST: AI service call should handle network errors and timeouts gracefully.
    rawAiResponse = call_ai_recognition_service(imageToRecognizeUrl, aiServiceConfig)
  CATCH exception (e.g., NetworkError, AIConfigurationError, AIServiceError):
    LOG_ERROR "AI Service call failed for item " + itemId + ": " + exception.message
    RETURN error_response("AI Item Recognition service failed: " + exception.message, 503) // Service Unavailable

  // TEST: Raw AI response should be processed into a structured format.
  processedAiData = process_raw_ai_response(rawAiResponse, aiServiceConfig.provider)
  IF processing_failed OR NOT processedAiData:
    LOG_ERROR "Failed to process AI response for item " + itemId
    RETURN error_response("Failed to process AI recognition results", 500)

  // Store the raw or processed data in the Item model's aiRecognizedItem field.
  // Optionally, update item.itemName or item.description if confidence is high.
  updateData = {
    aiRecognizedItem: processedAiData // Could be {name, category, tags, confidence, raw_response}
  }

  // Example: Update item name if AI suggests one with high confidence
  IF processedAiData.suggestedName AND processedAiData.suggestedNameConfidence > 0.8:
    updateData.itemName = processedAiData.suggestedName
  
  // TEST: Item record should be updated successfully with AI recognition results.
  updatedItem = update_item_record(itemId, updateData)
  IF update_failed:
    LOG_ERROR "Failed to update item " + itemId + " with AI results."
    RETURN error_response("Failed to save AI recognition results to item", 500)

  // TEST: Successful response includes the updated item record.
  RETURN success_response(updatedItem, 200)

```

## Helper Functions (Conceptual)

```pseudocode
FUNCTION get_user_from_session_token(authHeader):
  // (Covered in Auth pseudocode)

FUNCTION find_item_by_id_and_user_id(itemId, userId):
  // (Covered in Image Upload pseudocode)
  // TEST: Returns item object or null.

FUNCTION find_primary_image_for_item(itemId):
  // DB query: SELECT * FROM Images WHERE itemId = ? AND isPrimary = true LIMIT 1
  // TEST: Returns image object or null.

FUNCTION get_ai_service_configuration():
  // Reads AI provider name, API key, endpoint URL from environment variables.
  // TEST: Returns config object or throws AIConfigurationError if missing.
  // Example: { provider: "google_vision", apiKey: "...", endpoint: "..." }

FUNCTION call_ai_recognition_service(imageUrl, config):
  // Makes an HTTP request to the configured AI service (e.g., Google Vision API, AWS Rekognition).
  // Passes the imageUrl (or image bytes if required by API and feasible).
  // Handles authentication with the AI service using config.apiKey.
  // TEST: Returns raw JSON/XML response from AI service or throws AIServiceError.
  // Example for a generic service:
  //   headers = {"Authorization": "Bearer " + config.apiKey, "Content-Type": "application/json"}
  //   body = {"requests": [{"image": {"source": {"imageUri": imageUrl}}, "features": [{"type": "OBJECT_LOCALIZATION"}, {"type": "LABEL_DETECTION"}]}]}
  //   response = HTTP_POST(config.endpoint, headers, body)
  //   RETURN response.json()

FUNCTION process_raw_ai_response(rawResponse, providerName):
  // Parses the AI service's specific response format into a standardized structure.
  // Extracts relevant information like object names, categories, confidence scores, bounding boxes.
  // TEST: Returns a structured JSON object (e.g., {recognizedObjects: [...], labels: [...], suggestedName: "...", suggestedNameConfidence: 0.9}) or null if parsing fails.
  // Example for "google_vision" provider:
  //   labels = rawResponse.responses[0].labelAnnotations.map(label => ({description: label.description, score: label.score}))
  //   objects = rawResponse.responses[0].localizedObjectAnnotations.map(obj => ({name: obj.name, score: obj.score, boundingPoly: obj.boundingPoly}))
  //   suggestedName = (labels.length > 0) ? labels[0].description : null
  //   suggestedNameConfidence = (labels.length > 0) ? labels[0].score : 0
  //   RETURN { labels: labels, objects: objects, suggestedName: suggestedName, suggestedNameConfidence: suggestedNameConfidence, raw_response: rawResponse }

FUNCTION update_item_record(itemId, dataToUpdate):
  // Updates the item record in the database with fields from dataToUpdate.
  // Specifically updates `aiRecognizedItem`, and potentially `itemName`, `description`.
  // TEST: Returns updated item object or error.
```

## Considerations for AI Service Choice:

- **Google Cloud Vision API:** Strong for object detection, label detection, text recognition.
- **AWS Rekognition:** Similar capabilities, good integration within AWS ecosystem.
- **OpenAI API (e.g., GPT-4 with Vision):** Can provide more descriptive and contextual understanding beyond simple labels, potentially better for "what is this item and what is it for?". Might be more expensive or slower.
- **Clarifai, Microsoft Azure Computer Vision:** Other mature options.

The choice will depend on budget, desired accuracy, specific features needed (e.g., brand recognition, specific object categories), and ease of integration. The pseudocode aims to be abstract enough to allow plugging in different services. The `call_ai_recognition_service` and `process_raw_ai_response` would be the primary functions to adapt per provider.