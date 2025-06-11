import React from 'react';

import { SidebarConfig, SidebarEvents, SidebarContentState } from '../types';
import { AmazonScrapedProduct } from '../../types/amazon';

interface SidebarComponentProps {
  isVisible: boolean;
  contentState: SidebarContentState;
  darkMode: boolean;
  position: "right" | "left";
  compact: boolean;
  onShow: () => void;
  onHide: () => void;
  onContentStateChange: (state: SidebarContentState) => void;
  onProductClick: (product: AmazonScrapedProduct) => void;
  onError: (error: Error) => void;
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
  onProductClick,
  onError
}) => {
  // TODO: Implement actual UI logic and styling based on props
  // For now, a basic display based on visibility and contentState
  return (
    <div className="pauseshop-sidebar" style={{ display: isVisible ? 'block' : 'none', backgroundColor: darkMode ? 'black' : 'white', left: position === 'left' ? '0' : 'auto', right: position === 'right' ? '0' : 'auto' }}>
      <div className="pauseshop-sidebar-header">
        <h1>PauseShop <span style={{fontSize: '0.8em'}}>({compact ? 'Compact' : 'Full'})</span></h1>
        <button onClick={() => { /* Toggle compact mode, need to pass this up or manage internally */ }}>Toggle</button>
      </div>
      <div>
        {contentState === SidebarContentState.LOADING && <p>Loading products...</p>}
        {contentState === SidebarContentState.PRODUCTS && <p>Displaying products...</p>}
        {contentState === SidebarContentState.NO_PRODUCTS && <p>No products found.</p>}
        {contentState === SidebarContentState.ERROR && <p>An error occurred. Check console for details.</p>}
        <button onClick={() => onShow()}>Show (Debug)</button>
        <button onClick={() => onHide()}>Hide (Debug)</button>
        <button onClick={() => onContentStateChange(SidebarContentState.PRODUCTS)}>Set Products (Debug)</button>
        <button onClick={() => onProductClick({
          amazonAsin: "B07XYC4C7V",
          productUrl: "https://www.amazon.com/dp/B07XYC4C7V",
          id: "dummy-id",
          thumbnailUrl: "https://example.com/thumb.jpg",
          position: 0,
        })}>Click Product (Debug)</button>
        <button onClick={() => onError(new Error("Test Error"))}>Emit Error (Debug)</button>
      </div>
    </div>
  );
};

export default SidebarComponent;