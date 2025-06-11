import React from 'react';
import { SidebarContentState } from '../types';

interface SidebarContentProps {
  contentState: SidebarContentState;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ contentState }) => {
  return (
    <div className="pauseshop-sidebar-content">
      {contentState === SidebarContentState.LOADING && <p>Loading products...</p>}
      {contentState === SidebarContentState.PRODUCTS && <p>Displaying products...</p>}
      {contentState === SidebarContentState.NO_PRODUCTS && <p>No products found.</p>}
      {contentState === SidebarContentState.ERROR && <p>An error occurred. Check console for details.</p>}
    </div>
  );
};

export default SidebarContent;