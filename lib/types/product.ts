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
  isActive: boolean;
  sortOrder: number;
  images: ProductImageData[];
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
