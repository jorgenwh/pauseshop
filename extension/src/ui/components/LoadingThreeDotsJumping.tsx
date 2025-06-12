import React from "react";
import { motion, Variants } from "motion/react";

interface LoadingThreeDotsJumpingProps {
    darkMode: boolean;
}

const LoadingThreeDotsJumping: React.FC<LoadingThreeDotsJumpingProps> = ({ darkMode }) => {
    const dotVariants: Variants = {
        jump: {
            y: -30,
            transition: {
                duration: 0.8,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
            },
        },
    };

    const dotColor = darkMode ? "#A0A0A0" : "#ff0088"; // Use a gray for dark mode, original for light

    return (
        <motion.div
            animate="jump"
            transition={{ staggerChildren: -0.2, staggerDirection: -1 }}
            className="pauseshop-loading-container"
        >
            <motion.div className="pauseshop-loading-dot" variants={dotVariants} style={{ backgroundColor: dotColor }} />
            <motion.div className="pauseshop-loading-dot" variants={dotVariants} style={{ backgroundColor: dotColor }} />
            <motion.div className="pauseshop-loading-dot" variants={dotVariants} style={{ backgroundColor: dotColor }} />
        </motion.div>
    );
}

export default LoadingThreeDotsJumping;