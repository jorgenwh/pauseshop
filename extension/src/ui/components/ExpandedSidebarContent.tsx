import { ProductStorage, SidebarContentState } from "../types";
import ProductGroupCard from "./ProductGroupCard";

interface ExpandedSidebarContentProps {
    contentState: SidebarContentState;
    productStorage: ProductStorage;
}

const ExpandedSidebarContent = ({contentState, productStorage }: ExpandedSidebarContentProps) => {
    return (
        <div className="pauseshop-expanded-sidebar-content">
            {contentState === SidebarContentState.LOADING && (
                <p className="text-white">Loading products...</p>
            )}
            {contentState === SidebarContentState.PRODUCTS && (
                <div className="pauseshop-product-list">
                    {productStorage.productGroups.map((group) => (
                        <ProductGroupCard key={group.product.name} groupName={group.product.name} />
                    ))}
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
