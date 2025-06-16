import "../../css/components/sidebar/loading-animation.css";
import { motion, Variants } from "motion/react";

const LoadingAnimation = () => {
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

    const dotColor = "rgba(230, 230, 230, 1)";

    return (
        <motion.div
            animate="jump"
            transition={{ staggerChildren: -0.2, staggerDirection: -1 }}
            className="loading-container"
        >
            <motion.div
                className="loading-dot"
                variants={dotVariants}
                style={{ backgroundColor: dotColor }}
            />
            <motion.div
                className="loading-dot"
                variants={dotVariants}
                style={{ backgroundColor: dotColor }}
            />
            <motion.div
                className="loading-dot"
                variants={dotVariants}
                style={{ backgroundColor: dotColor }}
            />
        </motion.div>
    );
};

export default LoadingAnimation;
