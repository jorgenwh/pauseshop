import { ProductStorage, SidebarContentState } from "../types";
import ProductCard from "./ProductCard"; // Import ProductCard

interface ExpandedSidebarContentProps {
    contentState: SidebarContentState;
    productStorage: ProductStorage; // Add productStorage prop
}

const ExpandedSidebarContent: React.FC<ExpandedSidebarContentProps> = ({
    contentState,
    productStorage,
}) => {
    return (
        <div className="pauseshop-expanded-sidebar-content">
            {contentState === SidebarContentState.LOADING && (
                <p className="text-white">Loading products...</p>
            )}
            {contentState === SidebarContentState.PRODUCTS && (
                <div className="pauseshop-product-list">
                    {/* Display a single mock product card for styling */}
                    <ProductCard />
                </div>
            )}
            {contentState === SidebarContentState.NO_PRODUCTS && (
                <p className="text-white">No products found.</p>
            )}
            {contentState === SidebarContentState.ERROR && (
                <p className="text-red-500">An error occurred. Check console for details.</p>
            )}
        </div>
    );
};

export default ExpandedSidebarContent;
