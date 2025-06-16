import { motion } from "motion/react";
import { SIDEBAR_HEADER_HEIGHT, SIDEBAR_HEADER_HEIGHT_COMPACT, SIDEBAR_HEADER_ICON_SIZE } from "../../constants";
import "../../css/components/sidebar/header.css";

interface HeaderProps {
    compact: boolean;
    position: "right" | "left";
    onToggleCompact: () => void;
    isLoading: boolean;
    onClose: () => void;
}

const Header = ({
    compact,
    position,
    onToggleCompact,
    isLoading,
    onClose,
}: HeaderProps) => {
    const getToggleButtonIcon = () => {
        return compact ? "expand.png" : "collapse.png";
    };

    const headerClasses = [
        "header",
        compact && "compact",
        `position-${position}`
    ].filter(Boolean).join(" ");

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
                className="header-icon icon"
                style={{
                    width: `${SIDEBAR_HEADER_ICON_SIZE}px`,
                    height: `${SIDEBAR_HEADER_ICON_SIZE}px`,
                }}
            />
            <div className="header-title-container">
                <h1 className="header-title-pause">
                    Pause
                </h1>
                <h1 className="header-title-shop">
                    Shop
                </h1>
            </div>
            {!isLoading && (
                <motion.div
                    className="button-container"
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
                                className="toggle-button"
                                onClick={onToggleCompact}
                            >
                                <img
                                    src={chrome.runtime.getURL(`icons/${getToggleButtonIcon()}`)}
                                    alt={compact ? "Expand" : "Collapse"}
                                    className="button-icon"
                                />
                            </button>
                            <button
                                className="close-button"
                                onClick={onClose}
                                title="Close PauseShop"
                            >
                                <img
                                    src={chrome.runtime.getURL("icons/close.png")}
                                    alt="Close"
                                    className="button-icon"
                                />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="close-button"
                                onClick={onClose}
                                title="Close PauseShop"
                            >
                                <img
                                    src={chrome.runtime.getURL("icons/close.png")}
                                    alt="Close"
                                    className="button-icon"
                                />
                            </button>
                            <button
                                className="toggle-button"
                                onClick={onToggleCompact}
                            >
                                <img
                                    src={chrome.runtime.getURL(`icons/${getToggleButtonIcon()}`)}
                                    alt={compact ? "Expand" : "Collapse"}
                                    className="button-icon"
                                />
                            </button>
                        </>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default Header;
