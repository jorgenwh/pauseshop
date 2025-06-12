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
  SIDEBAR_SLIDE_DURATION,
  SIDEBAR_WIDTH
} from "../constants";
import SidebarHeader from './SidebarHeader';
import SidebarFooter from './SidebarFooter';
import ExpandedSidebarContent from './ExpandedSidebarContent';
import CollapsedSidebarContent from './CollapsedSidebarContent';

interface SidebarProps {
  isVisible: boolean;
  contentState: SidebarContentState;
  darkMode: boolean;
  position: "right" | "left";
  compact: boolean;
  aggregatedProductIcons: { [key: string]: number; };
  onShow: () => void;
  onHide: () => void;
  onContentStateChange: (state: SidebarContentState) => void;
  onProductClick: (product: AmazonScrapedProduct) => void; // Keep for future, but not used now
  onError: (error: Error) => void;
  onToggleCompact: () => void;
  onToggleDarkMode: () => void;
  onTogglePosition: () => void;
}
 
const Sidebar: React.FC<SidebarProps> = ({
  isVisible,
  contentState,
  darkMode,
  position,
  compact,
  aggregatedProductIcons, // Destructure the new prop
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
    document.documentElement.style.setProperty('--sidebar-width', `${SIDEBAR_WIDTH}px`);
    document.documentElement.style.setProperty('--sidebar-compact-width', `${COMPACT_SIDEBAR_WIDTH}px`);
    document.documentElement.style.setProperty('--sidebar-transition-speed', `${SIDEBAR_SLIDE_DURATION}s`);
  }, []); // Run once on mount

  useEffect(() => {
    setCurrentCompact(compact);
  }, [compact]);

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

  return (
    <motion.div
      id="pauseshop-sidebar"
      className={`pauseshop-sidebar ${currentCompact ? "pauseshop-sidebar-compact" : ""} position-${position}`}
      style={{
        [position]: "0",
        transform: getSidebarTransform(),
        pointerEvents: sidebarState === SidebarState.HIDDEN ? 'none' : 'auto',
      }}
      

     animate={currentCompact ? "hidden" : "visible"}
   >
     <SidebarHeader
       compact={currentCompact}
       position={position}
       darkMode={darkMode} // Pass the darkMode prop
       onToggleCompact={toggleCompactMode}
     />
     {currentCompact ? (
       <CollapsedSidebarContent aggregatedProductIcons={aggregatedProductIcons} darkMode={darkMode} />
     ) : (
       <ExpandedSidebarContent contentState={contentState} />
     )}
     <SidebarFooter
       darkMode={darkMode}
       position={position}
       onToggleDarkMode={onToggleDarkMode}
       onTogglePosition={onTogglePosition}
     />
     </motion.div>
  );
};

export default Sidebar;





