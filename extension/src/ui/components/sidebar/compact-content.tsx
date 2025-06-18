import "../../css/components/sidebar/compact-content.css";
import { motion } from "motion/react";
import LoadingAnimation from "./loading-animation";
import { ProductStorage, SidebarContentState } from "../../types";
import { getIconCounts, getUniqueIcons } from "../../utils";

interface CompactContentProps {
    productStorage: ProductStorage;
    contentState: SidebarContentState;
    onIconClick: (iconCategory: string) => void;
    position: "right" | "left";
    firstIconHasCounter?: boolean;
    onRetryAnalysis: () => void;
}

const CompactContent = ({
    productStorage,
    contentState,
    onIconClick,
    position,
    firstIconHasCounter,
    onRetryAnalysis,
}: CompactContentProps) => {

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
                    style={{ marginTop: index === 0 && firstIconHasCounter ? '7px' : '0' }}
                    className="pauseshop-compact-icon-container"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{
                        scale: 1.2
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
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{
                    scale: 1.2
                }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    bounce: 0.5,
                }}
                onClick={onRetryAnalysis}
            >
                <img
                    src={chrome.runtime.getURL("icons/nothing-found.png")}
                    alt="No products found"
                    className="pauseshop-nothing-found-icon"
                />
            </motion.div>
        );
    }

    const renderContent = () => {
        switch (contentState) {
        case SidebarContentState.LOADING:
            return <LoadingAnimation />;
        case SidebarContentState.NO_PRODUCTS:
            return buildNoProductsContent();
        case SidebarContentState.PRODUCTS:
            return buildContent();
        default:
            return null;
        }
    }

    const compactContentClasses = [
        "pauseshop-compact-sidebar-content",
        `position-${position}`
    ].join(" ");

    return (
        <div className={compactContentClasses}>
            {renderContent()}
        </div>
    );
};

export default CompactContent;
