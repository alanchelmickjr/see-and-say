// lib/ebayApi.js
import { XMLBuilder, XMLParser } from 'xmlbuilder2'; // Using xmlbuilder2 for both building and parsing for consistency
                                                 // Or use separate libraries like 'xmlbuilder' and 'fast-xml-parser'

const EBAY_API_VERSION = '1113'; // Example, use a current version
const EBAY_SITE_ID = '0'; // 0 for US, can be made configurable

/**
 * Retrieves eBay API configuration from environment variables and user token.
 * @param {string} userEbayAuthToken - The user's eBay OAuth token.
 * @returns {object} Configuration object for eBay API calls.
 * @throws {Error} If essential eBay API credentials are not set in environment variables.
 */
export function getApiConfig(userEbayAuthToken) {
  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;
  const devId = process.env.EBAY_DEV_ID;
  const serverUrl = process.env.EBAY_API_SERVER_URL; // e.g., 'https://api.ebay.com/ws/api.dll' for production

  if (!appId || !certId || !devId || !serverUrl) {
    console.error('Missing eBay API credentials in environment variables (EBAY_APP_ID, EBAY_CERT_ID, EBAY_DEV_ID, EBAY_API_SERVER_URL)');
    throw new Error('eBay API credentials configuration is incomplete.');
  }
  if (!userEbayAuthToken) {
    console.error('User eBay OAuth token is missing for API call.');
    throw new Error('User eBay OAuth token is required.');
  }

  return {
    appId,
    certId,
    devId,
    serverUrl,
    userEbayAuthToken,
    apiVersion: EBAY_API_VERSION,
    siteId: EBAY_SITE_ID,
  };
}

/**
 * Makes an AddItem call to the eBay Trading API.
 * @param {object} itemPayload - The payload for the Item object as defined by eBay's AddItem call.
 * @param {object} apiConfig - Configuration object from getApiConfig.
 * @returns {Promise<object>} Parsed JSON response from eBay.
 * @throws {Error} If the API call fails or returns an error.
 */
export async function addItem(itemPayload, apiConfig) {
  const requestBody = {
    AddItemRequest: {
      '@xmlns': 'urn:ebay:apis:eBLBaseComponents',
      RequesterCredentials: {
        eBayAuthToken: apiConfig.userEbayAuthToken,
      },
      ErrorLanguage: 'en_US',
      WarningLevel: 'High',
      Item: itemPayload, // The item data structure passed in
      // DetailLevel: 'ReturnAll', // Optional: to get more details back
    },
  };

  const xmlPayload = XMLBuilder.create(requestBody, { version: '1.0', encoding: 'UTF-8' }).end({ prettyPrint: true });
  
  console.log("eBay AddItem Request XML:", xmlPayload); // For debugging

  try {
    const response = await fetch(apiConfig.serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'X-EBAY-API-COMPATIBILITY-LEVEL': apiConfig.apiVersion,
        'X-EBAY-API-DEV-NAME': apiConfig.devId,
        'X-EBAY-API-APP-NAME': apiConfig.appId,
        'X-EBAY-API-CERT-NAME': apiConfig.certId,
        'X-EBAY-API-CALL-NAME': 'AddItem',
        'X-EBAY-API-SITEID': apiConfig.siteId,
      },
      body: xmlPayload,
    });

    const responseText = await response.text();
    console.log("eBay AddItem Response XML:", responseText); // For debugging

    if (!response.ok) {
      // Try to parse error from XML if possible, otherwise use status text
      let errorMessage = `eBay API Error: ${response.status} ${response.statusText}`;
      try {
        const parsedError = XMLParser.parse(responseText);
        const errors = parsedError?.AddItemResponse?.Errors;
        if (errors) {
          const firstError = Array.isArray(errors) ? errors[0] : errors;
          errorMessage = `eBay API Error: ${firstError.ShortMessage || 'Unknown eBay error'} (Code: ${firstError.ErrorCode})`;
        }
      } catch (e) {
        // Ignore parsing error, stick with HTTP status
      }
      throw new Error(errorMessage);
    }
    
    const parsedResponse = XMLParser.parse(responseText);
    
    // The actual response structure is AddItemResponse
    if (parsedResponse.AddItemResponse) {
        return parsedResponse.AddItemResponse;
    } else {
        // This case should ideally be caught by !response.ok, but as a fallback
        console.error("Unexpected eBay response structure:", parsedResponse);
        throw new Error("Unexpected response structure from eBay API.");
    }

  } catch (error) {
    console.error('Error calling eBay AddItem API:', error);
    throw error; // Re-throw to be caught by the calling function
  }
}

// Future functions:
// export async function verifyAddItem(itemPayload, apiConfig) { /* ... */ }
// export async function reviseItem(itemPayload, apiConfig) { /* ... */ }
// export async function endItem(itemId, apiConfig) { /* ... */ }