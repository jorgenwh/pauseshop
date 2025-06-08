import { 
    ProductDisplayData, 
    SidebarConfig, 
    SidebarContentState, 
    SidebarEvents, 
    SidebarState 
} from "../types";

export class Sidebar {
    private element: HTMLElement | null = null;

    private state: SidebarState = SidebarState.HIDDEN;
    private contentState: SidebarContentState = SidebarContentState.LOADING;

    private config: SidebarConfig;
    private events: SidebarEvents;

    constructor(sidebarConfig: SidebarConfig, sidebarEvents: SidebarEvents) {
        this.config = sidebarConfig;
        this.events = sidebarEvents;
        console.log("Sidebar initialized");
    }

    public async show(): Promise<void> {
        console.log("Showing sidebar");
    }

    public async hide(): Promise<void> {
        console.log("Hiding sidebar");
    }

    public async showLoading(): Promise<void> {
        console.log("Showing loading state");
    }

    public async showProducts(products: ProductDisplayData): Promise<void> {
        console.log("Showing products state");
    }

    public async showNoProducts(): Promise<void> {
        console.log("Showing no products state");
    }

    public async showError(): Promise<void> {
        console.error("Showing error state");
    }

    public setContentState(state: SidebarContentState): void {
        console.log(`Setting content state to: ${state}`);
        this.contentState = state;
    }

    public isVisible(): boolean {
        return this.state === SidebarState.VISIBLE;
    }

    public cleanup(): void {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.state = SidebarState.HIDDEN;
        this.contentState = SidebarContentState.LOADING;
    }
}
