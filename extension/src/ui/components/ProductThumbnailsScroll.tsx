"use client"

import { motion, useScroll, useMotionValue, useMotionValueEvent, animate } from "framer-motion";
import { useRef, useEffect } from "react";
import { AmazonScrapedProduct } from "../../types/amazon";

// Constants for mask gradient
const left = `0%`;
const right = `100%`;
const leftInset = `20%`; // Original 20%
const rightInset = `80%`; // Original 80%
const transparent = `#0000`; // Fully transparent
const opaque = `#000`;      // Fully opaque

interface ProductThumbnailsScrollProps {
    thumbnails: AmazonScrapedProduct[];
}

const ProductThumbnailsScroll: React.FC<ProductThumbnailsScrollProps> = ({ thumbnails }) => {
    const ref = useRef<HTMLUListElement>(null);
    const { scrollXProgress } = useScroll({ container: ref });

    // Initialize maskImage as a MotionValue
    const maskImage = useMotionValue<string>(
        `linear-gradient(to right, ${transparent}, ${opaque} ${leftInset}, ${opaque} ${rightInset}, ${transparent})`
    );

    // useMotionValueEvent to animate the maskImage string based on scroll progress
    useMotionValueEvent(scrollXProgress, "change", (value) => {
        const prevValue = scrollXProgress.getPrevious(); // Get the value before the current change
        const currentScrollPosition = value;

        // Condition 1: Scrolled to the absolute left (value is 0)
        if (currentScrollPosition === 0) {
            animate(
                maskImage,
                `linear-gradient(to right, ${opaque}, ${opaque} ${rightInset}, ${transparent})`
            );
        }
        // Condition 2: Scrolled to the absolute right (value is 1)
        else if (currentScrollPosition === 1) {
            animate(
                maskImage,
                `linear-gradient(to right, ${transparent}, ${opaque} ${leftInset}, ${opaque})`
            );
        }
        // Condition 3: Transitioning from an extreme end (0 or 1) to the middle, OR
        //               already in the middle and continuing to scroll
        else if (prevValue === 0 || prevValue === 1 || (currentScrollPosition > 0 && currentScrollPosition < 1)) {
            animate(
                maskImage,
                `linear-gradient(to right, ${transparent}, ${opaque} ${leftInset}, ${opaque} ${rightInset}, ${transparent})`
            );
        }
    });

    useEffect(() => {
        const scrollStep = 100; // Define a fixed scroll step size in pixels
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

        const checkInitialMaskState = () => {
            if (currentRef) {
                const { scrollWidth, clientWidth, scrollLeft } = currentRef;
                const hasOverflow = scrollWidth > clientWidth;

                if (!hasOverflow) {
                    // No overflow, set mask to fully opaque (no mask effect visible)
                    maskImage.set(`linear-gradient(to right, ${opaque}, ${opaque})`);
                } else {
                    // Check initial scroll position to set initial mask
                    if (scrollLeft === 0) {
                        maskImage.set(`linear-gradient(to right, ${opaque}, ${opaque} ${rightInset}, ${transparent})`);
                    } else if (scrollLeft + clientWidth >= scrollWidth) {
                        maskImage.set(`linear-gradient(to right, ${transparent}, ${opaque} ${leftInset}, ${opaque})`);
                    } else {
                        maskImage.set(`linear-gradient(to right, ${transparent}, ${opaque} ${leftInset}, ${opaque} ${rightInset}, ${transparent})`);
                    }
                }
            }
        };

        if (currentRef) {
            // Add wheel event listener
            currentRef.addEventListener('wheel', handleWheel, { passive: false });

            // Initialize mask state on mount
            checkInitialMaskState();

            // Use ResizeObserver to re-evaluate mask state when container size changes
            // (e.g., due to image loading or parent component resizing)
            const resizeObserver = new ResizeObserver(checkInitialMaskState);
            resizeObserver.observe(currentRef);

            return () => {
                currentRef.removeEventListener('wheel', handleWheel);
                resizeObserver.disconnect();
            };
        }
    }, [thumbnails]); // Re-run effect if thumbnails change


    return (
        <div className="pauseshop-thumbnails-scroll-container">
            <motion.ul
                ref={ref}
                className="pauseshop-thumbnails-list"
                // Apply the motion value directly to the style prop
                style={{ maskImage: maskImage, WebkitMaskImage: maskImage }}
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
