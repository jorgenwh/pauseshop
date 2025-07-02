import { storage } from "#imports";
import {
    ClickedProductInfo,
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
