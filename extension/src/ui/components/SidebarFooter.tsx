import React from 'react';

interface SidebarFooterProps {
  darkMode: boolean;
  position: "right" | "left";
  onToggleDarkMode: () => void;
  onTogglePosition: () => void;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({
  darkMode,
  position,
  onToggleDarkMode,
  onTogglePosition,
}) => {
  return (
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
  );
};

export default SidebarFooter;