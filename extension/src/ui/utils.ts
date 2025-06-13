import { ProductStorage } from "./types";

export const getUniqueIcons = (productStorage: ProductStorage): Set<string> => {
    const uniqueIcons = new Set<string>();

    for (const group of productStorage.productGroups) {
        const iconCategory = group.product.iconCategory;
        uniqueIcons.add(iconCategory);
    }

    return uniqueIcons
}

export const countUniqueIcons = (productStorage: ProductStorage): number => {
    return getUniqueIcons(productStorage).size;
}

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
