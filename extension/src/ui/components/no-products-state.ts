/**
 * No Products State component for PauseShop extension
 * Shows when no products are found in the analyzed content
 */

import { NoProductsStateConfig } from '../types';

export class NoProductsState {
    private element: HTMLElement | null = null;
    private config: NoProductsStateConfig;

    constructor(config: Partial<NoProductsStateConfig>) {
        this.config = {
            title: config.title || 'No products found.',
            message: config.message || 'Try a different scene or ensure items are clearly visible.',
            iconType: config.iconType || 'search',
            showRetryButton: config.showRetryButton || false,
            onRetry: config.onRetry
        };
    }

    /**
     * Create the no products state element
     */
    public create(): HTMLElement {
        if (this.element) {
            return this.element;
        }

        this.element = document.createElement('div');
        this.element.className = 'flex flex-col items-center justify-center flex-grow text-center py-10';

        // Create icon
        const icon = this.createIcon();
        this.element.appendChild(icon);

        // Create title
        const title = document.createElement('p');
        title.className = 'text-lg font-semibold text-slate-200 mb-2';
        title.textContent = this.config.title;
        this.element.appendChild(title);

        // Create message
        const message = document.createElement('p');
        message.className = 'text-sm text-slate-400 mb-4';
        message.textContent = this.config.message;
        this.element.appendChild(message);

        // Create retry button if enabled
        if (this.config.showRetryButton && this.config.onRetry) {
            const retryButton = this.createRetryButton();
            this.element.appendChild(retryButton);
        }

        return this.element;
    }

    /**
     * Create icon based on type
     */
    private createIcon(): HTMLElement {
        const iconContainer = document.createElement('div');
        iconContainer.className = 'mb-4';

        const icon = document.createElement('div');
        icon.className = 'h-12 w-12 text-slate-400 mx-auto';

        let iconSvg = '';
        switch (this.config.iconType) {
            case 'empty':
                iconSvg = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                `;
                break;
            case 'error':
                iconSvg = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                `;
                break;
            case 'search':
            default:
                iconSvg = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10l4 4m0-4l-4 4" />
                    </svg>
                `;
                break;
        }

        icon.innerHTML = iconSvg;
        iconContainer.appendChild(icon);
        return iconContainer;
    }

    /**
     * Create retry button
     */
    private createRetryButton(): HTMLElement {
        const button = document.createElement('button');
        button.className = 'px-4 py-2 bg-pauseshop-primary hover:bg-pauseshop-secondary text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pauseshop-primary focus:ring-opacity-50';
        button.textContent = 'Try Again';

        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.config.onRetry?.();
        });

        return button;
    }

    /**
     * Update the state content
     */
    public updateContent(title: string, message: string): void {
        if (!this.element) return;

        const titleEl = this.element.querySelector('p.text-lg');
        if (titleEl) {
            titleEl.textContent = title;
        }

        const messageEl = this.element.querySelector('p.text-sm');
        if (messageEl) {
            messageEl.textContent = message;
        }
    }

    /**
     * Show no products state with fade-in animation
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
     * Hide no products state with fade-out animation
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