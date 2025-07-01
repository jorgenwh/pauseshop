import { storage } from "#imports";
import { SidebarPosition } from "./ui/types";

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
