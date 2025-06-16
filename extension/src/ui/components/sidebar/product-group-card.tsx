import React, { useState } from "react";
import "../../css/components/sidebar/product-group-card.css";
import { motion } from "motion/react";
import ProductThumbnailCarousel from "./product-thumbnail-carousel";
import { AmazonScrapedProduct } from "../../../types/amazon";

interface ProductGroupCardProps {
    groupName: string;
    thumbnails: AmazonScrapedProduct[];
    initialExpanded?: boolean;
}

const ProductGroupCard = ({ groupName, thumbnails, initialExpanded = false }: ProductGroupCardProps) => {
    const [isExpanded, setIsExpanded] = useState(initialExpanded);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <motion.div
            className={`product-card`}
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
                className="product-card-header"
                onClick={toggleExpand}
            >
                <div className="flex items-center">
                    <h3 className="product-card-title">{groupName}</h3>
                </div>
                <span className="product-card-arrow">{isExpanded ? "▲" : "▼"}</span>
            </div>

            {/* Collapsible Content */}
            {isExpanded && (
                <div className="product-card-content"> {}
                    <ProductThumbnailCarousel thumbnails={thumbnails} />
                </div>
            )}
        </motion.div>
    );
};

export default ProductGroupCard;
