/**
 * Amazon Product Grid component for PauseShop extension
 * Displays Amazon products in a grid layout within expanded cards
 */

import { AmazonProductGridConfig } from "../types";
import { AmazonScrapedProduct } from "../../types/amazon";

export class AmazonProductGrid {
    private element: HTMLElement | null = null;
    private config: AmazonProductGridConfig;

    constructor(config: AmazonProductGridConfig) {
        this.config = config;
    }

    /**
     * Create the Amazon product grid element
     */
    public create(): HTMLElement {
        if (this.element) {
            return this.element;
        }

        this.element = document.createElement("div");
        this.element.className = `grid grid-cols-2 gap-4 pauseshop-amazon-grid`; // Use Tailwind grid classes directly

        // Create product items (limit to 4 for a 2x2 grid)
        const productsToShow = this.config.products.slice(0, 4);
        productsToShow.forEach((product, index) => {
            const productItem = this.createProductItem(product, index);
            this.element!.appendChild(productItem);
        });

        return this.element;
    }

    /**
     * Create individual product item
     */
    private createProductItem(
        product: AmazonScrapedProduct,
        _index: number,
    ): HTMLElement {
        const item = document.createElement("a");
        item.href = product.productUrl;
        item.target = "_blank";
        item.className =
            "pauseshop-amazon-item group block rounded-lg transition-colors duration-200";

        // Add click handler
        item.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.config.onProductClick(product);
        });

        // Create thumbnail container
        const thumbnailContainer = document.createElement("div");
        thumbnailContainer.className =
            "flex-shrink-0 w-full h-full flex items-center justify-center"; // Container for the image
        const thumbnail = this.createThumbnail(product);
        thumbnailContainer.appendChild(thumbnail);
        item.appendChild(thumbnailContainer);
        return item;
    }

    /**
     * Create product thumbnail
     */
    private createThumbnail(product: AmazonScrapedProduct): HTMLElement {
        const thumbnail = document.createElement("img");
        thumbnail.className =
            "pauseshop-amazon-item-image rounded-md object-contain shadow-sm group-hover:opacity-90 transition-opacity";
        thumbnail.src = product.thumbnailUrl;
        thumbnail.alt = `Amazon Product ${product.position}`;

        // Handle image load error
        thumbnail.onerror = () => {
            const fallback = document.createElement("div");
            fallback.className =
                "fallback-thumbnail rounded-md shadow-sm bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-slate-400 text-xs"; // Sizing handled by CSS
            fallback.textContent = "Image not available";
            thumbnail.parentNode?.replaceChild(fallback, thumbnail);
        };

        return thumbnail;
    }

    /**
     * Create product info section (now empty as per user request)
     */
    private createProductInfo(
        _product: AmazonScrapedProduct,
        _index: number,
    ): HTMLElement {
        // Removed all text and star elements as per user request
        return document.createElement("div"); // Return an empty div
    }

    /**
     * Update the grid with new products
     */
    public updateProducts(products: AmazonScrapedProduct[]): void {
        if (!this.element) return;

        this.config.products = products;
        this.element.innerHTML = "";

        const productsToShow = products.slice(0, 4); // Limit to 4 for a 2x2 grid
        productsToShow.forEach((product, index) => {
            const productItem = this.createProductItem(product, index);
            this.element!.appendChild(productItem);
        });
    }

    /**
     * Show grid with fade-in animation
     */
    public async show(): Promise<void> {
        if (!this.element) return;

        this.element.style.opacity = "0";
        this.element.style.transform = "translateY(10px)";

        // Trigger animation
        requestAnimationFrame(() => {
            if (this.element) {
                this.element.style.transition =
                    "opacity 0.3s ease-in-out, transform 0.3s ease-in-out";
                this.element.style.opacity = "1";
                this.element.style.transform = "translateY(0)";
            }
        });

        return new Promise((resolve) => {
            setTimeout(resolve, 300);
        });
    }

    /**
     * Hide grid with fade-out animation
     */
    public async hide(): Promise<void> {
        if (!this.element) return;

        this.element.style.transition =
            "opacity 0.3s ease-in-out, transform 0.3s ease-in-out";
        this.element.style.opacity = "0";
        this.element.style.transform = "translateY(-10px)";

        return new Promise((resolve) => {
            setTimeout(resolve, 300);
        });
    }

    /**
     * Get the DOM element
     */
    public getElement(): HTMLElement | null {
        return this.element;
    }

    /**
     * Cleanup resources
     */
    public cleanup(): void {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}
