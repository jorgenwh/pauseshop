import { SidebarPosition } from "./ui/types";

// Default values
const DEFAULT_SIDEBAR_POSITION: SidebarPosition = "left";

// --- Storage Keys ---
const SIDEBAR_POSITION_KEY = "sidebarPosition";

// --- Getter Functions ---

export const getSidebarPosition = (): Promise<SidebarPosition> => {
    return new Promise((resolve) => {
        chrome.storage.sync.get(SIDEBAR_POSITION_KEY, (result) => {
            resolve(
                (result[SIDEBAR_POSITION_KEY] as SidebarPosition) ||
                    DEFAULT_SIDEBAR_POSITION,
            );
        });
    });
};

// --- Setter Functions ---

export const setSidebarPosition = (
    position: SidebarPosition,
): Promise<void> => {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ [SIDEBAR_POSITION_KEY]: position }, () => {
            resolve();
        });
    });
};