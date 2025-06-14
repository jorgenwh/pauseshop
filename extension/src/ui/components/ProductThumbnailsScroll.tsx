"use client"

import { motion, useScroll } from "framer-motion";
import { useRef, useEffect } from "react";
import { AmazonScrapedProduct } from "../../types/amazon";

interface ProductThumbnailsScrollProps {
    thumbnails: AmazonScrapedProduct[];
}

const ProductThumbnailsScroll: React.FC<ProductThumbnailsScrollProps> = ({ thumbnails }) => {
    const ref = useRef<HTMLUListElement>(null);
    const { scrollXProgress } = useScroll({ container: ref });

    useEffect(() => {
        const scrollStep = 100; // Define a fixed scroll step size in pixels

        const handleWheel = (event: WheelEvent) => {
            if (ref.current) {
                // Prevent default vertical scroll behavior of the page
                event.preventDefault();

                // Determine scroll direction and apply fixed step
                if (event.deltaY < 0 || event.deltaX < 0) {
                    // Scroll left (up on wheel)
                    ref.current.scrollLeft -= scrollStep;
                } else if (event.deltaY > 0 || event.deltaX > 0) {
                    // Scroll right (down on wheel)
                    ref.current.scrollLeft += scrollStep;
                }
            }
        };

        const currentRef = ref.current;
        if (currentRef) {
            // Use passive: false to ensure preventDefault() works
            currentRef.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            if (currentRef) {
                currentRef.removeEventListener('wheel', handleWheel);
            }
        };
    }, []);

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
