import React from 'react';
import { motion } from 'motion/react';
import { AggregatedProductIcons } from '../types';
import LoadingThreeDotsJumping from './LoadingThreeDotsJumping'; // Import the new component

interface CollapsedSidebarContentProps {
  aggregatedProductIcons: AggregatedProductIcons;
  darkMode: boolean;
  isLoading: boolean; // Add the new isLoading prop
}

const CollapsedSidebarContent: React.FC<CollapsedSidebarContentProps> = ({ aggregatedProductIcons, darkMode, isLoading }) => {
  const iconPaths = Object.keys(aggregatedProductIcons);

  return (
    <div className="pauseshop-collapsed-sidebar-content">
      {isLoading ? ( // Conditionally render based on isLoading prop
        <LoadingThreeDotsJumping darkMode={darkMode} />
      ) : iconPaths.length > 0 ? (
        iconPaths.map((iconCategory, index) => (
          <motion.div
            key={iconCategory}
            className="pauseshop-collapsed-icon-container"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 0.4,
                scale: { type: "spring", stiffness: 260, damping: 20, bounce: 0.5 },
                delay: index * 0.05,
            }}
          >
            <img
              src={chrome.runtime.getURL(`icons/products/${iconCategory}.png`)}
              alt={iconCategory}
              className={`pauseshop-collapsed-icon ${darkMode ? 'dark-mode-icon' : ''}`}
            />
            {aggregatedProductIcons[iconCategory] > 1 && (
              <motion.span
                key={aggregatedProductIcons[iconCategory]} // Key changes when count changes, re-triggers animation
                className="pauseshop-collapsed-icon-count"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30, bounce: 0.7 }}
              >
                {aggregatedProductIcons[iconCategory]}
              </motion.span>
            )}
          </motion.div>
        ))
      ) : (
        <p>No products to display.</p>
      )}
    </div>
  );
};

export default CollapsedSidebarContent;