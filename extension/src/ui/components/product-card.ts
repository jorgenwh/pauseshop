/**
 * Product Card component for PauseShop extension
 * Displays individual product with expandable Amazon search results
 */

import { ProductCardConfig } from "../types";
import { AmazonScrapedProduct } from "../../types/amazon";
import { AmazonProductGrid } from "./amazon-product-grid";

export class ProductCard {
    private element: HTMLElement | null = null;
    private headerElement: HTMLElement | null = null;
    private expansionElement: HTMLElement | null = null;
    private amazonGrid: AmazonProductGrid | null = null;
    private chevronElement: HTMLElement | null = null;

    private config: ProductCardConfig;
    private isCurrentlyExpanded: boolean = false;
    private isAnimating: boolean = false;

    constructor(config: ProductCardConfig) {
        this.config = config;
        this.isCurrentlyExpanded = config.isExpanded;
    }

    /**
     * Create the product card element
     */
    public async create(): Promise<HTMLElement> {
        if (this.element) {
            return this.element;
        }

        this.element = document.createElement("div");
        this.element.className = "pauseshop-product-card";

        // Create header (always visible)
        this.createHeader();

        // Create expansion content (initially hidden)
        this.createExpansionContent();

        return this.element;
    }

    /**
     * Create the card header with product info and chevron
     */
    private createHeader(): void {
        this.headerElement = document.createElement("div");
        this.headerElement.className =
            "flex items-center justify-between cursor-pointer product-header group";

        // Create product info section
        const productInfo = document.createElement("div");
        productInfo.className = "flex items-center space-x-6 min-w-0";

        // Create thumbnail
        const thumbnail = this.createThumbnail();
        productInfo.appendChild(thumbnail);

        // Create text info
        const textInfo = document.createElement("div");
        textInfo.className = "min-w-0";

        const title = document.createElement("h3");
        title.className = "font-semibold text-3xl";
        title.style.color = "var(--pauseshop-product-name-text)";
        title.textContent = this.getProductTitle();
        textInfo.appendChild(title);

        const category = document.createElement("p");
        category.className = "text-2xl";
        category.style.color = "var(--pauseshop-category-text)";
        category.textContent = `Spotted: ${this.getCategoryDisplayName()}`;
        textInfo.appendChild(category);

        productInfo.appendChild(textInfo);
        this.headerElement.appendChild(productInfo);

        // Create chevron
        this.chevronElement = document.createElement("div");
        this.chevronElement.innerHTML = `
            <svg class="w-10 h-10 transform pauseshop-chevron text-slate-300 group-hover:text-indigo-400 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> /* Increased w-8 h-8 to w-10 h-10 */
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
        `;
        this.headerElement.appendChild(this.chevronElement);

        // Add click handler
        this.headerElement.addEventListener("click", () => {
            if (!this.isAnimating) {
                this.config.onToggleExpansion(this);
            }
        });

        this.element?.appendChild(this.headerElement);
    }

    /**
     * Create thumbnail element
     */
    private createThumbnail(): HTMLElement {
        const thumbnail = document.createElement("img");
        thumbnail.className =
            "w-28 h-28 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform duration-200 p-2";

        if (this.config.product.thumbnailUrl) {
            thumbnail.src = this.config.product.thumbnailUrl;
            thumbnail.alt = `Detected Product: ${this.getProductTitle()}`;
        } else {
            // Create fallback div instead of img
            const fallback = document.createElement("div");
            fallback.className =
                "w-36 h-36 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200 bg-gradient-to-br from-pauseshop-primary/30 to-pauseshop-accent/20 flex items-center justify-center text-6xl";
            fallback.textContent = this.getCategoryIcon();
            return fallback;
        }

        // Handle image load error
        thumbnail.onerror = () => {
            const fallback = document.createElement("div");
            fallback.className =
                "w-36 h-36 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200 bg-gradient-to-br from-pauseshop-primary/30 to-pauseshop-accent/20 flex items-center justify-center text-6xl";
            fallback.textContent = this.getCategoryIcon();
            thumbnail.parentNode?.replaceChild(fallback, thumbnail);
        };

        return thumbnail;
    }

    /**
     * Create expansion content with Amazon products
     */
    private createExpansionContent(): void {
        this.expansionElement = document.createElement("div");
        this.expansionElement.className = "pauseshop-expansion";

        // Create header for Amazon products
        const amazonHeader = document.createElement("h4");
        amazonHeader.className = "text-xl font-semibold my-3 ml-1";
        amazonHeader.style.color = "rgb(255, 153, 0)";
        amazonHeader.textContent = "Shop similar on Amazon:";
        this.expansionElement.appendChild(amazonHeader);

        // Create Amazon product grid
        this.amazonGrid = new AmazonProductGrid({
            products: this.config.product.allProducts,
            columns: 2,
            onProductClick: (product: AmazonScrapedProduct) =>
                this.config.onAmazonProductClick(product),
            showPrices: true,
            showRatings: false,
        });

        const gridElement = this.amazonGrid.create();
        this.expansionElement.appendChild(gridElement);

        this.element?.appendChild(this.expansionElement);
    }

    /**
     * Toggle expansion state
     */
    public async toggleExpansion(): Promise<void> {
        if (this.isAnimating) {
            return;
        }

        this.isAnimating = true;

        try {
            if (this.isCurrentlyExpanded) {
                await this.collapse();
            } else {
                await this.expand();
            }
        } finally {
            this.isAnimating = false;
        }
    }

    /**
     * Expand the card
     */
    private async expand(): Promise<void> {
        if (!this.expansionElement || !this.chevronElement) {
            console.error(
                "[ProductCard] Expansion or chevron element not found in expand()",
            );
            return;
        }

        this.isCurrentlyExpanded = true;
        this.chevronElement
            .querySelector(".pauseshop-chevron")
            ?.classList.add("open");

        // Get the natural height of the content
        this.expansionElement.style.maxHeight = "none";
        const height = this.expansionElement.scrollHeight;
        this.expansionElement.style.maxHeight = "0px"; // Reset to 0 for animation start

        const animation = this.expansionElement.animate(
            [
                {
                    maxHeight: "0px",
                    opacity: "0",
                    transform: "translateY(-10px)",
                },
                {
                    maxHeight: `${height}px`,
                    opacity: "1",
                    transform: "translateY(0)",
                },
            ],
            {
                duration: this.config.animations.expansionDuration,
                easing: "ease-in-out",
                fill: "forwards",
            },
        );

        return new Promise((resolve) => {
            animation.onfinish = () => {
                this.expansionElement?.classList.add("open"); // Add class for final state
                resolve();
            };
        });
    }

    /**
     * Collapse the card
     */
    private async collapse(): Promise<void> {
        if (!this.expansionElement || !this.chevronElement) {
            console.error(
                "[ProductCard] Expansion or chevron element not found in collapse()",
            );
            return;
        }

        this.isCurrentlyExpanded = false;
        this.chevronElement
            .querySelector(".pauseshop-chevron")
            ?.classList.remove("open");
        this.expansionElement.classList.remove("open"); // Remove class for animation start

        const height = this.expansionElement.scrollHeight;

        const animation = this.expansionElement.animate(
            [
                {
                    maxHeight: `${height}px`,
                    opacity: "1",
                    transform: "translateY(0)",
                },
                {
                    maxHeight: "0px",
                    opacity: "0",
                    transform: "translateY(-10px)",
                },
            ],
            {
                duration: this.config.animations.expansionDuration,
                easing: "ease-in-out",
                fill: "forwards",
            },
        );

        return new Promise((resolve) => {
            animation.onfinish = () => {
                resolve();
            };
        });
    }

    /**
     * Check if card is expanded
     */
    public isExpanded(): boolean {
        return this.isCurrentlyExpanded;
    }

    /**
     * Get product title
     */
    private getProductTitle(): string {
        const title =
            this.config.product.name ||
            this.config.product.fallbackText ||
            "Product";
        if (title.length > 25) {
            return title.substring(0, 20) + "...";
        }
        return title;
    }

    /**
     * Get category display name
     */
    private getCategoryDisplayName(): string {
        const categoryMap: Record<string, string> = {
            clothing: "Clothing",
            electronics: "Electronics",
            furniture: "Furniture",
            accessories: "Accessories",
            footwear: "Footwear",
            home_decor: "Home Decor",
            books_media: "Books & Media",
            sports_fitness: "Sports & Fitness",
            beauty_personal_care: "Beauty & Personal Care",
            kitchen_dining: "Kitchen & Dining",
        };
        return categoryMap[this.config.product.category] || "Product";
    }

    /**
     * Get category icon
     */
    private getCategoryIcon(): string {
        const iconMap: Record<string, string> = {
            clothing: "👕",
            electronics: "📱",
            furniture: "🛋️",
            accessories: "👜",
            footwear: "👟",
            home_decor: "🏠",
            books_media: "📚",
            sports_fitness: "⚽",
            beauty_personal_care: "💄",
            kitchen_dining: "🍽️",
        };
        return iconMap[this.config.product.category] || "📦";
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
        if (this.amazonGrid) {
            this.amazonGrid.cleanup();
            this.amazonGrid = null;
        }

        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }

        this.element = null;
        this.headerElement = null;
        this.expansionElement = null;
        this.chevronElement = null;
        this.isCurrentlyExpanded = false;
        this.isAnimating = false;
    }
}
