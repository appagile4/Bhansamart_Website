import { CartItem } from "@/redux/slices/cartSlice";
import { ProductItem } from "@/components/ProductCard";

export interface VendorCartGroup {
  vendorId: string;
  vendorName: string;
  vendorCity?: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryCharge: number;
  handlingCharge: number;
  grandTotal: number;
}

/**
 * Safely extracts unique vendor identifier from product
 */
export const getProductVendorId = (product: ProductItem): string => {
  if (!product.vendor) return "default_hub";
  if (typeof product.vendor === "string") return product.vendor;
  if (product.vendor._id) return product.vendor._id;
  const bizName = product.vendor.businessDetails?.businessName;
  if (bizName) return `biz_${bizName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  const sellerName = product.vendor.sellerDetails?.sellerName;
  if (sellerName) return `sel_${sellerName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  return "default_hub";
};

/**
 * Safely extracts human-friendly vendor store name
 */
export const getProductVendorName = (product: ProductItem): string => {
  if (!product.vendor) return "BhansaMart Express Hub";
  if (typeof product.vendor === "string") return "BhansaMart Partner Store";
  return (
    product.vendor.businessDetails?.businessName ||
    product.vendor.sellerDetails?.sellerName ||
    "BhansaMart Express Hub"
  );
};

/**
 * Extracts vendor city if present
 */
export const getProductVendorCity = (product: ProductItem): string | undefined => {
  if (!product.vendor || typeof product.vendor === "string") return undefined;
  return (
    product.vendor.shippingLocations?.city ||
    product.vendor.businessDetails?.city ||
    product.vendor.sellerDetails?.city
  );
};

/**
 * Groups cart items by vendor/store and calculates per-store totals
 */
export const groupCartByVendor = (cartItems: CartItem[]): VendorCartGroup[] => {
  const groups: Record<string, VendorCartGroup> = {};

  cartItems.forEach((item) => {
    const vId = getProductVendorId(item.product);
    const vName = getProductVendorName(item.product);
    const vCity = getProductVendorCity(item.product);

    if (!groups[vId]) {
      groups[vId] = {
        vendorId: vId,
        vendorName: vName,
        vendorCity: vCity,
        items: [],
        itemCount: 0,
        subtotal: 0,
        deliveryCharge: 0,
        handlingCharge: 0,
        grandTotal: 0,
      };
    }

    groups[vId].items.push(item);
    groups[vId].itemCount += item.quantity;
    groups[vId].subtotal += (item.product.price || 0) * item.quantity;
  });

  return Object.values(groups).map((g) => {
    const delivery = g.subtotal > 200 || g.subtotal === 0 ? 0 : 25;
    const handling = g.subtotal > 0 ? 2 : 0;
    return {
      ...g,
      deliveryCharge: delivery,
      handlingCharge: handling,
      grandTotal: g.subtotal + delivery + handling,
    };
  });
};
