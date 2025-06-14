"use client"

import {
    animate,
    motion,
    MotionValue,
    useMotionValue,
    useMotionValueEvent,
    useScroll,
} from "motion/react"
import { useRef, useEffect } from "react"
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
    const ref = useRef<HTMLUListElement>(null);
    const { scrollXProgress } = useScroll({ container: ref });
    const maskImage = useScrollOverflowMask(scrollXProgress);

    const animatedScrollLeft = useMotionValue(0);

    useEffect(() => {
        if (ref.current) {
            animatedScrollLeft.set(ref.current.scrollLeft);
        }
    }, [animatedScrollLeft]);

    useMotionValueEvent(animatedScrollLeft, "change", (latest) => {
        if (ref.current) {
            if (ref.current.scrollLeft !== latest) {
                ref.current.scrollLeft = latest;
            }
        }
    });

    return (
        <div className="pauseshop-thumbnails-scroll-container">
            <motion.ul
                ref={ref}
                style={{ maskImage }}
                className="pauseshop-thumbnails-list"
                onWheel={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (ref.current) {
                        const currentScrollPos = ref.current.scrollLeft;
                        const newTargetScrollPos = currentScrollPos + e.deltaY;
                        animate(animatedScrollLeft, newTargetScrollPos, { type: "spring", stiffness: 200, damping: 30, mass: 1 });
                    }
                }}
                onMouseEnter={() => {
                    document.body.style.overflow = 'hidden';
                }}
                onMouseLeave={() => {
                    document.body.style.overflow = '';
                }}
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



