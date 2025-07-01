import { storage } from "#imports";
import { ClickedProductInfo, ProductStorage, SidebarPosition } from "./ui/types";

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

export const clickedProductInfo = storage.defineItem<ClickedProductInfo | null>(
    "local:clickedProductInfo",
    {
        fallback: null,
    },
);

export const productStorage = storage.defineItem<ProductStorage | null>(
    "local:productStorage",
    {
        fallback: null,
    },
);
