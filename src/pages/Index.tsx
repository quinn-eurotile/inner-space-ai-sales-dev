import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ProductStockIndicator } from '@/components/ProductStockIndicator';
import { ReservationRequestForm } from '@/components/ReservationRequestForm';
import { SampleOrderDialog } from '@/components/SampleOrderDialog';
import { InterestForm } from '@/components/InterestForm';
import { ImageCarousel } from '@/components/ImageCarousel';
import { TechnicalSpecs } from '@/components/TechnicalSpecs';

import { PostcodeChecker } from '@/components/PostcodeChecker';
import { FAQ } from '@/components/FAQ';
import { Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import innerSpaceLogo from '@/assets/inner-space-logo-new.png';
import heroImage from '@/assets/hero-tiles.jpg';

interface Product {
  id: string;
  name: string;
  collection: string | null;
  origin: string | null;
  price_per_sqm: number;
  price_per_tile: number | null;
  factory_rating: string | null;
  tile_colour: string | null;
  thickness_mm: number | null;
  width_mm: number | null;
  length_mm: number | null;
  nominal_size: string | null;
  finish: string | null;
  matching_outdoor_option: boolean | null;
  shape: string | null;
  suitability: string | null;
  underfloor_heating_compatible: boolean | null;
  tile_style: string | null;
  edge: string | null;
  slip_rating: string | null;
  no_tile_faces: string | null;
  material: string | null;
  frost_resistant: boolean | null;
  sqm_per_tile: number | null;
  tiles_per_box: number | null;
  sqm_per_box: number | null;
  kg_per_box: number | null;
  boxes_per_pallet: number | null;
  sqm_per_pallet: number | null;
  stock_allocation: number | null;
  stock_sold: number | null;
  google_drive_link: string | null;
  data_sheet_url: string | null;
}

const Index = () => {
  const [isExpired, setIsExpired] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (products && !error) {
        setProduct(products);
        
        const { data: images } = await supabase
          .from('product_images')
          .select('image_url')
          .eq('product_id', products.id)
          .order('display_order');
        
        if (images) {
          setProductImages(images.map(img => img.image_url));
        }
      }
      setLoading(false);
    };

    fetchProduct();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm tracking-widest uppercase">Loading</div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-background">
        <AllocationClosed />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-5 sm:py-6">
        <div className="section-container flex items-center justify-between">
          <img 
            src={innerSpaceLogo} 
            alt="Inner Space" 
            className="h-8 sm:h-10 w-auto"
          />
          <span className="text-[11px] tracking-[0.15em] uppercase text-muted-foreground">
            Min. order 57 sq.m
          </span>
        </div>
      </header>

      <div className="section-container"><div className="section-divider" /></div>

      {/* Allocation Notice */}
      <div className="py-4">
        <div className="section-container text-center">
          <p className="text-[13px] tracking-[0.15em] uppercase text-muted-foreground">
            Limited Factory Allocation
          </p>
        </div>
      </div>

      <div className="section-container"><div className="section-divider" /></div>

      {/* Hero Section */}
      <section className="pt-10 pb-14 sm:pt-14 sm:pb-16 lg:pt-16 lg:pb-20">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Left: Text */}
            <div className="order-2 lg:order-1 text-center lg:text-left">
              <h1 className="font-serif text-[40px] sm:text-h1 lg:text-h1-lg font-light text-foreground mb-1 leading-[1.05]">
                Miami Grande Bianco
              </h1>
              <div className="w-16 h-[2px] bg-brand-accent mb-5 mx-auto lg:mx-0" />
              <p className="text-muted-foreground text-base mb-1">120×120cm — Made in Italy</p>
              <p className="text-muted-foreground text-sm mb-6">
                Including nationwide kerbside delivery
              </p>

              <div className="flex items-baseline gap-3 mb-5 justify-center lg:justify-start">
                <span className="font-serif text-3xl lg:text-4xl font-light text-foreground">
                  £{product?.price_per_sqm?.toFixed(2) || '36.00'}
                </span>
                <span className="text-sm text-muted-foreground">per sq.m</span>
                {product?.price_per_tile && (
                  <span className="text-sm text-muted-foreground">
                    / £{product.price_per_tile.toFixed(2)} per tile
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground tracking-[0.15em] uppercase">ex. vat</span>
              </div>

              {/* Editorial paragraph */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
                This allocation has been secured directly from production and is available in confirmed pallet quantities only. Suitable for ground floor renovations and indoor–outdoor architectural continuity.
              </p>

              {product?.matching_outdoor_option && (
                <p className="text-sm text-muted-foreground mb-6">
                  Matching outdoor anti-slip option available
                </p>
              )}

              {/* Postcode Checker */}
              <div className="mb-8">
                <PostcodeChecker compact />
              </div>

              {/* Countdown */}
              <div className="mb-8">
                <CountdownTimer onExpired={() => setIsExpired(true)} />
              </div>

              <div className="flex flex-col gap-3">
                <Button size="lg" className="h-12 text-sm tracking-[0.05em] w-full" asChild>
                  <a href="#reservation">Request Reservation</a>
                </Button>
                <SampleOrderDialog productId={product?.id}>
                  <Button size="lg" variant="secondary" className="h-12 text-sm tracking-[0.05em] w-full hover:bg-brand-accent hover:text-white hover:border-brand-accent">
                    Order Sample — £7
                  </Button>
                </SampleOrderDialog>
              </div>

              {/* Data Sheet & Downloads */}
              <div className="mt-8 pt-6 border-t border-border space-y-3">
                {product?.google_drive_link && (
                  <a 
                    href={product.google_drive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors hover-accent-underline justify-center lg:justify-start"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download high-res images</span>
                  </a>
                )}
                {product?.data_sheet_url && (
                  <a
                    href={product.data_sheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors hover-accent-underline justify-center lg:justify-start"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Tile performance data sheet</span>
                  </a>
                )}
              </div>

            </div>

            {/* Right: Image */}
            <div className="order-1 lg:order-2">
              <ImageCarousel 
                images={productImages} 
                heroImage={heroImage}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="section-container"><div className="section-divider" /></div>

      {/* Stock Allocation */}
      <section className="py-14 sm:py-16">
        <div className="section-container">
          {product && (
            <ProductStockIndicator 
              productId={product.id}
              initialAllocation={product.stock_allocation || 38}
              initialSold={product.stock_sold || 0}
            />
          )}
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="pb-14 sm:pb-16">
        <div className="section-container">
          {product && (
            <TechnicalSpecs 
              specs={{
                origin: product.origin || undefined,
                factoryRating: product.factory_rating || undefined,
                tileColour: product.tile_colour || undefined,
                thicknessMm: product.thickness_mm || undefined,
                widthMm: product.width_mm || undefined,
                lengthMm: product.length_mm || undefined,
                nominalSize: product.nominal_size || undefined,
                finish: product.finish || undefined,
                matchingOutdoorOption: product.matching_outdoor_option || undefined,
                shape: product.shape || undefined,
                suitability: product.suitability || undefined,
                underfloorHeatingCompatible: product.underfloor_heating_compatible || undefined,
                tileStyle: product.tile_style || undefined,
                edge: product.edge || undefined,
                slipRating: product.slip_rating || undefined,
                noTileFaces: product.no_tile_faces || undefined,
                material: product.material || undefined,
                frostResistant: product.frost_resistant || undefined,
                sqmPerTile: product.sqm_per_tile ? Number(product.sqm_per_tile) : undefined,
                tilesPerBox: product.tiles_per_box || undefined,
                sqmPerBox: product.sqm_per_box ? Number(product.sqm_per_box) : undefined,
                kgPerBox: product.kg_per_box ? Number(product.kg_per_box) : undefined,
                boxesPerPallet: product.boxes_per_pallet || undefined,
                sqmPerPallet: product.sqm_per_pallet ? Number(product.sqm_per_pallet) : undefined,
              }}
            />
          )}
          {product?.data_sheet_url && (
            <a
              href={product.data_sheet_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors hover-accent-underline mt-8"
            >
              <FileText className="h-4 w-4" />
              <span>Download performance data (PDF)</span>
            </a>
          )}
        </div>
      </section>

      {/* Project Suitability - alt bg */}
      <section className="section-alt py-14 sm:py-16">
        <div className="section-container">
          <p className="section-label">Project Suitability</p>
          <h2 className="font-serif text-h2 sm:text-h2-lg font-light text-foreground mb-5">
            Recommended Applications
          </h2>
          <div className="max-w-2xl">
            <ul className="space-y-3 text-sm text-foreground leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="text-muted-foreground mt-0.5">·</span>
                <span>Ground floor renovations and open-plan living spaces</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-muted-foreground mt-0.5">·</span>
                <span>Large-format contemporary interiors requiring visual continuity</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-muted-foreground mt-0.5">·</span>
                <span>Indoor–outdoor architectural schemes (matching 20mm outdoor format available in R11)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-muted-foreground mt-0.5">·</span>
                <span>Residential and commercial projects requiring first-quality Italian porcelain</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Reservation Section */}
      <section id="reservation" className="section-alt py-14 sm:py-16">
        <div className="section-container">
          <div className="max-w-2xl mx-auto">
            <p className="section-label">Reservation Process</p>
            <div className="mb-8">
              <h2 className="font-serif text-h2 sm:text-h2-lg font-light text-foreground mb-3">
                Request Reservation
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Reservations are linked to confirmed sample requests. Minimum 57 sq.m. Reservations are held provisionally for 7 days (max 200 sq.m per order).
              </p>
            </div>
            <div className="border border-border bg-background p-6 sm:p-8">
              {product && <ReservationRequestForm productId={product.id} />}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="section-container"><div className="section-divider" /></div>

      {/* Next Steps strip */}
      <section className="py-14 sm:py-16">
        <div className="section-container">
          <p className="section-label">Next Steps</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
            <SampleOrderDialog productId={product?.id}>
              <Button variant="secondary" className="h-11 text-sm tracking-[0.05em] w-full sm:flex-1 hover:bg-brand-accent hover:text-white hover:border-brand-accent">
                Order Sample — £7
              </Button>
            </SampleOrderDialog>
            <Button className="h-11 text-sm tracking-[0.05em] w-full sm:flex-1" asChild>
              <a href="#reservation">Request Reservation</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="section-container"><div className="section-divider" /></div>

      {/* FAQ Section */}
      <section className="py-14 sm:py-16">
        <div className="section-container">
          <FAQ />
        </div>
      </section>

      {/* Pre-footer divider + tagline */}
      <div className="section-container"><div className="section-divider" /></div>
      <div className="py-8 text-center">
        <p className="font-serif text-sm text-muted-foreground tracking-[0.05em]">
          Supplying premium porcelain to designers and contractors across the UK.
        </p>
      </div>
      <div className="section-container"><div className="section-divider" /></div>

      {/* Footer */}
      <footer className="py-10 sm:py-12">
        <div className="section-container text-center">
          <img 
            src={innerSpaceLogo} 
            alt="Inner Space" 
            className="h-10 w-auto mx-auto mb-4"
          />
          <p className="text-xs text-muted-foreground tracking-[0.05em]">
            © {new Date().getFullYear()} Inner Space. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

function AllocationClosed() {
  return (
    <>
      <header className="py-5 sm:py-6">
        <div className="section-container">
          <img 
            src={innerSpaceLogo} 
            alt="Inner Space" 
            className="h-10 sm:h-12 w-auto"
          />
        </div>
      </header>
      
      <div className="section-container"><div className="section-divider" /></div>
      
      <section className="py-20 lg:py-24">
        <div className="section-container text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="font-serif text-h2 sm:text-h2-lg font-light text-foreground mb-4">
              This allocation has now closed
            </h2>
            <p className="text-base text-muted-foreground mb-10">
              The allocated stock release has ended. Register below to be notified when the next allocation opens.
            </p>
            
            <div className="max-w-md mx-auto">
              <InterestForm />
            </div>
          </div>
        </div>
      </section>
      
      <div className="section-container"><div className="section-divider" /></div>
      
      <footer className="py-10">
        <div className="section-container text-center">
          <img 
            src={innerSpaceLogo} 
            alt="Inner Space" 
            className="h-8 w-auto mx-auto mb-3"
          />
          <p className="font-serif text-sm text-muted-foreground tracking-[0.05em]">
            Supplying premium porcelain to designers and contractors across the UK.
          </p>
        </div>
      </footer>
    </>
  );
}

export default Index;
