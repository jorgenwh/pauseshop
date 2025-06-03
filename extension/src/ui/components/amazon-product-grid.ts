/**
 * Amazon Product Grid component for PauseShop extension
 * Displays Amazon products in a grid layout within expanded cards
 */

import { AmazonProductGridConfig } from '../types';
import { AmazonScrapedProduct } from '../../types/amazon';

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

        this.element = document.createElement('div');
        this.element.className = `grid grid-cols-${this.config.columns} gap-2.5`;

        // Create product items
        this.config.products.forEach((product, index) => {
            const productItem = this.createProductItem(product, index);
            this.element!.appendChild(productItem);
        });

        return this.element;
    }

    /**
     * Create individual product item
     */
    private createProductItem(product: AmazonScrapedProduct, index: number): HTMLElement {
        const item = document.createElement('a');
        item.href = product.productUrl;
        item.target = '_blank';
        item.className = 'pauseshop-amazon-item group block p-2 rounded-lg transition-colors duration-200';
        
        // Add click handler
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.config.onProductClick(product);
        });

        // Create thumbnail
        const thumbnail = this.createThumbnail(product);
        item.appendChild(thumbnail);

        // Create product info
        const info = this.createProductInfo(product, index);
        item.appendChild(info);

        return item;
    }

    /**
     * Create product thumbnail
     */
    private createThumbnail(product: AmazonScrapedProduct): HTMLElement {
        const thumbnail = document.createElement('img');
        thumbnail.className = 'w-full h-auto rounded-md object-cover mb-1.5 shadow-sm group-hover:opacity-90 transition-opacity';
        thumbnail.src = product.thumbnailUrl;
        thumbnail.alt = `Amazon Product ${product.position}`;

        // Handle image load error
        thumbnail.onerror = () => {
            const fallback = document.createElement('div');
            fallback.className = 'w-full h-24 rounded-md mb-1.5 shadow-sm bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-slate-400 text-xs';
            fallback.textContent = 'Image not available';
            thumbnail.parentNode?.replaceChild(fallback, thumbnail);
        };

        return thumbnail;
    }

    /**
     * Create product info section
     */
    private createProductInfo(product: AmazonScrapedProduct, index: number): HTMLElement {
        const info = document.createElement('div');

        // Create title
        const title = document.createElement('p');
        title.className = 'text-[11px] leading-tight text-slate-100 truncate';
        title.textContent = `Amazon Product ${product.position || index + 1}`;
        info.appendChild(title);

        // Create price placeholder (since we don't have actual price data)
        if (this.config.showPrices) {
            const price = document.createElement('p');
            price.className = 'text-[10px] text-indigo-400 font-semibold';
            price.textContent = 'View on Amazon';
            info.appendChild(price);
        }

        // Add confidence indicator if available
        if (product.confidence && product.confidence > 0) {
            const confidence = document.createElement('div');
            confidence.className = 'flex items-center mt-1';
            
            const stars = Math.round(product.confidence * 5);
            const starElements = Array.from({ length: 5 }, (_, i) => {
                const star = document.createElement('span');
                star.className = `text-[8px] ${i < stars ? 'text-yellow-400' : 'text-slate-600'}`;
                star.textContent = '★';
                return star;
            });
            
            starElements.forEach(star => confidence.appendChild(star));
            info.appendChild(confidence);
        }

        return info;
    }

    /**
     * Update the grid with new products
     */
    public updateProducts(products: AmazonScrapedProduct[]): void {
        if (!this.element) return;

        this.config.products = products;
        this.element.innerHTML = '';

        products.forEach((product, index) => {
            const productItem = this.createProductItem(product, index);
            this.element!.appendChild(productItem);
        });
    }

    /**
     * Show grid with fade-in animation
     */
    public async show(): Promise<void> {
        if (!this.element) return;

        this.element.style.opacity = '0';
        this.element.style.transform = 'translateY(10px)';
        
        // Trigger animation
        requestAnimationFrame(() => {
            if (this.element) {
                this.element.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
                this.element.style.opacity = '1';
                this.element.style.transform = 'translateY(0)';
            }
        });

        return new Promise(resolve => {
            setTimeout(resolve, 300);
        });
    }

    /**
     * Hide grid with fade-out animation
     */
    public async hide(): Promise<void> {
        if (!this.element) return;

        this.element.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
        this.element.style.opacity = '0';
        this.element.style.transform = 'translateY(-10px)';

        return new Promise(resolve => {
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