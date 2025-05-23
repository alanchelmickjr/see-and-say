# eBay Listing Integration

This document outlines the database schema changes and configuration required for integrating eBay listing creation functionality.

## 1. Database Schema: `listings` Table

A new table named `listings` will be created in the Supabase database to store information about eBay listings associated with items in our system.

**SQL Schema:**

```sql
CREATE TABLE public.listings (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ebay_listing_id TEXT UNIQUE,
  ebay_listing_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('Drafted', 'Active', 'Ended', 'Failed', 'Pending')), -- Added 'Pending'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Policies for listings:
-- Users can view their own listings
CREATE POLICY "Users can view their own listings"
ON public.listings FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own listings
CREATE POLICY "Users can insert their own listings"
ON public.listings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own listings
CREATE POLICY "Users can update their own listings"
ON public.listings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Optional: Users can delete their own listings (consider if this is needed)
-- CREATE POLICY "Users can delete their own listings"
-- ON public.listings FOR DELETE
-- USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_listings_updated
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();
```

**Fields:**
*   `id`: Primary Key (UUID).
*   `item_id`: Foreign Key referencing the `items` table.
*   `user_id`: Foreign Key referencing the `auth.users` table.
*   `ebay_listing_id`: The ID of the listing on eBay (from eBay API).
*   `ebay_listing_url`: The URL to the listing on eBay.
*   `status`: The current status of the listing (e.g., "Pending", "Drafted", "Active", "Ended", "Failed").
*   `error_message`: Stores any error messages from eBay API interactions.
*   `created_at`: Timestamp of creation.
*   `updated_at`: Timestamp of last update.

## 2. eBay API Configuration

The application will interact with the eBay Trading API. This requires credentials from the eBay Developer Program.

**Environment Variables:**

These variables must be set in your project's environment (e.g., in a `.env.local` file for local development, and configured in your deployment environment).

*   `EBAY_API_ENDPOINT`: The eBay Trading API endpoint URL (e.g., `https://api.ebay.com/ws/api.dll` for production, or `https://api.sandbox.ebay.com/ws/api.dll` for sandbox).
*   `EBAY_APP_ID`: Your eBay Application ID.
*   `EBAY_DEV_ID`: Your eBay Developer ID.
*   `EBAY_CERT_ID`: Your eBay Certificate ID.
*   `EBAY_API_SITEID`: The eBay site ID (e.g., `0` for US, `3` for UK). Refer to eBay documentation for a list of site IDs.
*   `EBAY_API_COMPATIBILITY_LEVEL`: The eBay API compatibility level (e.g., `1193`).

**eBay User OAuth Token:**

*   `EBAY_USER_TOKEN`: A user-specific eBay OAuth token is required to make calls on behalf of a user.
    *   **Current Implementation:** For the initial phase, a long-lived developer token or a pre-generated user token might be used for testing and development. This token should be stored securely as an environment variable.
    *   **Future Requirement:** A full OAuth 2.0 flow for users needs to be implemented. This will allow users to connect their eBay accounts to our application securely. This is a critical step for production readiness and will be addressed in a future task. The system will need to securely store and manage refresh tokens and access tokens for each user.

## 3. eBay Category ID Mapping

Mapping items from our system to specific eBay Category IDs is crucial for successful listing.
*   The `aiRecognizedItem` field from the `items` table may provide keywords or a general category.
*   **Initial Approach:** A default or placeholder `CategoryID` will be used.
*   **Future Enhancement:** Implement logic to:
    1.  Use eBay's `GetSuggestedCategories` API call based on item title/keywords.
    2.  Provide a UI for users to select or confirm the eBay category.
    3.  Store a mapping of internal categories/keywords to eBay Category IDs.

This documentation will serve as a reference for the database and configuration aspects of the eBay listing feature.