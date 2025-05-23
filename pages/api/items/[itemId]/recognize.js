import { supabase } from '../../../../lib/supabaseClient';
import { ImageAnnotatorClient } from '@google-cloud/vision';

// TODO: Configure Google Cloud credentials securely via environment variables
// const visionClient = new ImageAnnotatorClient({
//   keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Or directly use key an object
// });

/**
 * @swagger
 * /api/items/{itemId}/recognize:
 *   post:
 *     summary: Triggers AI item recognition for a given item.
 *     description: Authenticates the user, fetches the item's primary image, calls Google Cloud Vision API to recognize the item, processes the response, and updates the item record in the database.
 *     tags:
 *       - Items
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         description: The ID of the item to recognize.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: AI recognition successful, item updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Bad request (e.g., missing itemId, no image found).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden (user does not own the item).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Item not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error (e.g., AI service call failed, database update failed).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: AI Item Recognition service failed or unavailable.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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

  try {
    // 1. Authenticate user
    const { data: { user }, error: userError } = await supabase.auth.getUser(req.headers.authorization?.split('Bearer ')[1]);

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return res.status(401).json({ message: userError?.message || 'Unauthorized' });
    }

    // 2. Fetch item and verify ownership
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('*')
      .eq('item_id', itemId)
      .eq('user_id', user.id)
      .single();

    if (itemError || !item) {
      if (itemError && itemError.code === 'PGRST116') { // Not found
        return res.status(404).json({ message: 'Item not found or access denied.' });
      }
      console.error('Error fetching item:', itemError);
      return res.status(itemError ? 500 : 404).json({ message: itemError?.message || 'Item not found or access denied.' });
    }

    // 3. Fetch primary image for the item
    const { data: primaryImage, error: imageError } = await supabase
      .from('images')
      .select('storage_url')
      .eq('item_id', itemId)
      .eq('is_primary', true)
      .limit(1)
      .single();

    let imageToRecognizeUrl;
    if (primaryImage) {
      imageToRecognizeUrl = primaryImage.storage_url;
    } else {
      // Fallback: find most recent image if no primary is set
      const { data: mostRecentImage, error: recentImageError } = await supabase
        .from('images')
        .select('storage_url')
        .eq('item_id', itemId)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .single();

      if (mostRecentImage) {
        imageToRecognizeUrl = mostRecentImage.storage_url;
      } else {
        if (recentImageError && recentImageError.code !== 'PGRST116') {
            console.error('Error fetching most recent image:', recentImageError);
        }
        return res.status(400).json({ message: 'No image found for item to perform recognition.' });
      }
    }
    
    if (!imageToRecognizeUrl) {
        return res.status(400).json({ message: 'No image URL could be determined for recognition.' });
    }

    // 4. Call Google Cloud Vision API (Placeholder for actual implementation)
    // This section requires secure credential management and the @google-cloud/vision library.
    // Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is set.
    let rawAiResponse;
    try {
      // Example: const [result] = await visionClient.labelDetection(imageToRecognizeUrl);
      // For now, using a mock response. Replace with actual API call.
      console.log(`Simulating AI recognition for image: ${imageToRecognizeUrl}`);
      
      // --- BEGIN MOCK AI RESPONSE ---
      // This is a simplified mock. The actual Google Vision API response is more complex.
      // You'll need to install and configure the @google-cloud/vision client.
      // Example: npm install @google-cloud/vision
      // And set up authentication: https://cloud.google.com/vision/docs/setup
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_CLOUD_PROJECT_ID) {
        console.warn("GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_PROJECT_ID not set. Using mock AI response.");
        rawAiResponse = {
          responses: [
            {
              labelAnnotations: [
                { description: 'Mocked Laptop', score: 0.95, mid: '/m/01_mocklap' },
                { description: 'Mocked Electronics', score: 0.90, mid: '/m/02_mockelec' },
                { description: 'Mocked Technology', score: 0.85, mid: '/m/03_mocktech' },
              ],
              localizedObjectAnnotations: [
                { name: 'Mocked Laptop Object', score: 0.92, boundingPoly: { normalizedVertices: [{x:0.1,y:0.1},{x:0.9,y:0.1},{x:0.9,y:0.9},{x:0.1,y:0.9}] } }
              ]
            },
          ],
        };
      } else {
        // Actual Google Vision API call
        const visionClient = new ImageAnnotatorClient(); // Assumes ADC or env vars are set
        const [result] = await visionClient.annotateImage({
          image: { source: { imageUri: imageToRecognizeUrl } },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 10 },
            { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
            // Add other features as needed, e.g., TEXT_DETECTION, WEB_DETECTION
          ],
        });
        rawAiResponse = result; // The direct response from Google Vision API
         if (result.error) {
          console.error('Google Cloud Vision API Error:', result.error);
          return res.status(503).json({ message: `AI Service Error: ${result.error.message}` });
        }
      }
      // --- END MOCK AI RESPONSE ---

    } catch (aiError) {
      console.error('AI Service call failed:', aiError);
      return res.status(503).json({ message: `AI Item Recognition service failed: ${aiError.message}` });
    }

    // 5. Process raw AI response (Placeholder for actual implementation)
    let processedAiData;
    try {
      // Example processing logic based on pseudocode
      const labels = rawAiResponse.responses?.[0]?.labelAnnotations?.map(label => ({ description: label.description, score: label.score, mid: label.mid })) || [];
      const objects = rawAiResponse.responses?.[0]?.localizedObjectAnnotations?.map(obj => ({ name: obj.name, score: obj.score, boundingPoly: obj.boundingPoly })) || [];
      
      let suggestedName = null;
      let suggestedNameConfidence = 0;

      if (labels.length > 0) {
        // Prioritize objects if available and confident
        const confidentObject = objects.find(obj => obj.score > 0.75);
        if (confidentObject) {
            suggestedName = confidentObject.name;
            suggestedNameConfidence = confidentObject.score;
        } else {
            suggestedName = labels[0].description;
            suggestedNameConfidence = labels[0].score;
        }
      } else if (objects.length > 0) {
         suggestedName = objects[0].name;
         suggestedNameConfidence = objects[0].score;
      }

      processedAiData = {
        labels: labels,
        objects: objects,
        suggestedName: suggestedName,
        suggestedNameConfidence: suggestedNameConfidence,
        provider: 'google_vision',
        rawResponse: process.env.NODE_ENV === 'development' ? rawAiResponse : undefined, // Only include raw in dev
      };

      if (!labels.length && !objects.length) {
        console.log("AI recognition did not return any labels or objects for item: ", itemId);
        // It's not necessarily an error if nothing is found, but we might want to handle it.
        // For now, we'll proceed and store the empty findings.
      }

    } catch (processingError) {
      console.error('Failed to process AI response for item ' + itemId, processingError);
      return res.status(500).json({ message: 'Failed to process AI recognition results' });
    }
    
    // 6. Update item record in Supabase
    const updateData = {
      ai_recognized_item: processedAiData, // Ensure your DB column name matches
    };

    if (processedAiData.suggestedName && processedAiData.suggestedNameConfidence > 0.75) { // Confidence threshold
      // Only update if item name is generic or empty, or if AI is very confident
      if (!item.item_name || item.item_name.toLowerCase() === 'new item' || processedAiData.suggestedNameConfidence > 0.9) {
        updateData.item_name = processedAiData.suggestedName;
      }
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from('items')
      .update(updateData)
      .eq('item_id', itemId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update item ' + itemId + ' with AI results:', updateError);
      return res.status(500).json({ message: 'Failed to save AI recognition results to item: ' + updateError.message });
    }

    // 7. Return success response
    return res.status(200).json(updatedItem);

  } catch (error) {
    console.error('Unexpected error in AI recognition handler:', error);
    return res.status(500).json({ message: error.message || 'An unexpected error occurred.' });
  }
}