/**
 * Product List component for PauseShop extension
 * Manages a vertical list of product cards with scrolling
 */

import { ProductListConfig, ProductDisplayData } from '../types';
import { AmazonScrapedProduct } from '../../types/amazon';
import { ProductCard } from './product-card';

export interface ProductListEvents {
    onProductClick?: (product: AmazonScrapedProduct) => void;
}

export class ProductList {
    private element: HTMLElement | null = null;
    private productCards: ProductCard[] = [];
    private config: ProductListConfig;
    private events: ProductListEvents;
    private expandedCardIndex: number | null = null;

    constructor(config: Partial<ProductListConfig>, events: ProductListEvents = {}) {
        this.config = {
            maxHeight: config.maxHeight || 'none', // Allow content to dictate height
            enableVirtualScrolling: config.enableVirtualScrolling || false,
            itemSpacing: config.itemSpacing || 16
        };
        this.events = events;
    }

    /**
     * Create the product list element
     */
    public async create(products: ProductDisplayData[]): Promise<HTMLElement> {
        if (this.element) {
            this.cleanup();
        }

        this.element = document.createElement('div');
        this.element.className = 'pauseshop-scrollbar overflow-y-auto flex-grow pr-1 pb-4';
        if (this.config.maxHeight !== 'none') {
            this.element.style.maxHeight = this.config.maxHeight;
        } else {
            this.element.style.maxHeight = ''; // Remove max-height style if 'none'
        }

        // Create container for product cards
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'space-y-4';
        this.element.appendChild(cardsContainer);

        // Create product cards
        await this.createProductCards(products, cardsContainer);

        return this.element;
    }

    /**
     * Create product cards for each product
     */
    private async createProductCards(products: ProductDisplayData[], container: HTMLElement): Promise<void> {
        this.productCards = [];

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            
            const productCard = new ProductCard({
                product: product,
                isExpanded: false,
                onToggleExpansion: (card: any) => this.handleCardExpansion(card, i),
                onAmazonProductClick: (amazonProduct: AmazonScrapedProduct) => this.events.onProductClick?.(amazonProduct),
                animations: {
                    expansionDuration: 400,
                    hoverTransitionDuration: 200
                }
            });

            const cardElement = await productCard.create();
            container.appendChild(cardElement);
            this.productCards.push(productCard);
        }
    }

    /**
     * Handle card expansion - collapse others when one expands
     */
    private async handleCardExpansion(expandingCard: ProductCard, cardIndex: number): Promise<void> {
        // If this card is already expanded, just toggle it
        if (this.expandedCardIndex === cardIndex) {
            await expandingCard.toggleExpansion();
            this.expandedCardIndex = expandingCard.isExpanded() ? cardIndex : null;
            return;
        }

        // Collapse currently expanded card if any
        if (this.expandedCardIndex !== null && this.expandedCardIndex !== cardIndex) {
            const currentlyExpanded = this.productCards[this.expandedCardIndex];
            if (currentlyExpanded && currentlyExpanded.isExpanded()) {
                await currentlyExpanded.toggleExpansion(); // Collapse
            }
        }

        // Expand the new card
        await expandingCard.toggleExpansion();
        this.expandedCardIndex = expandingCard.isExpanded() ? cardIndex : null;
    }

    /**
     * Show the product list with staggered animation
     */
    public async show(): Promise<void> {
        if (!this.element || this.productCards.length === 0) {
            return;
        }

        // Initial state - hide all cards
        this.productCards.forEach(card => {
            const element = card.getElement();
            if (element) {
                element.style.opacity = '0';
                element.style.transform = 'translateY(20px)';
            }
        });

        // Show cards with staggered animation
        const animationPromises: Promise<void>[] = [];
        
        this.productCards.forEach((card, index) => {
            const delay = index * 100; // 100ms stagger
            animationPromises.push(this.animateCardIn(card, delay));
        });

        await Promise.all(animationPromises);
    }

    /**
     * Animate a single card in
     */
    private async animateCardIn(card: ProductCard, delay: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const element = card.getElement();
                if (element) {
                    element.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                    
                    setTimeout(resolve, 300);
                } else {
                    resolve();
                }
            }, delay);
        });
    }

    /**
     * Hide the product list
     */
    public async hide(): Promise<void> {
        if (!this.element || this.productCards.length === 0) {
            return;
        }

        // Hide all cards simultaneously
        const hidePromises = this.productCards.map(card => {
            const element = card.getElement();
            if (element) {
                element.style.transition = 'opacity 0.2s ease-in, transform 0.2s ease-in';
                element.style.opacity = '0';
                element.style.transform = 'translateY(-20px)';
                
                return new Promise<void>(resolve => setTimeout(resolve, 200));
            }
            return Promise.resolve();
        });

        await Promise.all(hidePromises);
    }

    /**
     * Collapse all expanded cards
     */
    public async collapseAllCards(): Promise<void> {
        if (this.expandedCardIndex !== null) {
            const expandedCard = this.productCards[this.expandedCardIndex];
            if (expandedCard && expandedCard.isExpanded()) {
                await expandedCard.toggleExpansion();
            }
            this.expandedCardIndex = null;
        }
    }

    /**
     * Get all product cards
     */
    public getProductCards(): ProductCard[] {
        return [...this.productCards];
    }

    /**
     * Get product card by index
     */
    public getProductCard(index: number): ProductCard | null {
        return this.productCards[index] || null;
    }

    /**
     * Get number of products
     */
    public getProductCount(): number {
        return this.productCards.length;
    }

    /**
     * Check if any card is currently expanded
     */
    public hasExpandedCard(): boolean {
        return this.expandedCardIndex !== null;
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
        // Cleanup all product cards
        this.productCards.forEach(card => {
            card.cleanup();
        });
        this.productCards = [];

        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }

        this.element = null;
        this.expandedCardIndex = null;
    }
}