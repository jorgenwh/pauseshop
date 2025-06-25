import { SidebarPosition } from "./ui/types";

// Default values
const DEFAULT_SIDEBAR_POSITION: SidebarPosition = "left";
const DEFAULT_SIDEBAR_COMPACT_STATE: boolean = true;

// --- Storage Keys ---
const SIDEBAR_POSITION_KEY = "sidebarPosition";
const SIDEBAR_COMPACT_STATE_KEY = "sidebarCompactState";

// --- Getter Functions ---

export const getSidebarPosition = (): Promise<SidebarPosition> => {
    return new Promise((resolve) => {
        browser.storage.sync.get(SIDEBAR_POSITION_KEY, (result) => {
            resolve(
                (result[SIDEBAR_POSITION_KEY] as SidebarPosition) ||
                DEFAULT_SIDEBAR_POSITION,
            );
        });
    });
};

export const getSidebarCompactState = (): Promise<boolean> => {
    return new Promise((resolve) => {
        browser.storage.sync.get(SIDEBAR_COMPACT_STATE_KEY, (result) => {
            resolve(
                (result[SIDEBAR_COMPACT_STATE_KEY] as boolean) ??
                DEFAULT_SIDEBAR_COMPACT_STATE,
            );
        });
    });
};

// --- Setter Functions ---

export const setSidebarPosition = (
    position: SidebarPosition,
): Promise<void> => {
    return new Promise((resolve) => {
        browser.storage.sync.set({ [SIDEBAR_POSITION_KEY]: position }, () => {
            resolve();
        });
    });
};

export const setSidebarCompactState = (isCompact: boolean): Promise<void> => {
    return new Promise((resolve) => {
        browser.storage.sync.set(
            { [SIDEBAR_COMPACT_STATE_KEY]: isCompact },
            () => {
                resolve();
            },
        );
    });
};
