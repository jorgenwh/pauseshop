interface SidebarFooterProps {
    position: "right" | "left";
    onTogglePosition: () => void;
}

const SidebarFooter = ({ position, onTogglePosition }: SidebarFooterProps) => {
    return (
        <div className="pauseshop-sidebar-footer">
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
