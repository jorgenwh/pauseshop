import { 
    SIDEBAR_HEADER_HEIGHT,
    SIDEBAR_HEADER_ICON_SIZE,
    SIDEBAR_SLIDE_DURATION,
    SIDEBAR_WIDTH
} from "../constants";
import {
    ProductDisplayData,
    SidebarConfig,
    SidebarContentState,
    SidebarEvents,
    SidebarState
} from "../types";

export class Sidebar {
    private element: HTMLElement;

    private state: SidebarState = SidebarState.HIDDEN;
    private contentState: SidebarContentState = SidebarContentState.LOADING;

    private config: SidebarConfig;
    private events: SidebarEvents;

    constructor(
        container: HTMLElement,
        sidebarConfig: SidebarConfig,
        sidebarEvents: SidebarEvents
    ) {
        this.config = sidebarConfig;
        this.events = sidebarEvents;

        this.element = this.createElement();
        container.appendChild(this.element);
    }

    private createElement(): HTMLElement {
        const sidebarElement = document.createElement("div");
        sidebarElement.id = "pauseshop-sidebar";
        sidebarElement.classList.add("pauseshop-sidebar");

        const headerElement = this.createHeader();
        sidebarElement.appendChild(headerElement);

        // Set the CSS variables
        sidebarElement.style.setProperty(
            "--sidebar-width", `${SIDEBAR_WIDTH}px`
        );
        sidebarElement.style.setProperty(
            "--sidebar-transition-speed", `${SIDEBAR_SLIDE_DURATION}s`
        );

        // Set initial position and transform to be off-screen
        if (this.config.position === "right") {
            sidebarElement.style.right = "0";
            sidebarElement.style.transform = `translateX(${SIDEBAR_WIDTH}px)`;
        } else {
            sidebarElement.style.left = "0";
            sidebarElement.style.transform = `translateX(-${SIDEBAR_WIDTH}px)`;
        }

        return sidebarElement;
    }

    private createHeader(): HTMLElement {
        const headerElement = document.createElement("div");
        headerElement.classList.add("pauseshop-sidebar-header");
        headerElement.style.setProperty(
            "--sidebar-header-height", `${SIDEBAR_HEADER_HEIGHT}px`
        );

        const iconElement = document.createElement("img");
        iconElement.src = chrome.runtime.getURL('icons/icon-128.png');
        iconElement.style.width = `${SIDEBAR_HEADER_ICON_SIZE}px`;
        iconElement.style.height = `${SIDEBAR_HEADER_ICON_SIZE}px`;
        iconElement.classList.add("pauseshop-sidebar-header-icon");
        headerElement.appendChild(iconElement);

        const titleContainer = document.createElement("div");
        titleContainer.classList.add("pauseshop-sidebar-header-title-container");

        const pauseTitle = document.createElement("h1");
        pauseTitle.classList.add("pauseshop-sidebar-header-title-pause");
        pauseTitle.innerText = "Pause";
        titleContainer.appendChild(pauseTitle);

        const shopTitle = document.createElement("h1");
        shopTitle.classList.add("pauseshop-sidebar-header-title-shop");
        shopTitle.innerText = "Shop";
        titleContainer.appendChild(shopTitle);

        headerElement.appendChild(titleContainer);

        return headerElement;
    }

    public async show(): Promise<void> {
        if (this.state === SidebarState.VISIBLE || this.state === SidebarState.SLIDING_IN) {
            return;
        }

        this.setState(SidebarState.SLIDING_IN);
        // Only modify transform, base position (left/right) is fixed
        this.element.style.transform = `translateX(0)`;

        // Listen for the end of the transition
        this.element.addEventListener("transitionend", () => {
            if (this.state === SidebarState.SLIDING_IN) {
                this.setState(SidebarState.VISIBLE);
                this.events.onShow();
            }
        }, { once: true });
    }

    public async hide(): Promise<void> {
        if (this.state === SidebarState.HIDDEN || this.state === SidebarState.SLIDING_OUT) {
            return;
        }

        this.setState(SidebarState.SLIDING_OUT);
        // Set transform back to off-screen based on position
        if (this.config.position === "right") {
            this.element.style.transform = `translateX(${SIDEBAR_WIDTH}px)`;
        } else {
            this.element.style.transform = `translateX(-${SIDEBAR_WIDTH}px)`;
        }

        // Listen for the end of the transition
        this.element.addEventListener("transitionend", () => {
            if (this.state === SidebarState.SLIDING_OUT) {
                this.setState(SidebarState.HIDDEN);
                this.events.onHide();
            }
        }, { once: true });
    }

    private setState(newState: SidebarState): void {
        this.state = newState;
    }

    public async showLoading(): Promise<void> {
        console.log("Showing loading state");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
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
        this.state = SidebarState.HIDDEN;
        this.contentState = SidebarContentState.LOADING;
    }
}
