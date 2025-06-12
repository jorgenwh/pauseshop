import { motion, Variants } from "motion/react";

const LoadingThreeDotsJumping = () => {
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

    const dotColor = "#A0A0A0";

    return (
        <motion.div
            animate="jump"
            transition={{ staggerChildren: -0.2, staggerDirection: -1 }}
            className="pauseshop-loading-container"
        >
            <motion.div
                className="pauseshop-loading-dot"
                variants={dotVariants}
                style={{ backgroundColor: dotColor }}
            />
            <motion.div
                className="pauseshop-loading-dot"
                variants={dotVariants}
                style={{ backgroundColor: dotColor }}
            />
            <motion.div
                className="pauseshop-loading-dot"
                variants={dotVariants}
                style={{ backgroundColor: dotColor }}
            />
        </motion.div>
    );
};

export default LoadingThreeDotsJumping;
