import { storage } from "#imports";
import {
    ClickedProductInfo,
    ProductGroup,
    ProductStorage,
    SidebarPosition,
} from "./ui/types";

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

export type SessionData = ProductStorage & Partial<ClickedProductInfo>;

export const sessionData = storage.defineItem<SessionData | null>("local:session", {
    fallback: null,
});

export interface ClickHistoryEntry extends ClickedProductInfo {
    productGroup: ProductGroup;
}

export type ClickHistoryStorage = {
    [pauseId: string]: ClickHistoryEntry[];
};

export const clickHistory = storage.defineItem<ClickHistoryStorage>(
    "local:clickHistory",
    {
        fallback: {},
    },
);
