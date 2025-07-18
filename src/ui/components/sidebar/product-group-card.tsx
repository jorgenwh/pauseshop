import React, { useState } from "react";
import "../../css/components/sidebar/product-group-card.css";
import { motion } from "motion/react";
import ProductThumbnailCarousel from "./product-thumbnail-carousel";
import { AmazonScrapedProduct } from "../../../types/amazon";

interface ProductGroupCardProps {
    groupName: string;
    thumbnails: AmazonScrapedProduct[];
    initialExpanded?: boolean;
    onProductClick?: (product: AmazonScrapedProduct) => void;
}

const ProductGroupCard = ({ groupName, thumbnails, initialExpanded = false, onProductClick }: ProductGroupCardProps) => {
    const [isExpanded, setIsExpanded] = useState(initialExpanded);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <motion.div
            className="freezeframe-product-card"
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
                className="freezeframe-product-card-header"
                onClick={toggleExpand}
            >
                <div className="freezeframe-product-card-header-content">
                    <h3 className="freezeframe-product-card-title">{groupName}</h3>
                </div>
                <span className="freezeframe-product-card-arrow">{isExpanded ? "▲" : "▼"}</span>
            </div>

            {/* Collapsible Content */}
            {isExpanded && (
                <div className="freezeframe-product-card-content"> {}
                    <ProductThumbnailCarousel thumbnails={thumbnails} onProductClick={onProductClick} />
                </div>
            )}
        </motion.div>
    );
};

export default ProductGroupCard;
