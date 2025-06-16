"use client"

import { AnimatePresence, motion } from "motion/react";
import { useState, forwardRef, SVGProps } from "react";
import { AmazonScrapedProduct } from "../../../types/amazon";
import "../../css/components/sidebar/product-thumbnail-carousel.css";

interface ProductThumbnailCarouselProps {
    thumbnails: AmazonScrapedProduct[];
}

const ProductThumbnailCarousel = ({ thumbnails }: ProductThumbnailCarouselProps) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [direction, setDirection] = useState<1 | -1>(1);

    // Handle empty thumbnails array
    if (!thumbnails || thumbnails.length === 0) {
        return (
            <div className="carousel-container">
                <div className="carousel-empty">
                    No products available
                </div>
            </div>
        );
    }

    // Handle single thumbnail
    if (thumbnails.length === 1) {
        const thumbnail = thumbnails[0];
        return (
            <div className="carousel-container">
                <div className="carousel-single">
                    <a href={thumbnail.productUrl} target="_blank" rel="noopener noreferrer">
                        <img
                            src={thumbnail.thumbnailUrl}
                            alt="Product thumbnail"
                            className="carousel-image"
                        />
                    </a>
                </div>
            </div>
        );
    }

    function navigate(newDirection: 1 | -1) {
        const nextIndex = selectedIndex + newDirection;
        if (nextIndex >= 0 && nextIndex < thumbnails.length) {
            setSelectedIndex(nextIndex);
            setDirection(newDirection);
        }
    }

    const currentThumbnail = thumbnails[selectedIndex];
    const isFirstItem = selectedIndex === 0;
    const isLastItem = selectedIndex === thumbnails.length - 1;

    return (
        <div className="carousel-container">
            <AnimatePresence>
                {!isFirstItem && (
                    <motion.button
                        key="prev-button"
                        className="carousel-button carousel-button-prev"
                        aria-label="Previous product"
                        onClick={() => navigate(-1)}
                        whileFocus={{ outline: "2px solid var(--pauseshop-theme-trim-color)" }}
                        whileTap={{ scale: 0.9 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                            type: "spring",
                            visualDuration: 0.2,
                            bounce: 0.4,
                        }}
                    >
                        <ArrowLeft />
                    </motion.button>
                )}
            </AnimatePresence>

            <div className="carousel-content">
                <AnimatePresence
                    custom={direction}
                    initial={false}
                    mode="popLayout"
                >
                    <ThumbnailSlide
                        key={selectedIndex}
                        thumbnail={currentThumbnail}
                        direction={direction}
                    />
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {!isLastItem && (
                    <motion.button
                        key="next-button"
                        className="carousel-button carousel-button-next"
                        aria-label="Next product"
                        onClick={() => navigate(1)}
                        whileFocus={{ outline: "2px solid var(--pauseshop-theme-trim-color)" }}
                        whileTap={{ scale: 0.9 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                            type: "spring",
                            visualDuration: 0.2,
                            bounce: 0.4,
                        }}
                    >
                        <ArrowRight />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

const ThumbnailSlide = forwardRef<
    HTMLDivElement,
    { thumbnail: AmazonScrapedProduct; direction: number }
>(function ThumbnailSlide({ thumbnail, direction }, ref) {
    return (
        <motion.div
            ref={ref}
            className="carousel-slide"
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{
                opacity: 1,
                x: 0,
                transition: {
                    delay: 0.1,
                    type: "spring",
                    visualDuration: 0.3,
                    bounce: 0.4,
                },
            }}
            exit={{ opacity: 0, x: direction * -50 }}
        >
            <a href={thumbnail.productUrl} target="_blank" rel="noopener noreferrer">
                <img
                    src={thumbnail.thumbnailUrl}
                    alt="Product thumbnail"
                    className="carousel-image"
                />
            </a>
        </motion.div>
    );
});

/**
 * ==============   Icons   ================
 */
const iconsProps: SVGProps<SVGSVGElement> = {
    xmlns: "http://www.w3.org/2000/svg",
    width: "20",
    height: "20",
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