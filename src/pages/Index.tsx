import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ProductStockIndicator } from '@/components/ProductStockIndicator';
import { ReservationRequestForm } from '@/components/ReservationRequestForm';
import { SampleOrderDialog } from '@/components/SampleOrderDialog';
import { InterestForm } from '@/components/InterestForm';
import { ImageCarousel } from '@/components/ImageCarousel';
import { TechnicalSpecs } from '@/components/TechnicalSpecs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { PostcodeChecker } from '@/components/PostcodeChecker';
import { FAQ } from '@/components/FAQ';
import { Download, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import innerSpaceLogo from '@/assets/inner-space-logo-new.png';

import { useSiteSettings } from '@/hooks/use-site-settings';

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
  const [dbHeroImage, setDbHeroImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { settings, loading: settingsLoading } = useSiteSettings();

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

        // Fire images fetch in parallel — no await needed here, it runs concurrently
        supabase
          .from('product_images')
          .select('image_url, image_type')
          .eq('product_id', products.id)
          .order('display_order')
          .then(({ data: images }) => {
            if (images) {
              const hero = images.find(img => img.image_type === 'hero');
              if (hero) setDbHeroImage(hero.image_url);
              setProductImages(images.filter(img => img.image_type !== 'hero').map(img => img.image_url));
            }
          });
      }
      setLoading(false);
    };

    fetchProduct();
  }, []);

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm tracking-widest uppercase">Loading</div>
      </div>
    );
  }

  // Check if allocation is manually closed or timer expired
  const allocationClosed = settings.allocation_open === 'false' || isExpired;

  if (allocationClosed) {
    return (
      <div className="min-h-screen bg-background">
        <AllocationClosed />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Fixed on mobile */}
      <header className="py-3 sm:py-6">
        <div className="section-container flex items-center justify-between">
          <img 
            src={innerSpaceLogo} 
            alt="Inner Space" 
            className="h-5 sm:h-10 w-auto"
          />
          <span className="text-[9px] sm:text-[11px] tracking-[0.12em] sm:tracking-[0.15em] uppercase text-muted-foreground">
            {settings.min_order_label}
          </span>
        </div>
      </header>

      <div className="section-container"><div className="section-divider" /></div>

      {/* Allocation Notice */}
      <div className="py-3 sm:py-4">
        <div className="section-container text-center">
          <p className="text-[15.6px] tracking-[0.15em] uppercase text-muted-foreground font-semibold">
            {settings.allocation_notice}
          </p>
        </div>
      </div>

      <div className="section-container"><div className="section-divider" /></div>

      {/* Hero Section */}
      <section className="pt-8 pb-6 sm:pt-14 sm:pb-10 lg:pt-16 lg:pb-12">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            {/* Left: Text */}
            <div className="order-2 lg:order-1 text-center lg:text-left">
              <h1 className="font-serif text-[40px] sm:text-h1 lg:text-h1-lg font-light text-foreground mb-1 leading-[1.05]">
                {settings.hero_heading}
              </h1>
              <div className="w-16 h-[2px] bg-brand-accent mb-4 mx-auto lg:mx-0" />
              <p className="text-muted-foreground text-base mb-1">{settings.hero_subheading}</p>
              <p className="text-muted-foreground text-sm mb-4">
                Including nationwide kerbside delivery
              </p>

              <div className="flex items-baseline gap-2 sm:gap-3 mb-4 justify-center lg:justify-start flex-wrap">
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
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-md mx-auto lg:mx-0">
                {settings.hero_description}
              </p>

              {/* Countdown */}
              <div className="mb-5">
                <CountdownTimer endDate={settings.allocation_end_date} onExpired={() => setIsExpired(true)} />
              </div>

              <div className="flex flex-col gap-3">
                <Button size="lg" className="h-12 text-sm tracking-[0.05em] w-full" asChild>
                  <a href="#reservation">Request Reservation</a>
                </Button>
                <SampleOrderDialog productId={product?.id}>
                  <Button size="lg" variant="secondary" className="h-12 text-sm tracking-[0.05em] w-full hover:bg-brand-accent hover:text-white hover:border-brand-accent">
                    Order Sample — £7.00
                  </Button>
                </SampleOrderDialog>
              </div>

              {/* Data Sheet & Downloads */}
              <div className="mt-5 pt-4 border-t border-border space-y-2">
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
                    href={`${product.data_sheet_url}?download=`}
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
              {dbHeroImage ? (
                <ImageCarousel 
                  images={productImages} 
                  heroImage={dbHeroImage}
                />
              ) : (
                <div className="aspect-square bg-muted w-full" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stock Allocation */}
      <section className="pb-6 sm:pb-14">
        <div className="section-container">
          {product && (
            <ProductStockIndicator
              productId={product.id}
              initialAllocation={product.stock_allocation || 1498}
              initialSold={product.stock_sold || 0}
            />
          )}
        </div>
      </section>

      {/* Technical Specifications - Collapsible */}
      <section className="pb-9 sm:pb-18">
        <div className="section-container">
          <Collapsible>
            <CollapsibleTrigger className="w-full text-left group">
              <p className="section-label">Technical Specification</p>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-h2 sm:text-h2-lg font-light text-foreground">
                  Performance & Material Data
                </h2>
                <span className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-muted-foreground group-data-[state=open]:hidden">
                  Show <ChevronDown className="h-3 w-3" />
                </span>
                <span className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-muted-foreground hidden group-data-[state=open]:flex">
                  Hide <ChevronUp className="h-3 w-3" />
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
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
                  href={`${product.data_sheet_url}?download=`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors hover-accent-underline mt-8"
                >
                  <FileText className="h-4 w-4" />
                  <span>Download performance data (PDF)</span>
                </a>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </section>


      {/* Reservation Section */}
      <section id="reservation" className="section-alt py-14 sm:py-24">
        <div className="section-container">
          <div className="max-w-2xl mx-auto">
            <p className="section-label">Reservation Process</p>
            <div className="mb-5">
              <h2 className="font-serif text-h2 sm:text-h2-lg font-light text-foreground mb-3">
                Request Reservation
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Reservations are held provisionally for 7 days (max 200 sq.m per order).
              </p>
            </div>
            <div className="border border-border bg-background p-6 sm:p-8">
              {product && <ReservationRequestForm productId={product.id} />}
            </div>
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section className="py-10 sm:py-18">
        <div className="section-container">
          <Collapsible>
            <CollapsibleTrigger className="w-full text-left group">
              <p className="section-label">Frequently Asked Questions</p>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-h2 sm:text-h2-lg font-light text-foreground">
                  FAQ
                </h2>
                <span className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-muted-foreground group-data-[state=open]:hidden">
                  Show <ChevronDown className="h-3 w-3" />
                </span>
                <span className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-muted-foreground hidden group-data-[state=open]:flex">
                  Hide <ChevronUp className="h-3 w-3" />
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-4">
                <FAQ showHeader={false} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </section>

      {/* Pre-footer tagline */}
      <div className="section-container"><div className="section-divider" /></div>
      <div className="py-5 sm:py-8 text-center">
        <p className="font-serif text-sm text-muted-foreground tracking-[0.05em]">
          Supplying premium porcelain to designers and contractors across the UK.
        </p>
      </div>
      <div className="section-container"><div className="section-divider" /></div>

      {/* Footer */}
      <footer className="py-8 sm:py-12">
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
