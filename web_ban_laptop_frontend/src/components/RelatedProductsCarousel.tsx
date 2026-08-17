import type { Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type RelatedProductsCarouselProps = {
  products: Product[];
  isLoading?: boolean;
  titleId?: string;
};

export function RelatedProductsCarousel({
  products,
  isLoading,
  titleId = "related-products-heading",
}: RelatedProductsCarouselProps) {
  if (isLoading) {
    return (
      <div>
        <RelatedSectionHeader titleId={titleId} />
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Đang tải sản phẩm liên quan…
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  const showNav = products.length > 1;
  const navBtnClass =
    "top-1/2 z-20 size-11 -translate-y-1/2 rounded-full border-0 bg-gray-400/25 text-gray-700 shadow-sm backdrop-blur-[2px] hover:bg-gray-400/40 disabled:pointer-events-none disabled:opacity-0";

  return (
    <div>
      <RelatedSectionHeader titleId={titleId} />

      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
            containScroll: "trimSnaps",
          }}
          className="w-full"
        >
          {showNav && (
            <>
              <CarouselPrevious
                className={`${navBtnClass} left-1 md:left-2`}
                aria-label="Xem sản phẩm trước"
              >
                <ChevronLeft className="size-6" strokeWidth={2.5} />
              </CarouselPrevious>
              <CarouselNext
                className={`${navBtnClass} right-1 md:right-2`}
                aria-label="Xem sản phẩm tiếp theo"
              >
                <ChevronRight className="size-6" strokeWidth={2.5} />
              </CarouselNext>
            </>
          )}

          <CarouselContent className="-ml-4 py-2">
            {products.map((p) => (
              <CarouselItem
                key={p.id}
                className="basis-[92%] pl-4 sm:basis-1/2 md:basis-[45%] lg:basis-1/4"
              >
                <ProductCard product={p} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}

function RelatedSectionHeader({ titleId }: { titleId: string }) {
  return (
    <header className="mb-6">
      <h2 id={titleId} className="text-lg font-bold tracking-wide text-gray-900 md:text-xl">
        SẢN PHẨM LIÊN QUAN
      </h2>
      <div className="mt-2.5 h-px w-full rounded-full bg-black dark:bg-white" aria-hidden />
    </header>
  );
}
