import React, { useState } from "react";

const ProductGroupCard: React.FC<{ groupName: string; }> = ({ groupName }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div
            className={`pauseshop-product-card`}
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
        </div>
    );
};

export default ProductGroupCard;
