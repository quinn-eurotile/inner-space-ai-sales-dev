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
import { Package, Bell, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import innerSpaceLogo from '@/assets/inner-space-logo-white.png';
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
        
        // Fetch product images
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
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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
      {/* Header - Compact for mobile */}
      <header className="py-3 sm:py-6 border-b border-border">
        <div className="section-container flex items-center justify-between gap-2">
          <img 
            src={innerSpaceLogo} 
            alt="Inner Space" 
            className="h-10 sm:h-14 w-auto"
          />
          <div className="bg-primary/20 border border-primary/40 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2">
            <span className="text-primary font-bold text-xs sm:text-sm">
              MIN ORDER: 57 SQ.M
            </span>
          </div>
        </div>
      </header>

      {/* Factory Allocation Banner */}
      <div className="bg-primary py-2 sm:py-3">
        <div className="section-container text-center">
          <span className="text-lg sm:text-2xl md:text-3xl font-bold text-primary-foreground tracking-wide">
            LIMITED FACTORY ALLOCATION
          </span>
        </div>
      </div>

      {/* Hero Section - Mobile optimized */}
      <section className="py-4 sm:py-8 lg:py-12">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-12">
            {/* Image Carousel */}
            <div>
              <ImageCarousel 
                images={productImages} 
                heroImage={heroImage}
              />
              
              {/* Download Link */}
              <a 
                href={product?.google_drive_link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 mt-3 sm:mt-4 py-2.5 sm:py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span className="text-xs sm:text-sm font-bold">Download High-Res Images</span>
              </a>
            </div>

            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-1">
                Miami Grande Bianco 120x120cm
              </h1>
              
              <p className="text-muted-foreground text-xs sm:text-sm mb-2 sm:mb-3">Made in Italy</p>
              
              <p className="text-foreground font-medium text-sm sm:text-base mb-0.5 sm:mb-1">
                Including Nationwide Kerbside Delivery
              </p>
              <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">
                Some addresses may incur additional delivery charges
              </p>

              <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-primary">
                  £{product?.price_per_sqm?.toFixed(2) || '36.00'}
                </span>
                <span className="text-base sm:text-lg text-muted-foreground">per SQ.M</span>
                {product?.price_per_tile && (
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    (£{product.price_per_tile.toFixed(2)} per tile)
                  </span>
                )}
                <span className="text-xs sm:text-sm text-muted-foreground ml-1 sm:ml-2">EX.VAT</span>
              </div>

              {product?.matching_outdoor_option && (
                <div className="inline-flex items-center gap-2 bg-success/10 text-success border border-success/20 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6 w-fit">
                  <span className="font-medium text-xs sm:text-sm">✓ Outdoor Anti-Slip Option Available</span>
                </div>
              )}

              {/* Countdown Timer */}
              <div className="mb-4 sm:mb-8">
                <CountdownTimer onExpired={() => setIsExpired(true)} />
              </div>

              <div className="flex flex-col gap-2 sm:gap-4">
                <Button size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base w-full" asChild>
                  <a href="#reservation">Request Reservation</a>
                </Button>
                <SampleOrderDialog>
                  <Button size="lg" variant="secondary" className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base w-full">
                    Order Sample – £7
                  </Button>
                </SampleOrderDialog>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stock Indicator Section */}
      <section className="py-6 sm:py-12 bg-secondary/30 border-y border-border">
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
      <section className="py-6 sm:py-12 lg:py-16">
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

      {/* Reservation Section */}
      <section id="reservation" className="py-6 sm:py-12 lg:py-16 bg-card border-y border-border">
        <div className="section-container">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-4 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 text-primary">
                Request Reservation
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Secure your allocation with a reservation request (minimum 57 SQ.M)
              </p>
            </div>
            {product && <ReservationRequestForm productId={product.id} />}
          </div>
        </div>
      </section>

      {/* Actions Section */}
      <section id="actions" className="py-6 sm:py-12 lg:py-16">
        <div className="section-container">
          <div className="text-center mb-6 sm:mb-12">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">
              Other Options
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base">Choose the option that suits your needs</p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
            <SampleOrderDialog>
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:border-primary/30 hover:shadow-premium transition-all cursor-pointer">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary flex items-center justify-center mb-3 sm:mb-4">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
                </div>
                <h4 className="font-bold text-base sm:text-lg mb-1.5 sm:mb-2">Order a Sample</h4>
                <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6">
                  Get a 20×15cm sample tile for £7. Charged to cover postage and packaging.
                </p>
                <Button variant="secondary" className="w-full h-10 sm:h-11 text-sm">
                  Order Sample – £7
                </Button>
              </div>
            </SampleOrderDialog>
            
            <ActionCard
              icon={Bell}
              title="Register Interest"
              description="Not ready now? Get notified for future allocation releases."
              buttonText="Notify Me"
              buttonVariant="outline"
            >
              <InterestForm />
            </ActionCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-card border-t border-border">
        <div className="section-container text-center">
          <img 
            src={innerSpaceLogo} 
            alt="Inner Space" 
            className="h-10 sm:h-12 w-auto mx-auto mb-3 sm:mb-4"
          />
          <p className="text-muted-foreground/80 max-w-md mx-auto text-xs sm:text-sm">
            Supplying premium porcelain to designers and contractors across the UK.
          </p>
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground/60">
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
      <header className="py-4 border-b border-border">
        <div className="section-container">
          <img 
            src={innerSpaceLogo} 
            alt="Inner Space" 
            className="h-10 sm:h-12 w-auto"
          />
        </div>
      </header>
      
      <section className="py-24 lg:py-32">
        <div className="section-container text-center">
          <div className="max-w-xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-8">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-serif font-semibold mb-4">
              This allocation has now closed
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              The allocated stock release has ended. Register below to be notified when the next allocation opens.
            </p>
            
            <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-auto">
              <InterestForm />
            </div>
          </div>
        </div>
      </section>
      
      <footer className="py-12 bg-card border-t border-border">
        <div className="section-container text-center">
          <img 
            src={innerSpaceLogo} 
            alt="Inner Space" 
            className="h-8 w-auto mx-auto mb-2"
          />
          <p className="text-sm text-muted-foreground">
            Supplying premium porcelain to designers and contractors across the UK.
          </p>
        </div>
      </footer>
    </>
  );
}

export default Index;
