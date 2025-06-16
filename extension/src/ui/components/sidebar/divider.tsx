import "../../css/components/sidebar/divider.css";

interface DividerProps {
    compact?: boolean;
}

const Divider = ({ compact = false }: DividerProps) => {
    const dividerClasses = [
        "pauseshop-sidebar-divider",
        compact && "compact"
    ].filter(Boolean).join(" ");

    return <div className={dividerClasses} />;
};

export default Divider;