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
          <span className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
            Minimum order: 57 sq.m
          </span>
        </div>
      </header>

      <div className="section-container">
        <div className="border-t border-border" />
      </div>

      {/* Allocation Notice */}
      <div className="py-6">
        <div className="section-container">
          <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground text-center">
            Limited Factory Allocation
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Left: Text */}
            <div className="order-2 lg:order-1">
              <h1 className="font-serif text-h1 lg:text-h1-lg font-light text-foreground mb-4">
                Miami Grande Bianco
              </h1>
              <p className="text-muted-foreground text-base mb-1">120×120cm — Made in Italy</p>
              <p className="text-muted-foreground text-sm mb-8">
                Including nationwide kerbside delivery
              </p>

              <div className="flex items-baseline gap-3 mb-10">
                <span className="font-serif text-4xl lg:text-5xl font-light text-foreground">
                  £{product?.price_per_sqm?.toFixed(2) || '36.00'}
                </span>
                <span className="text-sm text-muted-foreground">per sq.m</span>
                {product?.price_per_tile && (
                  <span className="text-sm text-muted-foreground">
                    / £{product.price_per_tile.toFixed(2)} per tile
                  </span>
                )}
                <span className="text-xs text-muted-foreground tracking-wider uppercase">ex. vat</span>
              </div>

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
                <Button size="lg" className="h-12 text-sm tracking-wide w-full" asChild>
                  <a href="#reservation">Request Reservation</a>
                </Button>
                <SampleOrderDialog productId={product?.id}>
                  <Button size="lg" variant="outline" className="h-12 text-sm tracking-wide w-full">
                    Order Sample — £7
                  </Button>
                </SampleOrderDialog>
              </div>

              {/* Data Sheet & Downloads */}
              <div className="mt-8 pt-8 border-t border-border space-y-3">
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

      <div className="section-container">
        <div className="border-t border-border" />
      </div>

      {/* Stock Allocation */}
      <section className="py-16 sm:py-24">
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

      <div className="section-container">
        <div className="border-t border-border" />
      </div>

      {/* Technical Specifications */}
      <section className="py-16 sm:py-24">
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

      <div className="section-container">
        <div className="border-t border-border" />
      </div>

      {/* Reservation Section */}
      <section id="reservation" className="py-16 sm:py-24">
        <div className="section-container">
          <div className="max-w-2xl mx-auto">
            <div className="mb-10">
              <h2 className="font-serif text-h2 sm:text-h2-lg font-light text-foreground mb-3">
                Request Reservation
              </h2>
              <p className="text-muted-foreground text-sm">
                Secure your allocation with a reservation request. Minimum 57 sq.m.
              </p>
            </div>
            {product && <ReservationRequestForm productId={product.id} />}
          </div>
        </div>
      </section>

      <div className="section-container">
        <div className="border-t border-border" />
      </div>

      {/* Other Options */}
      <section id="actions" className="py-16 sm:py-24">
        <div className="section-container">
          <div className="mb-10">
            <h2 className="font-serif text-h2 sm:text-h2-lg font-light text-foreground mb-3">
              Other Options
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl">
            <SampleOrderDialog productId={product?.id}>
              <div className="cursor-pointer group">
                <div className="mb-4">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-serif text-lg font-light text-foreground mb-2">Order a Sample</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  20×15cm sample tile — £7 to cover postage and packaging.
                </p>
                <Button variant="outline" className="text-sm tracking-wide">
                  Order Sample
                </Button>
              </div>
            </SampleOrderDialog>
            
            <ActionCard
              icon={Bell}
              title="Register Interest"
              description="Get notified when the next allocation opens."
              buttonText="Notify Me"
              buttonVariant="outline"
            >
              <InterestForm />
            </ActionCard>
          </div>
        </div>
      </section>

      <div className="section-container">
        <div className="border-t border-border" />
      </div>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24">
        <div className="section-container">
          <FAQ />
        </div>
      </section>

      <div className="section-container">
        <div className="border-t border-border" />
      </div>

      {/* Footer */}
      <footer className="py-16 sm:py-20">
        <div className="section-container text-center">
          <img 
            src={innerSpaceLogo} 
            alt="Inner Space" 
            className="h-8 w-auto mx-auto mb-4"
          />
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Supplying premium porcelain to designers and contractors across the UK.
          </p>
          <div className="mt-8">
            <p className="text-xs text-muted-foreground">
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
      
      <div className="section-container"><div className="border-t border-border" /></div>
      
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
      
      <div className="section-container"><div className="border-t border-border" /></div>
      
      <footer className="py-16">
        <div className="section-container text-center">
          <img 
            src={innerSpaceLogo} 
            alt="Inner Space" 
            className="h-7 w-auto mx-auto mb-3"
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
