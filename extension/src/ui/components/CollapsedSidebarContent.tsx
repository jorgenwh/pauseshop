import React from 'react';
import { AggregatedProductIcons } from '../types';

interface CollapsedSidebarContentProps {
  aggregatedProductIcons: AggregatedProductIcons;
  darkMode: boolean;
}

const CollapsedSidebarContent: React.FC<CollapsedSidebarContentProps> = ({ aggregatedProductIcons, darkMode }) => {
  const iconPaths = Object.keys(aggregatedProductIcons);

  return (
    <div className="pauseshop-collapsed-sidebar-content">
      {iconPaths.length > 0 ? (
        iconPaths.map((iconCategory) => (
          <div key={iconCategory} className="pauseshop-collapsed-icon-container">
            <img
              src={chrome.runtime.getURL(`icons/products/${iconCategory}.png`)}
              alt={iconCategory}
              className={`pauseshop-collapsed-icon ${darkMode ? 'dark-mode-icon' : ''}`}
            />
            {aggregatedProductIcons[iconCategory] > 1 && (
              <span className="pauseshop-collapsed-icon-count">
                {aggregatedProductIcons[iconCategory]}
              </span>
            )}
          </div>
        ))
      ) : (
        <p>No products to display.</p>
      )}
    </div>
  );
};

export default CollapsedSidebarContent;