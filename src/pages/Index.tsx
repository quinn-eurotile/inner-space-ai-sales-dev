import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ProductStockIndicator } from '@/components/ProductStockIndicator';
import { ReservationRequestForm } from '@/components/ReservationRequestForm';
import { SampleOrderDialog } from '@/components/SampleOrderDialog';
import { InterestForm } from '@/components/InterestForm';
import { RegisterInterestInline } from '@/components/RegisterInterestInline';
import { ImageCarousel } from '@/components/ImageCarousel';
import { TechnicalSpecs } from '@/components/TechnicalSpecs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StockBanner } from '@/components/StockBanner';
import { StickyMobileCTA } from '@/components/StickyMobileCTA';

import { FAQ } from '@/components/FAQ';
import { Download, FileText, ChevronDown, ChevronUp, Check, Truck, Factory, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import innerSpaceLogo from '@/assets/inner-space-logo-new.png';

import { useSiteSettings } from '@/hooks/use-site-settings';
import { pinterestTrack } from '@/lib/pinterest';

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
    pinterestTrack('pagevisit');

    const fetchProduct = async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (products && !error) {
        setProduct(products);

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

  const allocationClosed = settings.allocation_open === 'false' || isExpired;

  if (allocationClosed) {
    return (
      <div className="min-h-screen bg-background">
        <AllocationClosed />
      </div>
    );
  }

  const pricePerSqm = product?.price_per_sqm || 36;

  return (
    <div className="min-h-screen bg-background">
      {/* Scarcity banner */}
      {product && (
        <StockBanner
          productId={product.id}
          stockAllocation={product.stock_allocation || 1498}
          stockSold={product.stock_sold || 0}
        />
      )}

      {/* Header */}
      <header className="py-3 sm:py-5">
        <div className="section-container flex items-center justify-between">
          <img 
            src={innerSpaceLogo} 
            alt="Inner Space" 
            className="h-5 sm:h-10 w-auto"
          />
          <div className="flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            <span className="text-[9px] sm:text-[11px] tracking-[0.12em] uppercase text-muted-foreground">
              Nationwide Delivery
            </span>
          </div>
        </div>
      </header>

      <div className="section-container"><div className="section-divider" /></div>

      {/* Hero Section — restructured for cold traffic */}
      <section className="pt-6 pb-6 sm:pt-10 sm:pb-8 lg:pt-12 lg:pb-10">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-14 items-start">
            {/* Left: Image FIRST on mobile */}
            <div className="order-1">
              {dbHeroImage ? (
                <ImageCarousel 
                  images={productImages} 
                  heroImage={dbHeroImage}
                />
              ) : (
                <div className="aspect-square bg-muted w-full" />
              )}
            </div>

            {/* Right: Value proposition */}
            <div className="order-2 text-center lg:text-left">
              {/* Eyebrow — instant category recognition */}
              <p className="text-[11px] sm:text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">
                Italian Porcelain · 120×120cm · Matt Finish
              </p>

              {/* Headline — category + allocation framing, no price */}
              <h1 className="font-serif text-[28px] sm:text-[40px] lg:text-[44px] font-light text-foreground mb-2 leading-[1.08]">
                Italian 120×120 Porcelain<br />
                <span className="text-brand-accent">Factory Allocation</span>
              </h1>

              {/* Price anchor — immediately beneath H1 */}
              <div className="flex items-center gap-2 mb-3 justify-center lg:justify-start flex-wrap">
                <span className="text-lg sm:text-xl font-semibold text-foreground">
                  £{pricePerSqm.toFixed(2)}/sq.m
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  £75.00
                </span>
                <span className="inline-flex items-center bg-success/10 text-success text-xs font-semibold px-2 py-0.5 rounded">
                  Save 52%
                </span>
                <span className="text-[10px] text-muted-foreground tracking-[0.1em] uppercase">ex. vat</span>
              </div>

              {/* Primary CTA — in the mobile fold */}
              <div data-hero-cta className="flex flex-col gap-2.5 max-w-md mx-auto lg:mx-0 mb-5">
                <RegisterInterestInline
                  buttonClassName="h-12 tracking-[0.05em] w-full transition-colors font-semibold"
                  buttonStyle={{ backgroundColor: '#f0aa47', color: '#ffffff', border: 'none', fontSize: '1.05rem' }}
                  productName={product?.name}
                />

                {/* Micro CTA — text link style, not competing button */}
                <SampleOrderDialog productId={product?.id}>
                  <button className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-muted-foreground/30 hover:decoration-foreground/50 cursor-pointer">
                    Not ready? Order a £7.00 sample tile →
                  </button>
                </SampleOrderDialog>
              </div>

              {/* Trust bullets — below CTA on mobile, scannable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mb-4 text-left max-w-md mx-auto lg:mx-0">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>AAA first-quality rated</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Truck className="h-4 w-4 text-success shrink-0" />
                  <span>Free kerbside delivery</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Factory className="h-4 w-4 text-success shrink-0" />
                  <span>Direct from Italian factory</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Shield className="h-4 w-4 text-success shrink-0" />
                  <span>Walls, floors & outdoor</span>
                </div>
              </div>

              {/* Countdown — below trust on mobile */}
              <div className="mb-4">
                <CountdownTimer endDate={settings.allocation_end_date} onExpired={() => setIsExpired(true)} />
              </div>

              {/* Downloads */}
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
          </div>
        </div>
      </section>

      {/* Stock Allocation — full detail */}
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

      {/* Pre-footer */}
      <div className="section-container"><div className="section-divider" /></div>
      <div className="py-5 sm:py-8 text-center">
        <p className="font-serif text-sm text-muted-foreground tracking-[0.05em]">
          Supplying premium porcelain to designers and contractors across the UK.
        </p>
      </div>
      <div className="section-container"><div className="section-divider" /></div>

      {/* Footer */}
      <footer className="py-8 sm:py-12 pb-20 sm:pb-12">
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

      {/* Sticky mobile CTA */}
      <StickyMobileCTA />
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
