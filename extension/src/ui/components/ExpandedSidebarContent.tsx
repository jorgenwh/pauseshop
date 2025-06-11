import React from 'react';
import { SidebarContentState } from '../types';

interface ExpandedSidebarContentProps {
  contentState: SidebarContentState;
  // Potentially add other props needed for expanded content
}

const ExpandedSidebarContent: React.FC<ExpandedSidebarContentProps> = ({ contentState }) => {
  return (
    <div className="pauseshop-expanded-sidebar-content">
      {contentState === SidebarContentState.LOADING && <p>Loading products...</p>}
      {contentState === SidebarContentState.PRODUCTS && <p>Displaying products...</p>}
      {contentState === SidebarContentState.NO_PRODUCTS && <p>No products found.</p>}
      {contentState === SidebarContentState.ERROR && <p>An error occurred. Check console for details.</p>}
      {/* Add more expanded sidebar specific components here */}
    </div>
  );
};

export default ExpandedSidebarContent;