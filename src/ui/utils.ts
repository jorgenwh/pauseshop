import { ProductStorage } from "./types";

export const getUniqueIcons = (productStorage: ProductStorage): Set<string> => {
    const uniqueIcons = new Set<string>();

    for (const group of productStorage.productGroups) {
        const iconCategory = group.product.iconCategory;
        uniqueIcons.add(iconCategory);
    }

    return uniqueIcons
}

// Helper function to format icon text: replace dashes with spaces and capitalize first letter
export const formatIconText = (iconText: string): string => {
    // Replace all dashes with spaces
    const textWithSpaces = iconText.replace(/-/g, ' ');
    // Capitalize the first letter
    return textWithSpaces.charAt(0).toUpperCase() + textWithSpaces.slice(1);
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
