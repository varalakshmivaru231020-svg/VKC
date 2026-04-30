import { ProductCard } from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductData } from "@/lib/types/product";

interface Props {
  products: ProductData[];
  loading?: boolean;
}

export function ProductGrid({ products, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="saree-card-ratio rounded-sm" />
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-5 w-20 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-24 space-y-4">
        <div className="text-6xl">🪡</div>
        <p className="text-h4 font-heading" style={{ color: "var(--color-text-primary)" }}>
          No sarees found
        </p>
        <p className="text-body-sm font-body" style={{ color: "var(--color-text-muted)" }}>
          Try adjusting your filters or browse all sarees
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
