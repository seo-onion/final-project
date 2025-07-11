// app/page.tsx
import { FlashSales } from "@/components/home/flash-sales";
import { ProductCarousel } from "@/components/home/product-carousel"
import { CategoryGrid } from "@/components/home/category-grid";
import { HeroBanner } from "@/components/home/hero-banner";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function Home() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <Header />
      <main>
        <HeroBanner />
        <CategoryGrid />
        <ProductCarousel title="Ofertas del día" />
        <FlashSales />
        <ProductCarousel title="Más vendidos" />
      </main>
      <Footer />
    </div>
  );
}
