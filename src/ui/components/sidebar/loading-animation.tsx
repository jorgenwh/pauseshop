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

    return (
        <motion.div
            animate="jump"
            transition={{ staggerChildren: -0.2, staggerDirection: -1 }}
            className="freezeframe-loading-container"
        >
            <motion.div
                className="freezeframe-loading-dot"
                variants={dotVariants}
            />
            <motion.div
                className="freezeframe-loading-dot"
                variants={dotVariants}
            />
            <motion.div
                className="freezeframe-loading-dot"
                variants={dotVariants}
            />
        </motion.div>
    );
};

export default LoadingAnimation;
