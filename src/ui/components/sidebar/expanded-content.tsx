import { motion, Variants } from "motion/react";
import { ProductStorage, SidebarContentState } from "../../types";
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
    hidden: {y: 20, opacity: 0 },
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
}

const ExpandedContent = ({contentState, productStorage, expandedIconCategory }: ExpandedContentProps) => {
    return (
        <div className="pauseshop-expanded-sidebar-content">
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
