import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ProductStockIndicator } from '@/components/ProductStockIndicator';
import { ActionCard } from '@/components/ActionCard';
import { ReservationRequestForm } from '@/components/ReservationRequestForm';
import { SampleOrderDialog } from '@/components/SampleOrderDialog';
import { InterestForm } from '@/components/InterestForm';
import { ImageCarousel } from '@/components/ImageCarousel';
import { TechnicalSpecs } from '@/components/TechnicalSpecs';
import { ShareButtons } from '@/components/ShareButtons';
import { PostcodeChecker } from '@/components/PostcodeChecker';
import { FAQ } from '@/components/FAQ';
import { Package, Bell, Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import innerSpaceLogo from '@/assets/inner-space-logo.png';
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
      <header className="py-6 sm:py-8">
        <div className="section-container flex items-center justify-between">
          <img 
            src={innerSpaceLogo} 
            alt="Inner Space" 
            className="h-8 sm:h-10 w-auto"
          />
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            Minimum order: 57 sq.m
          </span>
        </div>
      </header>

      <div className="section-container"><div className="section-divider" /></div>

      {/* Allocation Notice */}
      <div className="py-5">
        <div className="section-container">
          <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground text-center">
            Limited Factory Allocation
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Left: Text */}
            <div className="order-2 lg:order-1">
              <h1 className="font-serif text-h1 lg:text-h1-lg font-light text-foreground mb-4 leading-[1.05]">
                Miami Grande Bianco
              </h1>
              <p className="text-muted-foreground text-base mb-1">120×120cm — Made in Italy</p>
              <p className="text-muted-foreground text-sm mb-8">
                Including nationwide kerbside delivery
              </p>

              <div className="flex items-baseline gap-3 mb-6">
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
              <p className="text-sm text-muted-foreground leading-relaxed mb-10 max-w-md">
                This allocation has been secured directly from production and is available in confirmed pallet quantities only. Suitable for ground floor renovations and indoor–outdoor architectural continuity.
              </p>

              {product?.matching_outdoor_option && (
                <p className="text-sm text-muted-foreground mb-8">
                  Matching outdoor anti-slip option available
                </p>
              )}

              {/* Postcode Checker */}
              <div className="mb-10">
                <PostcodeChecker compact />
              </div>

              {/* Countdown */}
              <div className="mb-10">
                <CountdownTimer onExpired={() => setIsExpired(true)} />
              </div>

              <div className="flex flex-col gap-3">
                <Button size="lg" variant="outline" className="h-12 text-sm tracking-[0.05em] w-full" asChild>
                  <a href="#reservation">Request Reservation</a>
                </Button>
                <SampleOrderDialog productId={product?.id}>
                  <Button size="lg" variant="secondary" className="h-12 text-sm tracking-[0.05em] w-full">
                    Order Sample — £7
                  </Button>
                </SampleOrderDialog>
              </div>

              {/* Data Sheet & Downloads */}
              <div className="mt-10 pt-8 border-t border-border space-y-3">
                {product?.google_drive_link && (
                  <a 
                    href={product.google_drive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Tile performance data sheet</span>
                  </a>
                )}
              </div>

              {/* Share */}
              <div className="mt-8 pt-8 border-t border-border">
                <ShareButtons />
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

      {/* Divider with spacing */}
      <div className="py-[60px]">
        <div className="section-container"><div className="section-divider" /></div>
      </div>

      {/* Stock Allocation */}
      <section className="pb-20 sm:pb-28">
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

      {/* Divider with spacing */}
      <div className="py-[60px]">
        <div className="section-container"><div className="section-divider" /></div>
      </div>

      {/* Technical Specifications */}
      <section className="pb-20 sm:pb-28">
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
        </div>
      </section>

      {/* Project Suitability - alt bg */}
      <section className="section-alt py-20 sm:py-28">
        <div className="section-container">
          <p className="section-label">Project Suitability</p>
          <div className="max-w-2xl">
            <ul className="space-y-4 text-sm text-foreground leading-relaxed">
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
            <p className="text-xs text-muted-foreground mt-8">
              Due to pallet quantities, this allocation is generally unsuitable for small bathroom installations.
            </p>
          </div>
        </div>
      </section>

      {/* Divider with spacing */}
      <div className="py-[60px]">
        <div className="section-container"><div className="section-divider" /></div>
      </div>

      {/* Reservation Section */}
      <section id="reservation" className="section-alt py-20 sm:py-28">
        <div className="section-container">
          <div className="max-w-2xl mx-auto">
            <p className="section-label">Reservation Process</p>
            <div className="mb-10">
              <h2 className="font-serif text-h2 sm:text-h2-lg font-light text-foreground mb-4">
                Request Reservation
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Reservations are linked to confirmed sample requests. Minimum 57 sq.m.
              </p>
            </div>
            <div className="border border-border bg-background p-8 sm:p-10">
              {product && <ReservationRequestForm productId={product.id} />}
            </div>
          </div>
        </div>
      </section>

      {/* Divider with spacing */}
      <div className="py-[60px]">
        <div className="section-container"><div className="section-divider" /></div>
      </div>

      {/* Other Options */}
      <section id="actions" className="pb-20 sm:pb-28">
        <div className="section-container">
          <p className="section-label">Delivery &amp; Terms</p>
          <div className="mb-10">
            <h2 className="font-serif text-h2 sm:text-h2-lg font-light text-foreground mb-3">
              Additional Options
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-12 max-w-3xl">
            <SampleOrderDialog productId={product?.id}>
              <div className="cursor-pointer group">
                <div className="mb-4">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-serif text-lg font-light text-foreground mb-2">Order a Sample</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  20×15cm sample tile — £7 to cover postage and packaging.
                </p>
                <Button variant="secondary" className="text-sm tracking-[0.05em]">
                  Order Sample
                </Button>
              </div>
            </SampleOrderDialog>
            
            <ActionCard
              icon={Bell}
              title="Register Interest"
              description="Receive notification when the next allocation opens."
              buttonText="Register"
              buttonVariant="secondary"
            >
              <InterestForm />
            </ActionCard>
          </div>
        </div>
      </section>

      {/* Divider with spacing */}
      <div className="py-[60px]">
        <div className="section-container"><div className="section-divider" /></div>
      </div>

      {/* FAQ Section */}
      <section className="pb-20 sm:pb-28">
        <div className="section-container">
          <FAQ />
        </div>
      </section>

      {/* Pre-footer divider + tagline */}
      <div className="section-container"><div className="section-divider" /></div>
      <div className="py-12 text-center">
        <p className="font-serif text-sm text-muted-foreground tracking-[0.05em]">
          Supplying premium porcelain to designers and contractors across the UK.
        </p>
      </div>
      <div className="section-container"><div className="section-divider" /></div>

      {/* Footer */}
      <footer className="py-16 sm:py-20">
        <div className="section-container text-center">
          <img 
            src={innerSpaceLogo} 
            alt="Inner Space" 
            className="h-7 w-auto mx-auto mb-6"
          />
          <div className="mt-8">
            <p className="text-xs text-muted-foreground tracking-[0.05em]">
              © {new Date().getFullYear()} Inner Space. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

function AllocationClosed() {
  return (
    <>
      <header className="py-6 sm:py-8">
        <div className="section-container">
          <img 
            src={innerSpaceLogo} 
            alt="Inner Space" 
            className="h-8 sm:h-10 w-auto"
          />
        </div>
      </header>
      
      <div className="section-container"><div className="section-divider" /></div>
      
      <section className="py-24 lg:py-32">
        <div className="section-container text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="font-serif text-h2 sm:text-h2-lg font-light text-foreground mb-4">
              This allocation has now closed
            </h2>
            <p className="text-base text-muted-foreground mb-12">
              The allocated stock release has ended. Register below to be notified when the next allocation opens.
            </p>
            
            <div className="max-w-md mx-auto">
              <InterestForm />
            </div>
          </div>
        </div>
      </section>
      
      <div className="section-container"><div className="section-divider" /></div>
      
      <footer className="py-16">
        <div className="section-container text-center">
          <img 
            src={innerSpaceLogo} 
            alt="Inner Space" 
            className="h-7 w-auto mx-auto mb-3"
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
