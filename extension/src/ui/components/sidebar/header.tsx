import { motion } from "motion/react";
import { 
    SIDEBAR_HEADER_HEIGHT, 
    SIDEBAR_HEADER_HEIGHT_COMPACT, 
    SIDEBAR_HEADER_COMPACT_ICON_SIZE,
    SIDEBAR_HEADER_EXPANDED_ICON_SIZE
} from "../../constants";
import "../../css/components/sidebar/header.css";
import { SidebarContentState } from "../../types";

interface HeaderProps {
    compact: boolean;
    position: "right" | "left";
    onToggleCompact: () => void;
    contentState: SidebarContentState;
    onClose: () => void;
}

const Header = ({
    compact,
    position,
    onToggleCompact,
    contentState,
    onClose,
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

        if (contentState === SidebarContentState.NO_PRODUCTS) {
            return (
                <motion.div
                    className="pauseshop-sidebar-button-container no-products"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                        duration: 0.4,
                        scale: {
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            bounce: 0.5,
                        },
                    }}
                >
                    <button
                        className="pauseshop-sidebar-close-button"
                        onClick={onClose}
                        title="Close PauseShop"
                    >
                        <img
                            src={chrome.runtime.getURL("icons/close.png")}
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
                animate={{ opacity: 1 }}
                transition={{
                    duration: 0.4,
                    scale: {
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        bounce: 0.5,
                    },
                }}
            >
                {position === "left" ? (
                    <>
                        <button
                            className="pauseshop-sidebar-toggle-button"
                            onClick={onToggleCompact}
                        >
                            <img
                                src={chrome.runtime.getURL(`icons/${getToggleButtonIcon()}`)}
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
                                src={chrome.runtime.getURL("icons/close.png")}
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
                                src={chrome.runtime.getURL("icons/close.png")}
                                alt="Close"
                                className="pauseshop-button-icon"
                            />
                        </button>
                        <button
                            className="pauseshop-sidebar-toggle-button"
                            onClick={onToggleCompact}
                        >
                            <img
                                src={chrome.runtime.getURL(`icons/${getToggleButtonIcon()}`)}
                                alt={compact ? "Expand" : "Collapse"}
                                className="pauseshop-button-icon"
                            />
                        </button>
                    </>
                )}
            </motion.div>
        );
    }

    return (
        <div
            className={headerClasses}
            style={{
                height: `${compact ? SIDEBAR_HEADER_HEIGHT_COMPACT : SIDEBAR_HEADER_HEIGHT}px`,
            }}
        >
            <img
                src={chrome.runtime.getURL("icons/icon-128.png")}
                alt="PauseShop Icon"
                className={"pauseshop-sidebar-header-icon icon" + (compact ? " compact" : "")}
                style={{
                    width: `${compact ? SIDEBAR_HEADER_COMPACT_ICON_SIZE : SIDEBAR_HEADER_EXPANDED_ICON_SIZE}px`,
                    height: `${compact ? SIDEBAR_HEADER_COMPACT_ICON_SIZE : SIDEBAR_HEADER_EXPANDED_ICON_SIZE}px`,
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
