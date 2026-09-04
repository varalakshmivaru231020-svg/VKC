"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Heart, Check, Truck, RefreshCw, Shield, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils";
import { formatINR, discountPercent, savedAmount } from "@/lib/utils/format";
import { useCartStore, useWishlistStore } from "@/lib/store/cart";
import type { ProductData, ProductVariantData } from "@/lib/types/product";
import { productHasChosenColours } from "@/lib/utils/variantColour";
import { Button } from "@/components/ui/button";
import ProductReviews from "./ProductReviews";

interface Props {
  product: ProductData;
  careInstructions: string;
  deliveryInstructions: string;
  returnsDays: number;
}

export default function ProductDetailClient({ product, careInstructions, deliveryInstructions, returnsDays }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantData>(product.variants[0]);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [pincodeInput, setPincodeInput] = useState("");
  const [pincodeResult, setPincodeResult] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(product.description ? "description" : "details");

  // Zoom state
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgContainerRef = useRef<HTMLDivElement>(null);

  const { addItem, items } = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const router = useRouter();

  const images = selectedVariant.images.length > 0
    ? selectedVariant.images
    : [{ id: "placeholder", url: "", altText: product.name, sortOrder: 0, isPrimary: true }];

  const hasDiscount = selectedVariant.originalPrice > selectedVariant.salePrice;
  const pct = discountPercent(selectedVariant.originalPrice, selectedVariant.salePrice);
  const saved = savedAmount(selectedVariant.originalPrice, selectedVariant.salePrice);
  const available = selectedVariant.stockQty - selectedVariant.reservedQty;
  // The qty stepper can't go past what's actually in stock.
  const standardQtyCap = available;

  const gstRate = product.gstPercent ?? 5;
  const gstAmount = selectedVariant.salePrice - selectedVariant.salePrice / (1 + gstRate / 100);
  const gstLabel = gstRate % 1 === 0 ? gstRate.toFixed(0) : gstRate.toFixed(2);

  const handleVariantChange = (v: ProductVariantData) => {
    setSelectedVariant(v);
    setActiveImage(0);
    setShowVideo(false);
    setQty(1);
    setAddedToCart(false);
  };

  const handleAddToCart = () => {
    const primaryImg = selectedVariant.images.find((i) => i.isPrimary) ?? selectedVariant.images[0];
    addItem({
      id: `${product.id}-${selectedVariant.id}`,
      productId: product.id,
      variantId: selectedVariant.id,
      productName: product.name,
      variantColor: selectedVariant.colorName,
      colorHex: selectedVariant.colorHex,
      sareeCode: selectedVariant.sareeCode,
      imageUrl: primaryImg?.url,
      salePrice: selectedVariant.salePrice,
      originalPrice: selectedVariant.originalPrice,
      quantity: qty,
      stockQty: selectedVariant.stockQty,
      qtyCap: standardQtyCap,
      gstPercent: product.gstPercent,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  const goToImage = (dir: 1 | -1) => {
    if (images.length < 2) return;
    setShowVideo(false);
    setActiveImage((prev) => (prev + dir + images.length) % images.length);
  };

  const checkPincode = () => {
    if (pincodeInput.length === 6) {
      setPincodeResult("Delivery by " + new Date(Date.now() + 5 * 86400000).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) + " · Free");
    }
  };

  const toggleAccordion = (key: string) => setOpenAccordion(openAccordion === key ? null : key);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const dynamicAttrs = product.productAttributes ?? [];

  const accordionItems = [
    ...(product.description ? [{
      key: "description",
      title: "About this Product",
      content: (
        <div
          className="text-sm font-body leading-relaxed prose-product"
          style={{ color: "var(--color-text-secondary)" }}
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      ),
    }] : []),
    {
      key: "details",
      title: "Product Details",
      content: (
        <div className="space-y-2">
          {dynamicAttrs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm font-body">
              {dynamicAttrs
                .filter((pa) => pa.values.length > 0)
                .map((pa) => (
                  <div key={pa.attributeId}>
                    <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{pa.attribute.name}: </span>
                    <span style={{ color: "var(--color-text-secondary)" }}>{pa.values.join(", ")}</span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm font-body">
              {[
                ["Type", product.fabric],
                ["Variety", product.weaveType],
                ["Region", product.regionOfOrigin],
                ["Length", product.sareeLengthCm ? `${product.sareeLengthCm / 100}m` : null],
                ["Weight", product.weightGm ? `${product.weightGm}g` : null],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string}>
                  <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{k}: </span>
                  <span style={{ color: "var(--color-text-secondary)" }}>{v as string}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    ...(careInstructions || product.careInstructions ? [{
      key: "care",
      title: "Care Instructions",
      content: (
        <p className="text-sm font-body leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {product.careInstructions || careInstructions}
        </p>
      ),
    }] : []),
    {
      key: "shipping",
      title: "Shipping & Returns",
      content: (
        <div className="space-y-1.5 text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>
          {deliveryInstructions.split("\n").filter(Boolean).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 lg:items-start">

        {/* ── LEFT: Sticky image panel ── */}
        {/* top-36 (144px) clears the full sticky header (88px top bar + 44px nav bar) with a gap, so it never sits under the nav */}
        <div className="lg:sticky lg:top-36 lg:self-start">
          {/* Desktop: side-by-side thumbnails | Mobile: main image then thumbnails below */}
          <div className="flex gap-3 lg:flex-row flex-col-reverse">

            {/* Thumbnail strip — vertical on desktop, horizontal row on mobile */}
            {(images.length > 1 || product.videoUrl) && (
              <div className="lg:flex-col flex flex-row lg:gap-2 gap-2 lg:shrink-0 overflow-x-auto lg:overflow-x-visible"
                style={{ width: "auto" }}>
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => { setActiveImage(idx); setShowVideo(false); }}
                    className={cn(
                      "rounded-sm overflow-hidden border-2 transition-all shrink-0",
                      !showVideo && idx === activeImage
                        ? "border-primary opacity-100"
                        : "border-transparent opacity-55 hover:opacity-90"
                    )}
                    style={{
                      aspectRatio: "3/4",
                      background: "var(--color-cream)",
                      position: "relative",
                      width: 64,
                      minWidth: 64,
                    }}
                  >
                    {img.url && (
                      <SmartImage src={img.url} alt="" fill objectFit="cover" />
                    )}
                  </button>
                ))}
                {product.videoUrl && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className={cn(
                      "rounded-sm overflow-hidden border-2 transition-all relative flex items-center justify-center shrink-0",
                      showVideo ? "border-primary opacity-100" : "border-transparent opacity-55 hover:opacity-90"
                    )}
                    style={{ aspectRatio: "3/4", background: "#111", width: 64, minWidth: 64 }}
                  >
                    <Play className="h-5 w-5 text-white" />
                  </button>
                )}
              </div>
            )}

            {/* Main image / video panel */}
            <div className="flex-1 relative" style={{ aspectRatio: "3/4" }}>
              {showVideo && product.videoUrl ? (
                <div className="absolute inset-0 rounded-md overflow-hidden bg-black">
                  <video
                    src={product.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div
                  ref={imgContainerRef}
                  className="absolute inset-0 rounded-md overflow-hidden"
                  style={{
                    background: "var(--color-cream)",
                    border: "1px solid var(--color-parchment)",
                    cursor: zoomed ? "zoom-out" : "zoom-in",
                  }}
                  onMouseEnter={() => setZoomed(true)}
                  onMouseLeave={() => setZoomed(false)}
                  onMouseMove={handleMouseMove}
                >
                  {images[activeImage]?.url ? (
                    <img
                      src={images[activeImage].url}
                      alt={images[activeImage].altText ?? product.name}
                      className="absolute inset-0 w-full h-full object-cover select-none"
                      draggable={false}
                      style={{
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        transform: zoomed ? "scale(2.4)" : "scale(1)",
                        transition: zoomed ? "none" : "transform 0.25s ease",
                        willChange: "transform",
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-24 h-24 rounded-full opacity-25" style={{ background: selectedVariant.colorHex }} />
                      <span className="text-sm font-body" style={{ color: "var(--color-text-muted)" }}>
                        {selectedVariant.colorName}
                      </span>
                    </div>
                  )}

                  {/* Prev / next arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); goToImage(-1); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full flex items-center justify-center shadow-sm bg-white/90 hover:bg-white transition-all z-10"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-5 w-5" style={{ color: "var(--color-text-secondary)" }} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); goToImage(1); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full flex items-center justify-center shadow-sm bg-white/90 hover:bg-white transition-all z-10"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-5 w-5" style={{ color: "var(--color-text-secondary)" }} />
                      </button>
                    </>
                  )}

                  {/* Zoom hint badge */}
                  {!zoomed && images[activeImage]?.url && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded text-[10px] font-body font-medium"
                      style={{ background: "rgba(0,0,0,0.45)", color: "white", pointerEvents: "none" }}>
                      Hover to zoom
                    </div>
                  )}

                  {/* Wishlist button */}
                  <button
                    onClick={() => toggle(selectedVariant.id)}
                    className={cn(
                      "absolute top-3 right-3 h-9 w-9 rounded-full flex items-center justify-center shadow-sm transition-all z-10",
                      isWishlisted(selectedVariant.id) ? "bg-primary" : "bg-white/90 hover:bg-white"
                    )}
                    aria-label="Wishlist"
                  >
                    <Heart className={cn("h-4 w-4", isWishlisted(selectedVariant.id) ? "fill-white text-white" : "text-text-secondary")} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Product info (scrolls with page) ── */}
        <div className="space-y-5">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {product.fabric && (
              <span className="px-2.5 py-1 text-[10px] font-semibold font-body tracking-widest uppercase rounded-xs"
                style={{ background: "var(--color-cream)", color: "var(--color-text-muted)", border: "1px solid var(--color-parchment)" }}>
                {product.fabric}
              </span>
            )}
            {product.weaveType && (
              <span className="px-2.5 py-1 text-[10px] font-semibold font-body tracking-widest uppercase rounded-xs"
                style={{ background: "var(--color-cream)", color: "var(--color-text-muted)", border: "1px solid var(--color-parchment)" }}>
                {product.weaveType}
              </span>
            )}
          </div>

          {/* Name */}
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-h2)", fontWeight: "var(--weight-heading)", lineHeight: 1.2, color: "var(--color-text-primary)" }}>
            {product.name}
          </h1>

          {/* Short desc */}
          {product.shortDesc && (
            <p className="text-sm font-body leading-relaxed" style={{ color: "var(--color-text-secondary)" }}
              dangerouslySetInnerHTML={{ __html: product.shortDesc }} />
          )}

          <div className="gold-divider" />

          {/* Price */}
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-price)", fontStyle: "italic", color: "var(--color-primary)" }}>
                {formatINR(selectedVariant.salePrice)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base line-through font-body" style={{ color: "var(--color-text-muted)" }}>
                    {formatINR(selectedVariant.originalPrice)}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold font-body rounded-xs"
                    style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}>
                    {pct}% Off
                  </span>
                </>
              )}
            </div>
            {hasDiscount && (
              <p className="text-xs font-body" style={{ color: "var(--color-success)" }}>
                You save {formatINR(saved)}
              </p>
            )}
            <p className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>
              Inclusive of {gstLabel}% GST ({formatINR(gstAmount)})
            </p>
          </div>

          <div className="gold-divider" />

          {/* Colour selection — only when the admin actually chose a colour
              (name or code). Variants left on the placeholder swatch hide this
              block entirely rather than showing a meaningless default. */}
          {productHasChosenColours(product.variants) && (
          <div className="space-y-3">
            <p className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Colour{selectedVariant.colorName ? <> — <span style={{ color: "var(--color-primary)", fontWeight: 400 }}>{selectedVariant.colorName}</span></> : null}
            </p>
            <div className="flex flex-wrap gap-3">
              {product.variants.map((v) => {
                const isSelected = v.id === selectedVariant.id;
                const outOfStock = v.stockQty - v.reservedQty <= 0;
                return (
                  <button
                    key={v.id}
                    onClick={() => handleVariantChange(v)}
                    disabled={outOfStock}
                    title={v.colorName}
                    className={cn(
                      "relative w-10 h-10 rounded-full border-2 transition-all",
                      isSelected ? "border-gold scale-110 shadow-gold-sm" : "border-white hover:border-gold/50",
                      outOfStock && "opacity-40 cursor-not-allowed"
                    )}
                    style={{
                      background: v.colorHex2 ? `linear-gradient(135deg, ${v.colorHex} 50%, ${v.colorHex2} 50%)` : v.colorHex,
                      boxShadow: isSelected ? `0 0 0 2px var(--color-gold)` : `0 0 0 1px var(--color-parchment)`,
                    }}
                  >
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center bg-gold">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                    {outOfStock && (
                      <span className="absolute inset-0 rounded-full"
                        style={{ background: "rgba(255,255,255,0.6)", backgroundImage: "repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 5px)" }} />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>
              {product.variants.length} colour{product.variants.length !== 1 ? "s" : ""} available
            </p>
          </div>
          )}

          {/* Product code */}
          {selectedVariant.sareeCode && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>Product Code:</span>
              <span className="px-2.5 py-1 text-xs font-mono rounded-xs"
                style={{ background: "var(--color-cream)", color: "var(--color-text-secondary)", border: "1px solid var(--color-parchment)" }}>
                {selectedVariant.sareeCode}
              </span>
            </div>
          )}

          {/* Stock */}
          <div>
            {available <= 0 ? (
              <p className="text-sm font-body font-semibold" style={{ color: "var(--color-error)" }}>Out of Stock</p>
            ) : available <= 3 ? (
              <p className="text-sm font-body font-semibold" style={{ color: "var(--color-warning)" }}>
                Only {available} left{productHasChosenColours(product.variants) ? " in this colour" : " in stock"}!
              </p>
            ) : (
              <p className="text-sm font-body" style={{ color: "var(--color-success)" }}>
                <Check className="inline h-4 w-4 mr-1" /> In Stock
              </p>
            )}
          </div>

          {/* Qty + Add to cart */}
          {available > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-sm overflow-hidden shrink-0"
                  style={{ borderColor: "var(--color-parchment)" }}>
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="h-11 w-10 sm:w-11 flex items-center justify-center text-lg font-body transition-colors hover:bg-cream"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    −
                  </button>
                  <span className="h-11 w-10 sm:w-12 flex items-center justify-center text-sm font-body font-medium border-x"
                    style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-primary)" }}>
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(Math.min(standardQtyCap, qty + 1))}
                    className="h-11 w-10 sm:w-11 flex items-center justify-center text-lg font-body transition-colors hover:bg-cream"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    +
                  </button>
                </div>

                <Button
                  className={cn("flex-1 h-11 min-w-0 transition-all whitespace-nowrap", addedToCart && "bg-success hover:bg-success")}
                  onClick={handleAddToCart}
                >
                  <ShoppingBag className="h-4 w-4 mr-1.5 shrink-0" />
                  {addedToCart ? "Added!" : "Add to Cart"}
                </Button>

                <button
                  onClick={() => toggle(selectedVariant.id)}
                  className={cn(
                    "hidden sm:flex h-11 w-11 items-center justify-center rounded-sm border transition-colors shrink-0",
                    isWishlisted(selectedVariant.id)
                      ? "bg-primary border-primary"
                      : "border-parchment hover:border-primary"
                  )}
                >
                  <Heart className={cn("h-5 w-5", isWishlisted(selectedVariant.id) ? "fill-white text-white" : "text-text-secondary")} />
                </button>
              </div>

              <Button variant="buyNow" className="w-full h-11" onClick={handleBuyNow}>
                Buy Now
              </Button>
            </div>
          ) : null}

          {/* Delivery check */}
          <div className="p-4 rounded-sm space-y-2" style={{ background: "var(--color-cream)", border: "1px solid var(--color-parchment)" }}>
            <p className="text-xs font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
              <Truck className="inline h-3.5 w-3.5 mr-1.5" />Check Delivery Availability
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter pincode"
                className="flex-1 h-9 px-3 text-sm font-body border rounded-xs focus:outline-none focus:border-primary transition-colors"
                style={{ borderColor: "var(--color-parchment)", background: "var(--color-ivory)" }}
              />
              <button
                onClick={checkPincode}
                className="h-9 px-4 text-sm font-body font-medium rounded-xs transition-colors"
                style={{ background: "var(--color-primary)", color: "white" }}
              >
                Check
              </button>
            </div>
            {pincodeResult && (
              <p className="text-xs font-body" style={{ color: "var(--color-success)" }}>
                <Check className="inline h-3.5 w-3.5 mr-1" />{pincodeResult}
              </p>
            )}
            <div className="flex gap-4 pt-1">
              {[
                { Icon: RefreshCw, text: `${returnsDays}-day returns` },
                { Icon: Shield, text: "Secure payment" },
              ].map(({ Icon, text }) => (
                <span key={text} className="text-[11px] font-body flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                  <Icon className="h-3 w-3" />{text}
                </span>
              ))}
            </div>
          </div>

          {/* Accordions */}
          <div className="space-y-0 border rounded-sm overflow-hidden" style={{ borderColor: "var(--color-parchment)" }}>
            {accordionItems.map(({ key, title, content }, idx) => (
              <div key={key} className={idx > 0 ? "border-t" : ""} style={{ borderColor: "var(--color-parchment)" }}>
                <button
                  onClick={() => toggleAccordion(key)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-cream"
                >
                  <span className="text-sm font-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</span>
                  {openAccordion === key
                    ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: "var(--color-text-muted)" }} />
                    : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--color-text-muted)" }} />
                  }
                </button>
                {openAccordion === key && (
                  <div className="px-4 pb-4 pt-1" style={{ background: "var(--color-cream)" }}>
                    {content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer reviews — populated from approved Review rows */}
      <ProductReviews slug={product.slug} />

      {/* Spacer so content above isn't hidden behind the sticky mobile action bar */}
      {available > 0 && <div className="lg:hidden h-20" aria-hidden />}

      {/* ── Mobile sticky action bar: ♥ | Add to Bag | Buy Now (sits above bottom nav) ── */}
      {available > 0 && (
        <div
          className="lg:hidden fixed bottom-16 inset-x-0 z-30 flex items-center gap-2 px-3 py-3 border-t shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
          style={{ background: "white", borderColor: "var(--color-parchment)" }}
        >
          <button
            onClick={() => toggle(selectedVariant.id)}
            aria-label="Wishlist"
            className={cn(
              "h-12 w-12 shrink-0 flex items-center justify-center rounded-md border transition-colors",
              isWishlisted(selectedVariant.id) ? "bg-primary border-primary" : "border-parchment"
            )}
          >
            <Heart className={cn("h-5 w-5", isWishlisted(selectedVariant.id) ? "fill-white text-white" : "text-text-secondary")} />
          </button>
          <Button
            variant="secondary"
            className={cn("flex-1 h-12 min-w-0 whitespace-nowrap", addedToCart && "bg-success hover:bg-success text-white")}
            onClick={handleAddToCart}
          >
            <ShoppingBag className="h-4 w-4 mr-1.5 shrink-0" />
            {addedToCart ? "Added!" : "Add to Bag"}
          </Button>
          <Button variant="buyNow" className="flex-1 h-12 min-w-0 whitespace-nowrap" onClick={handleBuyNow}>
            Buy Now
          </Button>
        </div>
      )}
    </div>
  );
}
