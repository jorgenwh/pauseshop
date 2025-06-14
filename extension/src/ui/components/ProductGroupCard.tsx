import React, { useState } from "react";
import { motion } from "motion/react";
import ProductThumbnailsScroll from "./ProductThumbnailsScroll";
import { AmazonScrapedProduct } from "../../types/amazon";

interface ProductGroupCardProps {
    groupName: string;
    thumbnails: AmazonScrapedProduct[];
}

const ProductGroupCard: React.FC<ProductGroupCardProps> = ({ groupName, thumbnails }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <motion.div
            className={`pauseshop-product-card`}
            whileHover={{ scale: 1.03 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                bounce: 0.5,
            }}
        >
            {/* Header */}
            <div
                className="pauseshop-product-card-header"
                onClick={toggleExpand}
            >
                <div className="flex items-center">
                    <h3 className="pauseshop-product-card-title">{groupName}</h3>
                </div>
                <span className="pauseshop-product-card-arrow">{isExpanded ? "▲" : "▼"}</span>
            </div>

            {/* Collapsible Content */}
            {isExpanded && (
                <div className="pauseshop-product-card-content"> {}
                    <ProductThumbnailsScroll thumbnails={thumbnails} />
                </div>
            )}
        </motion.div>
    );
};

export default ProductGroupCard;
