/**
 * Main UI manager for PauseShop extension
 * Orchestrates all UI components and handles lifecycle management
 */

import { LoadingSquare } from './components/loading-square';
import { LoadingState, UIConfig, LoadingSquareConfig, UIManagerEvents } from './types';

export class UIManager {
    private container: HTMLElement | null = null;
    private loadingSquare: LoadingSquare | null = null;
    private config: UIConfig;
    private loadingSquareConfig: LoadingSquareConfig;
    private events: UIManagerEvents;
    private isInitialized: boolean = false;

    constructor(
        config: Partial<UIConfig> = {},
        loadingSquareConfig: Partial<LoadingSquareConfig> = {},
        events: UIManagerEvents = {}
    ) {
        this.config = {
            enableLogging: true,
            logPrefix: 'PauseShop UI',
            containerClassName: 'pauseshop-ui-container',
            zIndex: 999999,
            ...config
        };

        this.loadingSquareConfig = {
            size: 180,
            borderRadius: 20,
            backgroundColor: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(168, 85, 247, 0.9), rgba(236, 72, 153, 0.85))',
            position: {
                top: 120,
                right: 30
            },
            animations: {
                slideInDuration: 300,
                slideOutDuration: 250,
                pulseDuration: 1500
            },
            ...loadingSquareConfig
        };

        this.events = events;
    }

    /**
     * Initialize the UI manager and create container
     */
    public initialize(): boolean {
        if (this.isInitialized) {
            this.log('UI Manager already initialized');
            return true;
        }

        try {
            // Create main container
            this.createContainer();
            
            // Create loading square component
            this.loadingSquare = new LoadingSquare(this.loadingSquareConfig);
            
            this.isInitialized = true;
            this.log('UI Manager initialized successfully');
            return true;

        } catch (error) {
            this.log(`Failed to initialize UI Manager: ${error}`);
            return false;
        }
    }

    /**
     * Show the loading square
     */
    public async showLoadingSquare(): Promise<boolean> {
        if (!this.ensureInitialized()) {
            return false;
        }

        try {
            // Create and append loading square to container
            const squareElement = this.loadingSquare!.create();
            this.container!.appendChild(squareElement);

            // Show with animation
            await this.loadingSquare!.show();
            
            this.log('Loading square displayed');
            this.events.onShow?.();
            this.events.onStateChange?.(LoadingState.LOADING);
            
            return true;

        } catch (error) {
            this.log(`Failed to show loading square: ${error}`);
            return false;
        }
    }

    /**
     * Hide the loading square
     */
    public async hideLoadingSquare(): Promise<boolean> {
        if (!this.loadingSquare || !this.loadingSquare.isVisible()) {
            return true;
        }

        try {
            await this.loadingSquare.hide();
            
            // Remove from DOM after animation
            const element = this.loadingSquare.getElement();
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
            
            this.log('Loading square hidden');
            this.events.onHide?.();
            this.events.onStateChange?.(LoadingState.HIDDEN);
            
            return true;

        } catch (error) {
            this.log(`Failed to hide loading square: ${error}`);
            return false;
        }
    }

    /**
     * Update loading square state
     */
    public updateLoadingState(state: LoadingState): void {
        if (!this.loadingSquare) {
            return;
        }

        this.loadingSquare.updateState(state);
        this.events.onStateChange?.(state);
        this.log(`Loading state updated to: ${state}`);
    }

    /**
     * Hide all UI components
     */
    public async hideUI(): Promise<void> {
        await this.hideLoadingSquare();
    }

    /**
     * Check if UI is currently visible
     */
    public isUIVisible(): boolean {
        return this.loadingSquare?.isVisible() ?? false;
    }

    /**
     * Get current loading state
     */
    public getCurrentState(): LoadingState {
        return this.loadingSquare?.getCurrentState() ?? LoadingState.HIDDEN;
    }

    /**
     * Check if any animations are running
     */
    public isAnimating(): boolean {
        return this.loadingSquare?.isAnimating() ?? false;
    }

    /**
     * Complete cleanup of all UI components
     */
    public cleanup(): void {
        this.log('Cleaning up UI Manager');

        // Cleanup loading square
        if (this.loadingSquare) {
            this.loadingSquare.cleanup();
            this.loadingSquare = null;
        }

        // Remove container from DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;

        this.isInitialized = false;
        this.log('UI Manager cleanup complete');
    }

    /**
     * Create the main UI container
     */
    private createContainer(): void {
        // Remove existing container if it exists
        const existingContainer = document.querySelector(`.${this.config.containerClassName}`);
        if (existingContainer) {
            existingContainer.remove();
        }

        this.container = document.createElement('div');
        this.container.className = this.config.containerClassName;
        
        // Apply container styles
        const containerStyles = {
            position: 'fixed' as const,
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none' as const,
            zIndex: this.config.zIndex.toString(),
            userSelect: 'none' as const
        };

        Object.assign(this.container.style, containerStyles);

        // Append to document body
        document.body.appendChild(this.container);
        
        this.log('UI container created and attached to DOM');
    }

    /**
     * Ensure UI manager is initialized
     */
    private ensureInitialized(): boolean {
        if (!this.isInitialized) {
            this.log('UI Manager not initialized, attempting to initialize');
            return this.initialize();
        }
        return true;
    }

    /**
     * Log message with prefix
     */
    private log(message: string): void {
        if (this.config.enableLogging) {
            console.log(`${this.config.logPrefix}: ${message}`);
        }
    }

    /**
     * Static method to create and initialize a UI manager
     */
    public static create(
        config?: Partial<UIConfig>,
        loadingSquareConfig?: Partial<LoadingSquareConfig>,
        events?: UIManagerEvents
    ): UIManager | null {
        try {
            const manager = new UIManager(config, loadingSquareConfig, events);
            if (manager.initialize()) {
                return manager;
            }
            return null;
        } catch (error) {
            console.error('PauseShop: Failed to create UI Manager:', error);
            return null;
        }
    }
}