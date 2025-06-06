/**
 * Sidebar Header component for PauseShop extension
 * Contains branding and close button
 */

import { SidebarHeaderConfig } from '../types';

export class SidebarHeader {
    private element: HTMLElement | null = null;
    private config: SidebarHeaderConfig;

    constructor(config: SidebarHeaderConfig) {
        this.config = config;
    }

    /**
     * Create the header element
     */
    public create(): HTMLElement {
        if (this.element) {
            return this.element;
        }

        this.element = document.createElement('div');
        this.element.className = 'flex justify-between items-center mb-5 pb-4 border-b border-slate-600/80';

        // Create title section with logo
        const titleSection = document.createElement('div');
        titleSection.className = 'flex items-center space-x-2.5 ml-[10px]';
        
        // Create logo icon
        const logoIcon = document.createElement('div');
        logoIcon.innerHTML = `
            <svg class="w-12 h-12 text-indigo-400" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M7.50329 5.00002C7.50329 4.15366 8.13938 3.48013 8.96891 3.42219C9.02396 3.41728 9.07933 3.41492 9.13501 3.41492H14.865C14.9207 3.41492 14.976 3.41728 15.0311 3.42219C15.8606 3.48013 16.4967 4.15366 16.4967 5.00002V5.25002H7.50329V5.00002ZM5.25329 6.00002V5.25002H7.50329V6.00002H3.75C3.33579 6.00002 3 6.33581 3 6.75002V17.25C3 19.0449 4.45508 20.5 6.25 20.5H17.75C19.5449 20.5 21 19.0449 21 17.25V6.75002C21 6.33581 20.6642 6.00002 20.25 6.00002H16.4967V5.25002H18.7467V6.00002H5.25329Z M12 17C13.3807 17 14.5 15.8807 14.5 14.5C14.5 13.1193 13.3807 12 12 12C10.6193 12 9.5 13.1193 9.5 14.5C9.5 15.8807 10.6193 17 12 17Z"/>
            </svg>
        `;
        titleSection.appendChild(logoIcon);

        // Create title text
        const titleText = document.createElement('h2');
        titleText.className = 'text-4xl font-bold text-slate-100';
        titleText.innerHTML = `Pause<span class="text-indigo-400">Shop</span>`;
        titleSection.appendChild(titleText);

        this.element.appendChild(titleSection);

        // Create close button if enabled
        if (this.config.showCloseButton) {
            const closeButton = this.createCloseButton();
            this.element.appendChild(closeButton);
        }

        return this.element;
    }

    /**
     * Create the close button (white X)
     */
    private createCloseButton(): HTMLElement {
        const closeButton = document.createElement('button');
        closeButton.className = 'w-14 h-14 flex items-center justify-center bg-transparent hover:bg-white/10 rounded-full transition-colors duration-200 mr-[20px]';
        closeButton.setAttribute('aria-label', 'Close sidebar');
        closeButton.style.border = 'none';
        closeButton.style.outline = 'none';
        
        // Create the X using CSS-drawn lines for a thinner appearance
        closeButton.innerHTML = `
            <div style="position: relative; width: 20px; height: 20px;">
                <div style="position: absolute; top: 50%; left: 50%; width: 20px; height: 1.5px; background-color: white; transform: translate(-50%, -50%) rotate(45deg);"></div>
                <div style="position: absolute; top: 50%; left: 50%; width: 20px; height: 1.5px; background-color: white; transform: translate(-50%, -50%) rotate(-45deg);"></div>
            </div>
        `;

        // Add click handler
        closeButton.addEventListener('click', () => {
            if (this.config.onClose) {
                this.config.onClose();
            }
        });

        return closeButton;
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