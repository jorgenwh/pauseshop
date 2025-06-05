# Streaming Product Analysis Architecture Plan - Phase 3: UI Integration and Polish

## Goal
Ensure seamless and natural display of streamed products in the UI, maintaining existing visual design and user experience.

## Assumptions
*   Phase 0, 1, and 2 are completed, meaning:
    *   AI services (specifically Gemini) support native streaming.
    *   `server/src/services/streaming-analysis.ts` can process AI streaming events and forward products.
    *   `extension/src/background/api-client.ts` can handle Server-Sent Events (SSE) for streaming products.
    *   `extension/src/background/analysis-workflow.ts` orchestrates the streaming process and passes products to the UI.
    *   `extension/src/ui/components/product-list.ts` (from Phase 2) is capable of receiving and rendering individual product cards as they arrive.

## Files to be reviewed/modified (as per plan):
*   [`extension/src/ui/components/product-card.ts`](extension/src/ui/components/product-card.ts)
*   [`extension/src/ui/components/loading-state.ts`](extension/src/ui/components/loading-state.ts)

## Steps:

1.  **Initial Loading State Management (`loading-state.ts`):**
    *   The `LoadingState` component will be displayed initially when an analysis request is made. It will show a message like "Analyzing your paused scene..." or "Finding products...".
    *   Once the first product is received via streaming, the `LoadingState` component should gracefully hide using its `hide()` method. This transition will ensure a smooth visual experience as products begin to appear.
    *   No further loading indicators from this component are expected once products start streaming, as the progressive display of product cards will serve as the ongoing activity indicator.

2.  **Product Card Integration (`product-card.ts`):**
    *   No direct modifications are expected for `product-card.ts` itself. Its current design is robust for rendering individual products, and the plan explicitly states "No changes to product card appearance" and "Existing Card Design."
    *   Instances of `ProductCard` will be created dynamically by a higher-level component (likely `extension/src/ui/components/product-list.ts`) as each complete product object is received from the streaming API.

3.  **Dynamic Product List Updates (`product-list.ts` - from Phase 2, but relevant here):**
    *   This component will be the primary recipient of streamed product events from `analysis-workflow.ts`.
    *   It will be responsible for:
        *   Receiving individual `product` events as they arrive.
        *   Instantiating a new `ProductCard` for each received product.
        *   Appending the new `ProductCard`'s element to its own DOM structure, ensuring products appear in the correct "priority order as streamed" (assuming the backend sends them in this order).
        *   Coordinating the hiding of the `LoadingState` component when the first product is ready to be displayed.

4.  **UI Polish and User Experience:**
    *   **Smooth Transitions:** Ensure that the transition from the `LoadingState` to the display of the first `ProductCard` is visually seamless, without abrupt changes or flickering. This will involve coordinating the `hide()` animation of `LoadingState` with the appearance of the first `ProductCard`.
    *   **Layout Consistency:** Verify that as products are dynamically added to the `product-list`, the overall UI layout (e.g., grid, spacing) remains consistent with the existing design, as per the "Consistent Layout" feature.
    *   **No Visual Disruptions:** Confirm that adding new product cards does not cause unwanted layout shifts or visual glitches, ensuring a stable and predictable user interface.

## Streaming Flow Diagram for Phase 3

```mermaid
graph TD
    A[User Initiates Analysis] --> B{Is Streaming Enabled & Supported (Gemini)?};
    B -- Yes --> C[Display LoadingState];
    C --> D[Backend Streams Products (Gemini)];
    D -- Product 1 Arrives --> E[Hide LoadingState];
    E --> F[ProductList Creates & Displays ProductCard 1];
    D -- Product 2 Arrives --> G[ProductList Creates & Displays ProductCard 2];
    D -- ... --> H[ProductList Creates & Displays ProductCard N];
    D -- All Products Streamed / Complete Event --> I[Analysis Complete];
    B -- No --> J[Fallback to Batch Processing (Existing Flow)];