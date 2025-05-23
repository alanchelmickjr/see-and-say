# Phase 2: Data Models for ebay-helper

This document outlines the core data models for the ebay-helper application.

## 1. User Model

Represents a registered user of the application.

```
User {
  userId: UUID (Primary Key)
  email: String (Unique, Indexed)
  passwordHash: String (Hashed)
  oauthProvider: String (e.g., "google", "apple", "email")
  oauthId: String (Unique per provider)
  createdAt: Timestamp
  updatedAt: Timestamp

  // Relationships
  // TEST: A user can have many Items (One-to-Many)
  // TEST: A user can have many Listings (One-to-Many)
}
```

### TDD Anchors:
- `// TEST: User.email must be a valid email format.`
- `// TEST: User.passwordHash should not store plain text passwords.`
- `// TEST: User.oauthId must be unique for a given oauthProvider.`

## 2. Item Model

Represents an item that the user wants to track or sell.

```
Item {
  itemId: UUID (Primary Key)
  userId: UUID (Foreign Key to User.userId, Indexed)
  itemName: String (User-defined or AI-suggested)
  description: Text (User-defined or AI-suggested)
  aiRecognizedItem: JSON (Stores raw AI recognition data, e.g., name, category, confidence)
  suggestedPriceRangeMin: Decimal
  suggestedPriceRangeMax: Decimal
  status: Enum ("new", "inventory", "listed_on_ebay", "sold", "kept", "archived") (Indexed)
  createdAt: Timestamp
  updatedAt: Timestamp

  // Relationships
  // TEST: An Item belongs to one User (Many-to-One)
  // TEST: An Item can have many Images (One-to-Many)
  // TEST: An Item can have one active Listing (One-to-One, nullable)
  // TEST: An Item can have many PriceData entries (One-to-Many)
}
```

### TDD Anchors:
- `// TEST: Item.userId must reference an existing User.`
- `// TEST: Item.status must be one of the predefined enum values.`
- `// TEST: Item.suggestedPriceRangeMin must be less than or equal to suggestedPriceRangeMax.`

## 3. Image Model

Represents an image uploaded by the user for an item.

```
Image {
  imageId: UUID (Primary Key)
  itemId: UUID (Foreign Key to Item.itemId, Indexed)
  userId: UUID (Foreign Key to User.userId, Indexed) // For easier querying/permissions
  storageUrl: String (URL to the image in cloud storage)
  isPrimary: Boolean (Indicates if this is the main image for the item)
  uploadedAt: Timestamp
  metadata: JSON (e.g., filename, size, type, dimensions)

  // Relationships
  // TEST: An Image belongs to one Item (Many-to-One)
  // TEST: An Image belongs to one User (Many-to-One)
}
```

### TDD Anchors:
- `// TEST: Image.itemId must reference an existing Item.`
- `// TEST: Image.userId must reference an existing User.`
- `// TEST: Image.storageUrl must be a valid URL.`
- `// TEST: Only one image per item can be primary.`

## 4. Listing Model

Represents an eBay listing created for an item.

```
Listing {
  listingId: UUID (Primary Key)
  itemId: UUID (Foreign Key to Item.itemId, Indexed, Unique) // An item can only have one active listing
  userId: UUID (Foreign Key to User.userId, Indexed)
  ebayListingId: String (eBay's unique ID for the listing, Indexed)
  title: String
  description: Text
  price: Decimal
  currency: String (e.g., "USD")
  condition: String (e.g., "new", "used")
  categoryEbayId: String
  listingUrl: String (URL to the live eBay listing)
  status: Enum ("draft", "active", "sold", "ended", "error") (Indexed)
  createdAt: Timestamp
  updatedAt: Timestamp
  expiresAt: Timestamp (If applicable from eBay)

  // Relationships
  // TEST: A Listing belongs to one Item (One-to-One)
  // TEST: A Listing belongs to one User (Many-to-One)
}
```

### TDD Anchors:
- `// TEST: Listing.itemId must reference an existing Item.`
- `// TEST: Listing.userId must reference an existing User.`
- `// TEST: Listing.price must be a positive value.`
- `// TEST: Listing.status must be one of the predefined enum values.`

## 5. PriceData Model

Stores pricing information gathered from various sources for an item.

```
PriceData {
  priceDataId: UUID (Primary Key)
  itemId: UUID (Foreign Key to Item.itemId, Indexed)
  source: String (e.g., "ebay_sold", "ebay_active", "google_shopping", "manual_input") (Indexed)
  price: Decimal
  currency: String (e.g., "USD")
  observedAt: Timestamp
  sourceUrl: String (Optional: URL to the source listing/page)
  metadata: JSON (e.g., condition, seller_rating for eBay)

  // Relationships
  // TEST: PriceData belongs to one Item (Many-to-One)
}
```

### TDD Anchors:
- `// TEST: PriceData.itemId must reference an existing Item.`
- `// TEST: PriceData.price must be a positive value.`
- `// TEST: PriceData.source must be a non-empty string.`