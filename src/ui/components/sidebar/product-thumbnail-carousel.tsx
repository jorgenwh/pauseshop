import { motion } from "motion/react";
import { useState, SVGProps } from "react";
import { AmazonScrapedProduct } from "../../../types/amazon";
import { AMAZON_MAX_PRODUCTS_DISPLAY_LIMIT } from "../../../amazon/constants";
import "../../css/components/sidebar/product-thumbnail-carousel.css";
import { safeTranslate } from "../../../utils/language";

interface ProductThumbnailCarouselProps {
    thumbnails: AmazonScrapedProduct[];
    onProductClick?: (product: AmazonScrapedProduct) => void;
}

const ProductThumbnailCarousel = ({ thumbnails, onProductClick }: ProductThumbnailCarouselProps) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Limit display to first 5 products while keeping all scraped data
    const displayThumbnails = thumbnails.slice(0, AMAZON_MAX_PRODUCTS_DISPLAY_LIMIT);

    // Handle empty thumbnails array
    if (!displayThumbnails || displayThumbnails.length === 0) {
        return (
            <div className="freezeframe-carousel-container">
                <div className="freezeframe-carousel-empty">
                    {safeTranslate('sidebar_carousel_noProducts', 'No products available')}
                </div>
            </div>
        );
    }

    // Handle single thumbnail
    if (displayThumbnails.length === 1) {
        const thumbnail = displayThumbnails[0];
        return (
            <div className="freezeframe-carousel-container">
                <div className="freezeframe-carousel-single">
                    <div 
                        onClick={() => handleProductClick(thumbnail)}
                        style={{ width: '100%', display: 'block', cursor: 'pointer' }}
                    >
                        <img
                            src={thumbnail.thumbnailUrl}
                            alt="Product thumbnail"
                            className="freezeframe-carousel-image"
                        />
                    </div>
                </div>
            </div>
        );
    }

    function navigate(newDirection: 1 | -1) {
        const nextIndex = selectedIndex + newDirection;
        if (nextIndex >= 0 && nextIndex < displayThumbnails.length) {
            setSelectedIndex(nextIndex);
        }
    }

    const isFirstItem = selectedIndex === 0;
    const isLastItem = selectedIndex === displayThumbnails.length - 1;

    const handleProductClick = (product: AmazonScrapedProduct) => {
        if (onProductClick) {
            onProductClick(product);
        }
    };

    return (
        <div className="freezeframe-carousel-container">
            <motion.button
                key="prev-button"
                className="freezeframe-carousel-button freezeframe-carousel-button-prev"
                aria-label={safeTranslate('sidebar_carousel_previousProduct', 'Previous product')}
                onClick={() => navigate(-1)}
                disabled={isFirstItem}
                whileFocus={!isFirstItem ? { outline: "2px solid var(--freezeframe-theme-trim-color)" } : {}}
                whileTap={!isFirstItem ? { scale: 0.9 } : {}}
                animate={{ 
                    opacity: isFirstItem ? 0.6 : 1,
                    scale: 1 
                }}
                transition={{
                    type: "spring",
                    visualDuration: 0.2,
                    bounce: 0.4,
                }}
            >
                <ArrowLeft />
            </motion.button>

            <div className="freezeframe-carousel-content">
                <motion.div
                    className="freezeframe-carousel-strip"
                    animate={{ 
                        x: `-${selectedIndex * 100}%` 
                    }}
                    transition={{
                        duration: 0.6, // 0.6 seconds for a smooth animation
                        ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier curve with strong deceleration
                        type: "tween"
                    }}
                >
                    {displayThumbnails.map((thumbnail, index) => (
                        <div key={index} className="freezeframe-carousel-slide">
                            <div 
                                onClick={() => handleProductClick(thumbnail)}
                                style={{ width: '100%', display: 'block', cursor: 'pointer' }}
                            >
                                <img
                                    src={thumbnail.thumbnailUrl}
                                    alt="Product thumbnail"
                                    className="freezeframe-carousel-image"
                                />
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            <motion.button
                key="next-button"
                className="freezeframe-carousel-button freezeframe-carousel-button-next"
                aria-label={safeTranslate('sidebar_carousel_nextProduct', 'Next product')}
                onClick={() => navigate(1)}
                disabled={isLastItem}
                whileFocus={!isLastItem ? { outline: "2px solid var(--freezeframe-theme-trim-color)" } : {}}
                whileTap={!isLastItem ? { scale: 0.9 } : {}}
                animate={{ 
                    opacity: isLastItem ? 0.6 : 1,
                    scale: 1 
                }}
                transition={{
                    type: "spring",
                    visualDuration: 0.2,
                    bounce: 0.4,
                }}
            >
                <ArrowRight />
            </motion.button>
        </div>
    );
};

// ThumbnailSlide component removed as we now use a strip-based approach

/**
 * ==============   Icons   ================
 */
const iconsProps: SVGProps<SVGSVGElement> = {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24", // Increased from 20 (20% larger)
    height: "24", // Increased from 20 (20% larger)
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
};

function ArrowLeft() {
    return (
        <svg {...iconsProps}>
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
        </svg>
    );
}

function ArrowRight() {
    return (
        <svg {...iconsProps}>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    );
}

export default ProductThumbnailCarousel;