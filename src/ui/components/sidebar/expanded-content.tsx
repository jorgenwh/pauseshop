import { motion, Variants } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { ProductStorage, SidebarContentState } from "../../types";
import { AmazonScrapedProduct } from "../../../types/amazon";
import ProductGroupCard from "./product-group-card";
import "../../css/components/sidebar/expanded-content.css";

const cardContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const cardVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "tween" as const,
            ease: "easeOut",
            duration: 0.2,
        },
    },
};
interface ExpandedContentProps {
    contentState: SidebarContentState;
    productStorage: ProductStorage;
    expandedIconCategory: string | null;
    onProductClick?: (product: AmazonScrapedProduct) => void;
}

const ExpandedContent = ({ contentState, productStorage, expandedIconCategory, onProductClick }: ExpandedContentProps) => {
    const [showScrollbar, setShowScrollbar] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Check if content height approaches max height (60vh)
    useEffect(() => {
        if (contentState !== SidebarContentState.PRODUCTS || !contentRef.current) {
            return;
        }

        // Create a ResizeObserver to monitor content height changes
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const contentHeight = entry.contentRect.height;
                const maxHeight = window.innerHeight * 0.6; // 60vh
                // Add a tiny 1px buffer to max height to account for rounding
                const thresholdHeight = maxHeight - 1; // Show scrollbar just 1px before max height

                // Enable scrollbar when content is extremely close to max height
                setShowScrollbar(contentHeight >= thresholdHeight);
            }
        });

        resizeObserver.observe(contentRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [contentState, productStorage]);

    const contentClasses = [
        "pauseshop-expanded-sidebar-content",
        showScrollbar ? "show-scrollbar" : "hide-scrollbar"
    ].join(" ");

    return (
        <div className={contentClasses} ref={contentRef}>
            {contentState === SidebarContentState.LOADING && (
                <p className="text-white">Loading products...</p>
            )}
            {contentState === SidebarContentState.PRODUCTS && (
                <motion.div
                    className="pauseshop-product-list"
                    variants={cardContainerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {productStorage.productGroups
                        .slice() // Create a shallow copy to avoid mutating the original prop
                        .sort((a, b) => {
                            const aMatches = expandedIconCategory === a.product.iconCategory;
                            const bMatches = expandedIconCategory === b.product.iconCategory;

                            if (aMatches && !bMatches) {
                                return -1; // a comes before b
                            }
                            if (!aMatches && bMatches) {
                                return 1; // b comes before a
                            }
                            return 0; // Preserve original order if both match or both don't match
                        })
                        .map((group) => (
                            <motion.div
                                key={group.product.name}
                                variants={cardVariants}
                            >
                                <ProductGroupCard
                                    groupName={group.product.name}
                                    thumbnails={group.scrapedProducts}
                                    initialExpanded={expandedIconCategory === group.product.iconCategory}
                                    onProductClick={onProductClick}
                                />
                            </motion.div>
                        ))}
                </motion.div>
            )}
            {contentState === SidebarContentState.NO_PRODUCTS && (
                <p className="text-white">No products found.</p>
            )}
            {contentState === SidebarContentState.ERROR && (
                <p className="text-red-500">An error occurred. Check console for details.</p>
            )}
        </div>
    );
};

export default ExpandedContent;
