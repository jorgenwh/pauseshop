"use client"

import {
    animate,
    motion,
    MotionValue,
    useMotionValue,
    useMotionValueEvent,
    useScroll,
} from "motion/react"
import { useRef } from "react"
import { AmazonScrapedProduct } from "../../types/amazon";

// Utility function to generate the mask image for overflow scrolling
const left = `0%`
const right = `100%`
const leftInset = `20%`
const rightInset = `80%`
const transparent = `#0000`
const opaque = `#000`

function useScrollOverflowMask(scrollXProgress: MotionValue<number>) {
    const maskImage = useMotionValue(
        `linear-gradient(90deg, ${opaque}, ${opaque} ${left}, ${opaque} ${rightInset}, ${transparent})`
    )

    useMotionValueEvent(scrollXProgress, "change", (value) => {
        if (value === 0) {
            animate(
                maskImage,
                `linear-gradient(90deg, ${opaque}, ${opaque} ${left}, ${opaque} ${rightInset}, ${transparent})`
            )
        } else if (value === 1) {
            animate(
                maskImage,
                `linear-gradient(90deg, ${transparent}, ${opaque} ${leftInset}, ${opaque} ${right}, ${opaque})`
            )
        } else if (
            scrollXProgress.getPrevious() === 0 ||
            scrollXProgress.getPrevious() === 1
        ) {
            animate(
                maskImage,
                `linear-gradient(90deg, ${transparent}, ${opaque} ${leftInset}, ${opaque} ${rightInset}, ${transparent})`
            )
        }
    })

    return maskImage
}

interface ProductThumbnailsScrollProps {
    thumbnails: AmazonScrapedProduct[];
}

const ProductThumbnailsScroll: React.FC<ProductThumbnailsScrollProps> = ({ thumbnails }) => {
    const ref = useRef(null);
    const { scrollXProgress } = useScroll({ container: ref });
    const maskImage = useScrollOverflowMask(scrollXProgress);

    return (
        <div className="pauseshop-thumbnails-scroll-container px-2">
            <motion.ul
                ref={ref}
                style={{ maskImage }}
                className="flex list-none p-0 m-0 overflow-x-scroll gap-4"
            >
                {thumbnails.map((thumb, index) => (
                    <li key={thumb.id || index} className="shrink-0">
                        <a href={thumb.productUrl} target="_blank" rel="noopener noreferrer">
                            <img
                                src={thumb.thumbnailUrl}
                                alt={`Product thumbnail ${index + 1}`}
                                className="w-24 h-24 object-cover rounded-md"
                            />
                        </a>
                    </li>
                ))}
            </motion.ul>
            {/* Styles for the scroll container */}
            <style>{`
                .pauseshop-thumbnails-scroll-container ul::-webkit-scrollbar {
                    height: 5px;
                    width: 5px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 1ex;
                }

                .pauseshop-thumbnails-scroll-container ul::-webkit-scrollbar-thumb {
                    background: var(--pauseshop-theme-trim-color); /* Using PauseShop theme trim color */
                    border-radius: 1ex;
                }

                .pauseshop-thumbnails-scroll-container ul::-webkit-scrollbar-corner {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
};

export default ProductThumbnailsScroll;