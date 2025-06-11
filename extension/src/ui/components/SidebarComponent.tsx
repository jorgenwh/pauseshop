import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

import {
  SidebarConfig,
  SidebarEvents,
  SidebarContentState,
  SidebarState
} from '../types';
import { AmazonScrapedProduct } from '../../types/amazon';
import {
  COMPACT_SIDEBAR_WIDTH,
  SIDEBAR_HEADER_HEIGHT,
  SIDEBAR_HEADER_ICON_SIZE,
  SIDEBAR_SLIDE_DURATION,
  SIDEBAR_WIDTH
} from "../constants";

const textVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "tween",
      ease: "easeOut",
      duration: 0.2,
    },
  },
};

const headerContainerVariants = {
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

interface SidebarComponentProps {
  isVisible: boolean;
  contentState: SidebarContentState;
  darkMode: boolean;
  position: "right" | "left";
  compact: boolean;
  onShow: () => void;
  onHide: () => void;
  onContentStateChange: (state: SidebarContentState) => void;
  onProductClick: (product: AmazonScrapedProduct) => void; // Keep for future, but not used now
  onError: (error: Error) => void;
  onToggleCompact: () => void;
  onToggleDarkMode: () => void;
  onTogglePosition: () => void;
}

const SidebarComponent: React.FC<SidebarComponentProps> = ({
  isVisible,
  contentState,
  darkMode,
  position,
  compact,
  onShow,
  onHide,
  onContentStateChange,
  onToggleCompact,
  onToggleDarkMode,
  onTogglePosition,
}) => {
  const [sidebarState, setSidebarState] = useState<SidebarState>(SidebarState.HIDDEN);
  const [currentCompact, setCurrentCompact] = useState<boolean>(compact);

  useEffect(() => {
    setCurrentCompact(compact);
  }, [compact]);

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${SIDEBAR_WIDTH}px`);
    document.documentElement.style.setProperty('--sidebar-compact-width', `${COMPACT_SIDEBAR_WIDTH}px`);
    document.documentElement.style.setProperty('--sidebar-transition-speed', `${SIDEBAR_SLIDE_DURATION}s`);
  }, []); // Run once on mount

  useEffect(() => {
    if (isVisible) {
      if (sidebarState === SidebarState.HIDDEN || sidebarState === SidebarState.SLIDING_OUT) {
        setSidebarState(SidebarState.SLIDING_IN);
        const timer = setTimeout(() => {
          setSidebarState(SidebarState.VISIBLE);
          onShow();
        }, SIDEBAR_SLIDE_DURATION * 1000); // Convert seconds to milliseconds
        return () => clearTimeout(timer);
      }
    } else {
      if (sidebarState === SidebarState.VISIBLE || sidebarState === SidebarState.SLIDING_IN) {
        setSidebarState(SidebarState.SLIDING_OUT);
        const timer = setTimeout(() => {
          setSidebarState(SidebarState.HIDDEN);
          onHide();
        }, SIDEBAR_SLIDE_DURATION * 1000); // Convert seconds to milliseconds
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, sidebarState, onShow, onHide]);

  const toggleCompactMode = () => {
    onToggleCompact();
  };

  const getSidebarTransform = () => {
    const currentWidth = currentCompact ? COMPACT_SIDEBAR_WIDTH : SIDEBAR_WIDTH;
    if (sidebarState === SidebarState.HIDDEN || sidebarState === SidebarState.SLIDING_OUT) {
      return position === "right" ? `translateX(${currentWidth}px)` : `translateX(-${currentWidth}px)`;
    }
    return `translateX(0)`;
  };

  const getToggleButtonIconClass = () => {
    if (currentCompact) {
      return position === "right" ? "arrow-left" : "arrow-right";
    } else {
      return position === "right" ? "arrow-right" : "arrow-left";
    }
  };

  return (
    <motion.div
      id="pauseshop-sidebar"
      className={`pauseshop-sidebar ${currentCompact ? "pauseshop-sidebar-compact" : ""} position-${position}`}
      style={{
        [position]: "0",
        transform: getSidebarTransform(),
        pointerEvents: sidebarState === SidebarState.HIDDEN ? 'none' : 'auto',
      }}
      initial="hidden"
      animate={currentCompact ? "hidden" : "visible"}
    >
      <div
        className="pauseshop-sidebar-header"
        style={{
          height: `${SIDEBAR_HEADER_HEIGHT}px`,
        }}
      >
        <img
          src={chrome.runtime.getURL('icons/icon-128.png')}
          alt="PauseShop Icon"
          className="pauseshop-sidebar-header-icon"
          style={{
            width: `${SIDEBAR_HEADER_ICON_SIZE}px`,
            height: `${SIDEBAR_HEADER_ICON_SIZE}px`,
          }}
        />
        <motion.div
          className="pauseshop-sidebar-header-title-container"
          variants={headerContainerVariants}
        >
          <motion.h1 className="pauseshop-sidebar-header-title-pause" variants={textVariants}>Pause</motion.h1>
          <motion.h1
            className="pauseshop-sidebar-header-title-shop"
            variants={textVariants}
          >
            Shop
          </motion.h1>
        </motion.div>
        <button
          className="pauseshop-sidebar-toggle-button"
          onClick={toggleCompactMode}
        >
          <span className={`arrow-icon ${getToggleButtonIconClass()}`}></span>
        </button>
      </div>
      <div className="pauseshop-sidebar-content">
        {contentState === SidebarContentState.LOADING && <p>Loading products...</p>}
        {contentState === SidebarContentState.PRODUCTS && <p>Displaying products...</p>}
        {contentState === SidebarContentState.NO_PRODUCTS && <p>No products found.</p>}
        {contentState === SidebarContentState.ERROR && <p>An error occurred. Check console for details.</p>}
      </div>
      <div className="pauseshop-sidebar-footer">
        <button
          className="pauseshop-sidebar-button"
          onClick={onToggleDarkMode}
        >
          <span>{darkMode ? "Light" : "Dark"}</span>
        </button>
        <button
          className="pauseshop-sidebar-button"
          onClick={onTogglePosition}
        >
          <span>{position === "right" ? "Left" : "Right"}</span>
        </button>
      </div>
    </motion.div>
  );
};

export default SidebarComponent;

