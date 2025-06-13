import React, { useState } from "react";

const ProductCard: React.FC = () => { // Removed props for simplification
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div
            className="pauseshop-product-card shadow-md rounded-2xl bg-[var(--sidebar-bg)] border border-[var(--sidebar-border-color)] ml-3 mr-3 mb-3"
        >
            {/* Header */}
            <div
                className="pauseshop-product-card-header flex items-center justify-between p-4 cursor-pointer" // Added p-4 for internal header padding
                onClick={toggleExpand}
            >
                <div className="flex items-center">
                    <img
                        src="https://via.placeholder.com/48x48.png?text=Product"
                        alt="Mock Product"
                        className="w-12 h-12 rounded-md mr-4 object-cover"
                    />
                    <h3 className="text-white text-lg font-semibold">Mock Product Name</h3>
                </div>
                <span className="text-gray-400">{isExpanded ? "▲" : "▼"}</span>
            </div>

            {/* Collapsible Content */}
            {isExpanded && (
                <div className="pauseshop-product-card-content p-4 border-t border-gray-700"> {/* Already has p-4 */}
                    <p className="text-gray-400">Mock content for thumbnails section.</p>
                </div>
            )}
        </div>
    );
};

export default ProductCard;