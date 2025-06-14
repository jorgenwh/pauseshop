import { motion } from "motion/react";
import { ProductStorage, SidebarContentState } from "../types";
import ProductGroupCard from "./ProductGroupCard";

const cardContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const cardVariants = {
    hidden: {y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "tween",
            ease: "easeOut",
            duration: 0.2,
        },
    },
};
interface ExpandedSidebarContentProps {
    contentState: SidebarContentState;
    productStorage: ProductStorage;
    expandedIconCategory: string | null;
}

const ExpandedSidebarContent = ({contentState, productStorage, expandedIconCategory }: ExpandedSidebarContentProps) => {
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
                    {productStorage.productGroups.map((group) => (
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

export default ExpandedSidebarContent;
