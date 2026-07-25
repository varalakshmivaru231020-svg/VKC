export interface ProductVariantData {
  id: string;
  colorName: string;
  colorHex: string;
  colorHex2?: string | null;
  sareeCode?: string | null;
  barcode?: string | null;
  costPrice: number;
  salePrice: number;
  originalPrice: number;
  stockQty: number;
  reservedQty: number;
  preBookedQty: number;
  isActive: boolean;
  sortOrder: number;
  images: ProductImageData[];
  // Computed server-side (lib/db/products.ts) from the product's pre-booking
  // config + this variant's stock — not stored columns.
  preBookingAvailable: boolean;
  preBookingRemainingSlots: number | null;
}

export interface ProductImageData {
  id: string;
  url: string;
  altText?: string | null;
  sortOrder: number;
  isPrimary: boolean;
  blurHash?: string | null;
}

export interface ProductAttributeData {
  id: string;
  attributeId: string;
  values: string[];
  attribute: { id: string; name: string; inputType: string };
}

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDesc?: string | null;
  fabric?: string | null;
  weaveType?: string | null;
  occasions: string[];
  regionOfOrigin?: string | null;
  sareeLengthCm: number;
  careInstructions?: string | null;
  gstPercent: number;
  weightGm?: number | null;
  videoUrl?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  category?: { id: string; name: string; slug: string } | null;
  variants: ProductVariantData[];
  productAttributes?: ProductAttributeData[];
  // ── Pre-Booking ──────────────────────────────────────────────────────────
  preBookingMode: "OFF" | "AUTO_ON_OUT_OF_STOCK" | "ALWAYS_ON";
  preBookingEtaMinDays?: number | null;
  preBookingEtaMaxDays?: number | null;
  preBookingMaxQtyPerOrder?: number | null;
  preBookingMaxTotalQty?: number | null;
  preBookingDisclaimer?: string | null;
  preBookingReturnsAllowed: boolean;
  preBookingEtaLabel?: string | null;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantColor: string;
  colorHex: string;
  sareeCode?: string | null;
  imageUrl?: string;
  salePrice: number;
  originalPrice: number;
  quantity: number;
  stockQty: number;
  gstPercent: number;
  // ── Pre-Booking ──────────────────────────────────────────────────────────
  // Snapshotted at add-to-cart time. isPreBooking splits the cart/checkout
  // flow (see cart page + checkout page) — a cart never checks out a mix of
  // pre-booked and standard items in one order.
  isPreBooking?: boolean;
  preBookingEtaLabel?: string | null;
  /** Remaining pre-booking slots at add-to-cart time, used to clamp qty. Null = uncapped. */
  preBookingCap?: number | null;
}

export interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  createdAt: string;
  items: OrderItemData[];
  shippingAddress: AddressData;
  trackingNumber?: string | null;
}

export interface OrderItemData {
  id: string;
  productName: string;
  variantColor: string;
  sareeCode?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string | null;
}

export interface AddressData {
  id?: string;
  label?: string | null;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault?: boolean;
}
