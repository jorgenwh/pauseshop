# Task 3.1 Implementation Plan: Amazon Search String Construction

## Overview

Task 3.1 involves creating functionality to construct Amazon search strings based on the JSON response from the OpenAI analysis server. This is the first step in Phase 3 (Amazon Integration) and will prepare the foundation for tasks 3.2 (Amazon search) and 3.3 (result scraping).

## Current Context Analysis

### Data Flow
Screenshots are captured → sent to server → OpenAI analyzes → returns [`Product[]`](../server/src/types/analyze.ts:21) array

### Product Structure
Each [`Product`](../server/src/types/analyze.ts:21) contains:
- [`name`](../server/src/types/analyze.ts:22): Product name with color
- [`category`](../server/src/types/analyze.ts:23): ProductCategory enum
- [`brand`](../server/src/types/analyze.ts:24): Brand name or "unknown"
- [`primaryColor`](../server/src/types/analyze.ts:25): Main color
- [`secondaryColors`](../server/src/types/analyze.ts:26): Additional colors
- [`features`](../server/src/types/analyze.ts:27): Style, material, pattern details
- [`targetGender`](../server/src/types/analyze.ts:28): Target demographic
- [`searchTerms`](../server/src/types/analyze.ts:29): Pre-optimized search terms from OpenAI

### Current Integration Point
The [`service-worker.ts`](../extension/src/background/service-worker.ts:115) receives analysis results and logs product count, but doesn't process them further yet.

## Architecture Design

```mermaid
graph TB
    A[Product[] from Server] --> B[Amazon Search Builder]
    B --> C[URL Construction Logic]
    C --> D[Category-Specific Optimization]
    C --> E[Search Term Processing]
    C --> F[Domain Selection]
    D --> G[Amazon Search URLs]
    E --> G
    F --> G
    G --> H[Ready for Phase 3.2 Scraping]
```

## Implementation Strategy

### 1. Create Amazon Search Module Structure

**File**: [`extension/src/scraper/amazon-search.ts`](../extension/src/scraper/amazon-search.ts:1)

This module will:
- Import [`Product`](../server/src/types/analyze.ts:21) and related types from server types
- Create interfaces for Amazon search configuration and results
- Implement search URL construction logic
- Handle different Amazon domains (amazon.com, amazon.co.uk, etc.)
- Provide fallback strategies for different product categories

### 2. Search URL Construction Strategy

**Primary Approach**: Leverage the [`searchTerms`](../server/src/types/analyze.ts:29) field from OpenAI analysis
- OpenAI already provides optimized search terms following the pattern: "[gender] [colors] [product type] [material/style]"
- This reduces complexity and leverages AI optimization

**Fallback Approach**: Construct from individual fields if [`searchTerms`](../server/src/types/analyze.ts:29) is insufficient
- Combine [`targetGender`](../server/src/types/analyze.ts:28) + [`primaryColor`](../server/src/types/analyze.ts:25) + [`name`](../server/src/types/analyze.ts:22) + [`features`](../server/src/types/analyze.ts:27)
- Apply category-specific optimizations

### 3. Amazon URL Structure

Amazon search URLs follow this pattern:
```
https://www.amazon.com/s?k={search_terms}&ref=sr_pg_1
```

Additional parameters for optimization:
- `&rh=n:{category_node}` - Category filtering
- `&sort=relevanceblender` - Relevance sorting
- `&qid={timestamp}` - Query ID for tracking

## Implementation Components

### Type Definitions

**File**: [`extension/src/types/amazon.ts`](../extension/src/types/amazon.ts:1)

```typescript
interface AmazonSearchConfig {
  domain: string;           // amazon.com, amazon.co.uk, etc.
  maxSearchTermLength: number;
  enableCategoryFiltering: boolean;
  fallbackToGenericSearch: boolean;
}

interface AmazonSearchResult {
  productId: string;        // Unique identifier for tracking
  searchUrl: string;        // Constructed Amazon search URL
  searchTerms: string;      // Final search terms used
  category: ProductCategory;
  confidence: number;       // Confidence in search term quality
}
```

### Core Functions

1. [`constructSearchUrl(product: Product, config: AmazonSearchConfig): AmazonSearchResult`](../extension/src/scraper/amazon-search.ts:1)
2. [`optimizeSearchTerms(product: Product): string`](../extension/src/scraper/amazon-search.ts:1)
3. [`getCategoryNode(category: ProductCategory): string | null`](../extension/src/scraper/amazon-search.ts:1)
4. [`validateSearchTerms(terms: string): boolean`](../extension/src/scraper/amazon-search.ts:1)

### Category-Specific Optimizations

- **Clothing**: Include gender, color, size descriptors
- **Electronics**: Focus on brand, model, specifications
- **Accessories**: Emphasize style, material, color
- **Furniture**: Include material, style, dimensions

## Integration Points

### Current Integration
Modify [`service-worker.ts`](../extension/src/background/service-worker.ts:115) to:
1. Import the new Amazon search module
2. Process analysis results through search URL construction
3. Return both analysis results AND search URLs to content script

### Future Integration
Prepare for Phase 3.2 by:
- Structuring results for easy consumption by scraping logic
- Including metadata needed for result ordering and tracking

## Error Handling & Fallbacks

1. **Invalid Search Terms**: Fallback to generic product name
2. **Unknown Categories**: Use generic Amazon search without category filtering
3. **Empty Results**: Provide diagnostic information for debugging
4. **URL Length Limits**: Truncate search terms intelligently

## Testing Strategy

### Unit Tests
- Test search URL construction for each [`ProductCategory`](../server/src/types/analyze.ts:32)
- Validate URL encoding and special character handling
- Test fallback mechanisms

### Integration Tests
- Test with real OpenAI analysis results
- Verify URL accessibility (without actually scraping)

## Configuration & Flexibility

### Default Configuration
```typescript
const defaultConfig: AmazonSearchConfig = {
  domain: 'amazon.com',
  maxSearchTermLength: 200,
  enableCategoryFiltering: true,
  fallbackToGenericSearch: true
};
```

### Extensibility
Design for easy addition of other shopping platforms in the future

## Performance Considerations

- **Lightweight Processing**: Minimal computational overhead
- **Batch Processing**: Handle multiple products efficiently
- **Caching**: Cache category nodes and common search patterns

## Deliverables

1. **[`extension/src/scraper/amazon-search.ts`](../extension/src/scraper/amazon-search.ts:1)** - Main search URL construction module
2. **[`extension/src/types/amazon.ts`](../extension/src/types/amazon.ts:1)** - Amazon-specific type definitions
3. **Updated [`service-worker.ts`](../extension/src/background/service-worker.ts:115)** - Integration with analysis workflow
4. **Unit tests** - Comprehensive test coverage for search logic
5. **Documentation** - Clear API documentation and usage examples

## Success Criteria

✅ **Functional**: Generate valid Amazon search URLs for all product categories  
✅ **Robust**: Handle edge cases and provide meaningful fallbacks  
✅ **Performant**: Process multiple products quickly without blocking  
✅ **Extensible**: Easy to modify for different Amazon domains or additional platforms  
✅ **Testable**: Comprehensive test coverage with clear validation criteria  

## Implementation Steps

1. Create [`extension/src/types/amazon.ts`](../extension/src/types/amazon.ts:1) with type definitions
2. Implement [`extension/src/scraper/amazon-search.ts`](../extension/src/scraper/amazon-search.ts:1) core module
3. Add category-specific optimization logic
4. Integrate with [`service-worker.ts`](../extension/src/background/service-worker.ts:115)
5. Create comprehensive unit tests
6. Test integration with existing analysis workflow

This plan leverages the existing OpenAI-optimized [`searchTerms`](../server/src/types/analyze.ts:29) while providing robust fallbacks and category-specific optimizations. The modular design will integrate seamlessly with the current architecture and prepare for Phase 3.2 (Amazon scraping) and Phase 3.3 (result processing).