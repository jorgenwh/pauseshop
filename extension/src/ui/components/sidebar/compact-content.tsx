import { motion } from "motion/react";
import LoadingThreeDotsJumping from "./loading-animation";
import { ProductStorage } from "../../types";
import { getIconCounts, getUniqueIcons } from "../../utils";

interface CompactSidebarContentProps {
    productStorage: ProductStorage;
    isLoading: boolean;
    onIconClick: (iconCategory: string) => void;
}

const CompactSidebarContent = ({
    productStorage,
    isLoading,
    onIconClick,
}: CompactSidebarContentProps) => {
    const buildLoadingContent = () => {
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
                className="pauseshop-compact-icon-count"
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
                    className="pauseshop-compact-icon-container"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{
                        scale: 1.3
                    }}
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
                    onClick={() => onIconClick(iconCategory)}
                >
                    <img
                        src={chrome.runtime.getURL(
                            `icons/products/${iconCategory}.png`,
                        )}
                        alt={iconCategory}
                        className={`pauseshop-compact-icon icon`}
                    />
                    {buildCategoryCounter(iconCategory)}
                </motion.div>
            )) || null
        );
    }

    const buildNoProductsContent = () => {
        return (
            <div className="pauseshop-compact-sidebar-content">
                <p>No products to display.</p>
            </div>
        );
    }

    return (
        <div className="pauseshop-compact-sidebar-content">
            {
                isLoading ?
                    buildLoadingContent() :
                    iconCategories.size === 0 ?
                        buildNoProductsContent() :
                        buildContent()
            }
        </div>
    );
};

export default CompactSidebarContent;
