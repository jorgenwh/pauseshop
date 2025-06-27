import { useState, useEffect, useRef } from "react";

/**
 * Custom hook for detecting mouse proximity to an element
 * @param proximityDistance - Distance in pixels to trigger proximity
 * @param isEnabled - Whether proximity detection is enabled
 * @returns Object with proximity state and ref to attach to target element
 */
export const useProximityDetection = (
    proximityDistance: number = 10,
    isEnabled: boolean = true
) => {
    const [isNearby, setIsNearby] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isEnabled || !elementRef.current) {
            setIsNearby(false);
            return;
        }

        const element = elementRef.current;

        const checkProximity = (event: MouseEvent) => {
            const rect = element.getBoundingClientRect();
            const mouseX = event.clientX;
            const mouseY = event.clientY;

            // Calculate distance from mouse to the closest edge of the element
            const distanceX = Math.max(
                rect.left - mouseX,
                mouseX - rect.right,
                0
            );
            const distanceY = Math.max(
                rect.top - mouseY,
                mouseY - rect.bottom,
                0
            );

            // Use Euclidean distance for diagonal proximity
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            
            setIsNearby(distance <= proximityDistance);
        };

        // Add mouse move listener to document
        document.addEventListener('mousemove', checkProximity, { passive: true });

        return () => {
            document.removeEventListener('mousemove', checkProximity);
        };
    }, [proximityDistance, isEnabled]);

    return {
        isNearby,
        elementRef,
    };
};