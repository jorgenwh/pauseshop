import { motion } from "motion/react";
import "../../css/components/sidebar/header.css";
import { SidebarContentState } from "../../types";
import { isYouTubeShorts } from "./positioning/youtube-shorts-utils";

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
        "freezeframe-sidebar-header",
        compact && "freezeframe-sidebar-compact",
        `position-${position}`
    ].filter(Boolean).join(" ");

    const renderButtons = () => {
        // In compact mode, only show buttons when mouse is nearby
        const shouldShowButtons = !compact || showButtonsInCompact;

        if (contentState === SidebarContentState.LOADING) {
            // During loading, only show close button in compact mode when mouse is nearby
            return (
                <motion.div
                    className="freezeframe-sidebar-button-container no-products"
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
                        className="freezeframe-sidebar-close-button"
                        onClick={onClose}
                        title="Close FreezeFrame"
                    >
                        <img
                            src={browser.runtime.getURL("/icons/close.png")}
                            alt="Close"
                            className="freezeframe-button-icon"
                        />
                    </button>
                </motion.div>
            );
        }

        if (contentState === SidebarContentState.NO_PRODUCTS) {
            return (
                <motion.div
                    className="freezeframe-sidebar-button-container no-products"
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
                        className="freezeframe-sidebar-close-button"
                        onClick={onClose}
                        title="Close FreezeFrame"
                    >
                        <img
                            src={browser.runtime.getURL("/icons/close.png")}
                            alt="Close"
                            className="freezeframe-button-icon"
                        />
                    </button>
                </motion.div>
            );
        }

        const isOnYouTubeShorts = isYouTubeShorts(window.location.href);
        const shouldFlipButtonOrder = isOnYouTubeShorts && !compact;

        return (
            <motion.div
                className="freezeframe-sidebar-button-container"
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
                    shouldFlipButtonOrder ? (
                        <>
                            <button
                                className="freezeframe-sidebar-close-button"
                                onClick={onClose}
                                title="Close FreezeFrame"
                            >
                                <img
                                    src={browser.runtime.getURL("/icons/close.png")}
                                    alt="Close"
                                    className="freezeframe-button-icon"
                                />
                            </button>
                            <button
                                className="freezeframe-sidebar-toggle-button"
                                onClick={onToggleCompact}
                            >
                                <img
                                    src={browser.runtime.getURL(`/icons/${getToggleButtonIcon()}`)}
                                    alt={compact ? "Expand" : "Collapse"}
                                    className="freezeframe-button-icon"
                                />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="freezeframe-sidebar-toggle-button"
                                onClick={onToggleCompact}
                            >
                                <img
                                    src={browser.runtime.getURL(`/icons/${getToggleButtonIcon()}`)}
                                    alt={compact ? "Expand" : "Collapse"}
                                    className="freezeframe-button-icon"
                                />
                            </button>
                            <button
                                className="freezeframe-sidebar-close-button"
                                onClick={onClose}
                                title="Close FreezeFrame"
                            >
                                <img
                                    src={browser.runtime.getURL("/icons/close.png")}
                                    alt="Close"
                                    className="freezeframe-button-icon"
                                />
                            </button>
                        </>
                    )
                ) : (
                    shouldFlipButtonOrder ? (
                        <>
                            <button
                                className="freezeframe-sidebar-toggle-button"
                                onClick={onToggleCompact}
                            >
                                <img
                                    src={browser.runtime.getURL(`/icons/${getToggleButtonIcon()}`)}
                                    alt={compact ? "Expand" : "Collapse"}
                                    className="freezeframe-button-icon"
                                />
                            </button>
                            <button
                                className="freezeframe-sidebar-close-button"
                                onClick={onClose}
                                title="Close FreezeFrame"
                            >
                                <img
                                    src={browser.runtime.getURL("/icons/close.png")}
                                    alt="Close"
                                    className="freezeframe-button-icon"
                                />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="freezeframe-sidebar-close-button"
                                onClick={onClose}
                                title="Close FreezeFrame"
                            >
                                <img
                                    src={browser.runtime.getURL("/icons/close.png")}
                                    alt="Close"
                                    className="freezeframe-button-icon"
                                />
                            </button>
                            <button
                                className="freezeframe-sidebar-toggle-button"
                                onClick={onToggleCompact}
                            >
                                <img
                                    src={browser.runtime.getURL(`/icons/${getToggleButtonIcon()}`)}
                                    alt={compact ? "Expand" : "Collapse"}
                                    className="freezeframe-button-icon"
                                />
                            </button>
                        </>
                    )
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
                alt="FreezeFrame Icon"
                className={"freezeframe-sidebar-header-icon icon" + (compact ? " compact" : "")}
                style={{
                    width: "30px",
                    height: "30px",
                }}
            />
            <div className="freezeframe-sidebar-header-title-container">
                <h1 className="freezeframe-sidebar-header-title-freeze">
                    Freeze
                </h1>
                <h1 className="freezeframe-sidebar-header-title-frame">
                    Frame
                </h1>
            </div>
            {renderButtons()}
        </div>
    );
};

export default Header;
