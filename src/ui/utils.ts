import { ProductStorage } from "./types";
import { getLocalizedIconCategory } from "../utils/icon-category-localization";

export const getUniqueIcons = (productStorage: ProductStorage): Set<string> => {
    const uniqueIcons = new Set<string>();

    for (const group of productStorage.productGroups) {
        const iconCategory = group.product.iconCategory;
        uniqueIcons.add(iconCategory);
    }

    return uniqueIcons
}

// Helper function to format icon text using localized mappings
export const formatIconText = (iconText: string): string => {
    return getLocalizedIconCategory(iconText);
};


export const getIconCounts = (productStorage: ProductStorage): Record<string, number> => {
    const iconCounts: Record<string, number> = {};

    for (const group of productStorage.productGroups) {
        const iconCategory = group.product.iconCategory;
        if (iconCounts[iconCategory]) {
            iconCounts[iconCategory]++;
        } else {
            iconCounts[iconCategory] = 1;
        }
    }

    return iconCounts;
}
