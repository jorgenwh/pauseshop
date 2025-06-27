import { motion } from "motion/react";
import "../../css/components/sidebar/header.css";
import { SidebarContentState } from "../../types";

interface HeaderProps {
    compact: boolean;
    position: "right" | "left";
    onToggleCompact: () => void;
    contentState: SidebarContentState;
    onClose: () => void;
    showButtonsInCompact?: boolean;
}

const Header = ({
    compact,
    position,
    onToggleCompact,
    contentState,
    onClose,
    showButtonsInCompact = true,
}: HeaderProps) => {
    const getToggleButtonIcon = () => {
        return compact ? "expand.png" : "collapse.png";
    };

    const headerClasses = [
        "pauseshop-sidebar-header",
        compact && "pauseshop-sidebar-compact",
        `position-${position}`
    ].filter(Boolean).join(" ");

    const renderButtons = () => {
        if (contentState === SidebarContentState.LOADING) {
            return null;
        }

        // In compact mode, only show buttons when mouse is nearby
        const shouldShowButtons = !compact || showButtonsInCompact;

        if (contentState === SidebarContentState.NO_PRODUCTS) {
            return (
                <motion.div
                    className="pauseshop-sidebar-button-container no-products"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: shouldShowButtons ? 1 : 0 }}
                    transition={{
                        duration: 0.2,
                        scale: {
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            bounce: 0.5,
                        },
                    }}
                    style={{
                        pointerEvents: shouldShowButtons ? "auto" : "none",
                    }}
                >
                    <button
                        className="pauseshop-sidebar-close-button"
                        onClick={onClose}
                        title="Close PauseShop"
                    >
                        <img
                            src={browser.runtime.getURL("/icons/close.png")}
                            alt="Close"
                            className="pauseshop-button-icon"
                        />
                    </button>
                </motion.div>
            );
        }

        return (
            <motion.div
                className="pauseshop-sidebar-button-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: shouldShowButtons ? 1 : 0 }}
                transition={{
                    duration: 0.2,
                    scale: {
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        bounce: 0.5,
                    },
                }}
                style={{
                    pointerEvents: shouldShowButtons ? "auto" : "none",
                }}
            >
                {position === "left" ? (
                    <>
                        <button
                            className="pauseshop-sidebar-toggle-button"
                            onClick={onToggleCompact}
                        >
                            <img
                                src={browser.runtime.getURL(`/icons/${getToggleButtonIcon()}`)}
                                alt={compact ? "Expand" : "Collapse"}
                                className="pauseshop-button-icon"
                            />
                        </button>
                        <button
                            className="pauseshop-sidebar-close-button"
                            onClick={onClose}
                            title="Close PauseShop"
                        >
                            <img
                                src={browser.runtime.getURL("/icons/close.png")}
                                alt="Close"
                                className="pauseshop-button-icon"
                            />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className="pauseshop-sidebar-close-button"
                            onClick={onClose}
                            title="Close PauseShop"
                        >
                            <img
                                src={browser.runtime.getURL("/icons/close.png")}
                                alt="Close"
                                className="pauseshop-button-icon"
                            />
                        </button>
                        <button
                            className="pauseshop-sidebar-toggle-button"
                            onClick={onToggleCompact}
                        >
                            <img
                                src={browser.runtime.getURL(`/icons/${getToggleButtonIcon()}`)}
                                alt={compact ? "Expand" : "Collapse"}
                                className="pauseshop-button-icon"
                            />
                        </button>
                    </>
                )}
            </motion.div>
        );
    };

    return (
        <div
            className={headerClasses}
            style={{
                height: `${compact ? 35 : 45}px`,
            }}
        >
            <img
                src={browser.runtime.getURL("/icons/icon-128.png")}
                alt="PauseShop Icon"
                className={"pauseshop-sidebar-header-icon icon" + (compact ? " compact" : "")}
                style={{
                    width: "30px",
                    height: "30px",
                }}
            />
            <div className="pauseshop-sidebar-header-title-container">
                <h1 className="pauseshop-sidebar-header-title-pause">
                    Pause
                </h1>
                <h1 className="pauseshop-sidebar-header-title-shop">
                    Shop
                </h1>
            </div>
            {renderButtons()}
        </div>
    );
};

export default Header;
