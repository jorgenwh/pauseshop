/**
 * Loading State component for PauseShop extension
 * Shows loading spinner and messages while analyzing content
 */

import { LoadingStateConfig } from '../types';

export class LoadingState {
    private element: HTMLElement | null = null;
    private config: LoadingStateConfig;

    constructor(config: Partial<LoadingStateConfig>) {
        this.config = {
            message: config.message || 'Finding products...',
            subMessage: config.subMessage || 'Analyzing your paused scene.',
            spinnerSize: config.spinnerSize || 'initial'
        };
    }

    /**
     * Create the loading state element
     */
    public create(): HTMLElement {
        if (this.element) {
            return this.element;
        }

        this.element = document.createElement('div');
        this.element.className = 'flex flex-col items-center justify-center flex-grow text-center py-10 px-0';

        // Create spinner
        const spinner = this.createSpinner();
        this.element.appendChild(spinner);

        // Create main message
        const mainMessage = document.createElement('p');
        mainMessage.className = 'text-4xl font-semibold text-slate-100 mb-2';
        mainMessage.textContent = this.config.message;
        this.element.appendChild(mainMessage);

        // Create sub message if provided
        if (this.config.subMessage) {
            const subMessage = document.createElement('p');
            subMessage.className = 'text-2xl text-slate-300';
            subMessage.textContent = this.config.subMessage;
            this.element.appendChild(subMessage);
        }

        return this.element;
    }

    /**
     * Create spinner element based on size
     */
    private createSpinner(): HTMLElement {
        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'mb-5';

        const spinner = document.createElement('div');
        
        // Set size classes based on config
        let sizeClasses = '';
        switch (this.config.spinnerSize) {
            case 'small':
                sizeClasses = 'h-6 w-6';
                break;
            case 'large':
                sizeClasses = 'h-12 w-12';
                break;
            case 'initial':
                sizeClasses = 'h-20 w-20'; // Double the size for initial load
                break;
            case 'medium':
            default:
                sizeClasses = 'h-10 w-10';
                break;
        }

        spinner.className = `pauseshop-spinner ${sizeClasses} text-pauseshop-primary`;
        spinner.innerHTML = `
            <svg class="animate-spin ${sizeClasses}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        `;

        spinnerContainer.appendChild(spinner);
        return spinnerContainer;
    }

    /**
     * Update the loading message
     */
    public updateMessage(message: string, subMessage?: string): void {
        if (!this.element) return;

        const mainMessageEl = this.element.querySelector('p.text-4xl');
        if (mainMessageEl) {
            mainMessageEl.textContent = message;
        }

        const subMessageEl = this.element.querySelector('p.text-2xl');
        if (subMessage) {
            if (subMessageEl) {
                subMessageEl.textContent = subMessage;
            } else {
                // Create sub message if it doesn't exist
                const newSubMessage = document.createElement('p');
                newSubMessage.className = 'text-2xl text-slate-300';
                newSubMessage.textContent = subMessage;
                this.element.appendChild(newSubMessage);
            }
        } else if (subMessageEl) {
            // Remove sub message if not provided
            subMessageEl.remove();
        }
    }

    /**
     * Show loading state with fade-in animation
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
     * Hide loading state with fade-out animation
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