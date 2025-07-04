import { storage } from "#imports";
import {
    ProductGroup,
    ProductStorage,
    SidebarPosition,
} from "./ui/types";
import { AmazonScrapedProduct } from "./types/amazon";

export const sidebarPosition = storage.defineItem<SidebarPosition>(
    "local:sidebarPosition",
    {
        fallback: "left",
    },
);

export const sidebarCompactState = storage.defineItem<boolean>(
    "local:sidebarCompactState",
    {
        fallback: true,
    },
);

export type SessionData = ProductStorage & {
    clickedProduct?: AmazonScrapedProduct;
};

export const sessionData = storage.defineItem<SessionData | null>("local:session", {
    fallback: null,
});

export interface ClickHistoryEntry {
    pauseId: string;
    clickedProduct: AmazonScrapedProduct;
    productGroup: ProductGroup;
    // Deep search metadata
    hasDeepSearch?: boolean;    // Whether deep search was performed for this session
    deepSearchTimestamp?: number; // When deep search was completed (Unix timestamp)
}

export type ClickHistoryStorage = ClickHistoryEntry[];

export const MAX_CLICK_HISTORY_ENTRIES = 20;

export const clickHistory = storage.defineItem<ClickHistoryStorage>(
    "local:clickHistory",
    {
        fallback: [],
    },
);
