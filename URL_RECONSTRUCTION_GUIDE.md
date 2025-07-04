# URL Reconstruction Guide

This document explains how to decode and reconstruct the optimized referrer URLs generated by the PauseShop extension.

## URL Structure

The complete referrer URL has the following format:
```
{baseUrl}/referrer?pauseId={sessionId}&data={encodedData}
```

Example:
```
https://pauseshop.net/referrer?pauseId=session-123&data=T-Shirt~clothing~0~SomeBrand~FF0000~00FF00,0000FF~FeatureA,FeatureB~2~t-shirt,shirt~0.95||1|710PSL6OBTLB0CB3VXLPZ3799|61abc123DEFB07XJ8C8F54550
```

## Encoded Data Format

The `data` parameter uses a custom fixed-length encoding optimized for our specific data structure. **No separators are needed** because Amazon ASINs and image IDs are always the same length!

### Format Structure
```
{encodedProductObject}||{clickPosition}|{amazonProduct1}|{amazonProduct2}|...
```

Where:
- `encodedProductObject` - A tilde-separated `~` string representing the shared product metadata.
- `||` - A double-pipe separator between the product object and the Amazon product list.
- `clickPosition` - Index of the clicked Amazon product in the list.
- `|` - A single-pipe separator for the Amazon product list.
- `amazonProduct1, amazonProduct2...` - All scraped Amazon products for context.

### Amazon Product Format
Each Amazon product follows this fixed-length pattern:
```
{imageId11}{asin10}[{priceInCents}]
```

Where:
- `imageId` (required): Amazon image identifier, always 11 characters (e.g., "710PSL6OBTL")
- `asin` (optional): Amazon ASIN, always 10 characters when present (e.g., "B0CB3VXLPZ")
- `priceInCents` (optional): Price in cents as digits only (e.g., "3799" for $37.99)

**Key Insight**: Since imageId and ASIN have fixed lengths, we can determine the structure by total length:
- Length = 11: imageId only
- Length = 21: imageId + asin (no price)
- Length > 11 and < 21: imageId + price (no asin)
- Length > 21: imageId + asin + price

**Key insight**: Since image IDs are always 11 chars and ASINs are always 10 chars, we can parse them by position without separators!

### Examples

#### Complete Product Data
```
710PSL6OBTLB0CB3VXLPZ3799
```
- Characters 1-11: Image ID `710PSL6OBTL`
- Characters 12-21: ASIN `B0CB3VXLPZ`
- Characters 22+: Price `3799` (37.99)

#### Product Without Price
```
710PSL6OBTLB0CB3VXLPZ
```
- Characters 1-11: Image ID `710PSL6OBTL`
- Characters 12-21: ASIN `B0CB3VXLPZ`
- Price: Not available

#### Product Without ASIN
```
710PSL6OBTL3799
```
- Characters 1-11: Image ID `710PSL6OBTL`
- Characters 12+: Price `3799` ($37.99)
- ASIN: Not available (length is 15, not 21)

#### Product With Only Image ID
```
710PSL6OBTL
```
- Characters 1-11: Image ID `710PSL6OBTL`
- ASIN: Not available
- Price: Not available

## Decoding Algorithm

### Step 1: Parse URL Parameters
Extract `pauseId` and `data` from the URL query parameters.

### Step 2: Split Encoded Data
Split the `data` parameter into its main components:
```javascript
// Split by '||' to separate the product context from the Amazon data
const [productContextStr, amazonDataStr] = encodedData.split('||');

// Parse the Amazon data
const amazonParts = amazonDataStr.split('|');
const clickedPosition = parseInt(amazonParts[0], 10);
const contextProductParts = amazonParts.slice(1);
```

### Step 3: Parse Product Context Object
Decode the tilde-separated `productContextStr`:
```javascript
function parseProductContext(contextStr) {
    const parts = contextStr.split('~');
    
    // Helper enums (should match your TypeScript enums)
    const Category = ["clothing", "electronics", "furniture", "accessories", "footwear", "home_decor", "books_media", "sports_fitness", "beauty_personal_care", "kitchen_dining", "other"];
    const TargetGender = ["men", "women", "unisex", "boy", "girl"];

    return {
        name: parts[0],
        iconCategory: parts[1],
        category: Category[parseInt(parts[2], 10)],
        brand: parts[3],
        primaryColor: parts[4],
        secondaryColors: parts[5] ? parts[5].split(',') : [],
        features: parts[6] ? parts[6].split(',') : [],
        targetGender: TargetGender[parseInt(parts[7], 10)],
        searchTerms: parts[8],
        confidence: (parseInt(parts[9], 10) || 0) / 10
    };
}
```

### Step 4: Parse Each Amazon Product
For each Amazon product string, extract the components using fixed-length parsing:

```javascript
function parseProduct(productStr) {
    // Extract image ID (always first 11 characters)
    const imageId = productStr.substring(0, 11);
    
    // Determine structure based on length
    let asin = undefined;
    let price = undefined;
    
    if (productStr.length === 11) {
        // Only imageId
    } else if (productStr.length === 21) {
        // imageId + asin (no price)
        asin = productStr.substring(11, 21);
    } else if (productStr.length > 11 && productStr.length < 21) {
        // imageId + price (no asin)
        const priceStr = productStr.substring(11);
        price = parseInt(priceStr, 10) / 100; // Convert cents to dollars
    } else if (productStr.length > 21) {
        // imageId + asin + price
        asin = productStr.substring(11, 21);
        const priceStr = productStr.substring(21);
        price = parseInt(priceStr, 10) / 100; // Convert cents to dollars
    }
    
    return { imageId, asin, price };
}
```

### Step 5: Reconstruct Amazon URLs
Convert the parsed data back to full Amazon URLs:

```javascript
function reconstructThumbnailUrl(imageId) {
    return `https://m.media-amazon.com/images/I/${imageId}._AC_UL320_.jpg`;
}

function reconstructProductUrl(asin) {
    return asin ? `https://www.amazon.com/dp/${asin}` : null;
}
```

## Complete Decoding Example

```javascript
function decodeReferrerData(encodedData) {
    // Split into the two main parts
    const [productContextStr, amazonDataStr] = encodedData.split('||');

    // Decode the product context
    const productContext = parseProductContext(productContextStr);

    // Decode the Amazon data
    const amazonParts = amazonDataStr.split('|');
    const clickedPosition = parseInt(amazonParts[0], 10);
    const contextProductParts = amazonParts.slice(1);

    // Parse context products
    const amazonProducts = [];
    for (const productStr of contextProductParts) {
        if (!productStr) continue;
        
        const { imageId, asin, price } = parseProduct(productStr);
        
        amazonProducts.push({
            imageId,
            amazonAsin: asin,
            thumbnailUrl: reconstructThumbnailUrl(imageId),
            productUrl: asin ? reconstructProductUrl(asin) : null,
            price
        });
    }

    // The clicked product is identified by its position in the array
    const clickedAmazonProduct = amazonProducts[clickedPosition];
    
    return {
        productContext,
        clickedAmazonProduct,
        clickedPosition,
        amazonProducts
    };
}

// Example usage:
const encodedData = "T-Shirt~clothing~0~SomeBrand~brown~~leather,sectional~2~t-shirt,shirt~9||1|710PSL6OBTLB0CB3VXLPZ3799|61abc123DEFB07XJ8C8F54550";
const decoded = decodeReferrerData(encodedData);
console.log(decoded);
```

## Size Optimization Benefits

This custom encoding provides significant size reduction compared to JSON + Base64:

### Example Comparison
For 3 products with full data:

**Old Method (JSON + Base64):**
```
eyJjIjoxLCJwIjpbeyJpIjoiNzEwUFNMNk9CVEwiLCJhIjoiQjBDQjNWWExQWiIsInAiOjM3Ljk5fSx7ImkiOiI2MWFiYzEyM0RFRiIsImEiOiJCMDdYSjhDOEY1IiwicCI6NDUuNX0seyJpIjoiNzF4eXo3ODlHSEkiLCJhIjoiQjA5QUJDRDEyMzQiLCJwIjoxMi43NX1dfQ
```
Length: ~200 characters

**New Method (Optimized Encoding with Product Context):**
```
T-Shirt~...~0.95||1|710PSL6OBTLB0CB3VXLPZ3799|61abc123DEFB07XJ8C8F54550|...
```
Length: Varies, but highly optimized. For a typical product object and 3 Amazon products, it's around 150-200 characters. While longer than the previous version, it now includes rich product metadata that would otherwise require a separate API call or much larger JSON payload.

**Savings: Still significantly smaller than a full JSON + Base64 approach.**

## Backward Compatibility

The website should detect and handle both formats:

1. **New Format**: Contains pipe characters and uses fixed-length encoding
2. **Legacy Format**: Base64-encoded JSON (for existing URLs)

```javascript
function isLegacyFormat(encodedData) {
    return encodedData.match(/^[A-Za-z0-9+/\-_=]+$/) && encodedData.length > 50 && !encodedData.includes('|');
}

function isFixedLengthFormat(encodedData) {
    // The new format is identified by the double pipe separator
    return encodedData.includes('||');
}
```

## Error Handling

- Invalid click position: Default to 0
- Missing image ID: Skip the product
- Invalid price format: Set price to undefined
- Invalid ASIN format: Set ASIN to undefined

## Security Considerations

- Validate all extracted data before use
- Sanitize image IDs and ASINs to prevent injection attacks
- Ensure price values are reasonable (e.g., 0-999999 cents)
- Limit the number of products to prevent abuse (e.g., max 50 products)

## Testing

A test file `encoding-test-example.js` is provided to demonstrate the optimization benefits. Run it in a browser console to see the dramatic size reduction compared to traditional JSON + Base64 encoding.

## Implementation Notes

- The extension only encodes data; it never needs to decode
- All decoding logic should be implemented on the website side
- The custom format is URL-safe and doesn't require additional encoding
- Backward compatibility with old Base64 format can be detected by checking for pipe characters