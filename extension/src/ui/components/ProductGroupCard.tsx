import React, { useState } from "react";
import { motion } from "motion/react";

const ProductGroupCard: React.FC<{ groupName: string; }> = ({ groupName }) => {
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
                    <p className="pauseshop-product-card-text">Mock content for thumbnails section.</p>
                </div>
            )}
        </motion.div>
    );
};

export default ProductGroupCard;
