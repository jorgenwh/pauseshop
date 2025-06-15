"use client"

import { motion } from "framer-motion";
import { useRef, useEffect } from "react";
import { AmazonScrapedProduct } from "../../../types/amazon";

interface ProductThumbnailsScrollProps {
    thumbnails: AmazonScrapedProduct[];
}

const ProductThumbnailsScroll = ({ thumbnails }: ProductThumbnailsScrollProps) => {
    const ref = useRef<HTMLUListElement>(null);

    useEffect(() => {
        const scrollStep = 75; // Define a fixed scroll step size in pixels
        const currentRef = ref.current;

        const handleWheel = (event: WheelEvent) => {
            if (currentRef) {
                event.preventDefault(); // Prevent default vertical scroll behavior

                if (event.deltaY < 0 || event.deltaX < 0) {
                    currentRef.scrollLeft -= scrollStep; // Scroll left (up on wheel)
                } else if (event.deltaY > 0 || event.deltaX > 0) {
                    currentRef.scrollLeft += scrollStep; // Scroll right (down on wheel)
                }
            }
        };

        if (currentRef) {
            // Add wheel event listener
            currentRef.addEventListener('wheel', handleWheel, { passive: false });

            return () => {
                currentRef.removeEventListener('wheel', handleWheel);
            };
        }
    }, [thumbnails]);


    return (
        <div className="pauseshop-thumbnails-scroll-container">
            <motion.ul
                ref={ref}
                className="pauseshop-thumbnails-list"
            >
                {thumbnails.map((thumb, index) => (
                    <li key={thumb.id || index} className="pauseshop-thumbnail-list-item">
                        <a href={thumb.productUrl} target="_blank" rel="noopener noreferrer">
                            <img
                                src={thumb.thumbnailUrl}
                                alt={`Product thumbnail ${index + 1}`}
                                className="pauseshop-thumbnail-image"
                            />
                        </a>
                    </li>
                ))}
            </motion.ul>
        </div>
    );
};

export default ProductThumbnailsScroll;
