import React, { useState } from "react";

const ProductCard: React.FC = () => { // Removed props for simplification
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div
            className="pauseshop-product-card"
        >
            {/* Header */}
            <div
                className="pauseshop-product-card-header"
                onClick={toggleExpand}
            >
                <div className="flex items-center">
                    <img
                        src="https://m.media-amazon.com/images/I/91FJCIXf3bL._AC_SY110_.jpg"
                        alt="Mock Product"
                        className="pauseshop-product-card-image"
                    />
                    <h3 className="pauseshop-product-card-title">Mock Product Name</h3>
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

export default ProductCard;