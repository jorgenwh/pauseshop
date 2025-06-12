import { motion } from "motion/react";
import LoadingThreeDotsJumping from "./LoadingThreeDotsJumping"; // Import the new component
import { ProductStorage } from "../types";
import { getIconCounts, getUniqueIcons } from "../utils";

interface CollapsedSidebarContentProps {
    productStorage: ProductStorage;
    isLoading: boolean;
}

const CollapsedSidebarContent = ({
    productStorage,
    isLoading,
}: CollapsedSidebarContentProps) => {
    if (isLoading) {
        return (
            <LoadingThreeDotsJumping />
        );
    }

    const iconCounts = getIconCounts(productStorage);
    const iconCategories = getUniqueIcons(productStorage);

    const buildCategoryCounter = (iconCategory: string) => {
        if (iconCounts[iconCategory] <= 1) {
            return null;
        }

        return (
            <motion.span
                key={iconCounts[iconCategory]}
                className="pauseshop-collapsed-icon-count"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    bounce: 0.7,
                }}
            >
                {iconCounts[iconCategory]}
            </motion.span>
        );
    }

    const buildContent = () => {
        return (
            Array.from(iconCategories.values()).map((iconCategory, index) => (
                <motion.div
                    key={iconCategory}
                    className="pauseshop-collapsed-icon-container"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.4,
                        scale: {
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            bounce: 0.5,
                        },
                        delay: index * 0.05,
                    }}
                >
                    <img
                        src={chrome.runtime.getURL(
                            `icons/products/${iconCategory}.png`,
                        )}
                        alt={iconCategory}
                        className={`pauseshop-collapsed-icon icon`}
                    />
                    {buildCategoryCounter(iconCategory)}
                </motion.div>
            )) || null
        );
    }

    const buildNoProductsContent = () => {
        return (
            <div className="pauseshop-collapsed-sidebar-content">
                <p>No products to display.</p>
            </div>
        );
    }

    return (
        <div className="pauseshop-collapsed-sidebar-content">
            {
                iconCategories.size === 0 ? 
                    buildNoProductsContent() : 
                    buildContent()
            }
        </div>
    );
};

export default CollapsedSidebarContent;
