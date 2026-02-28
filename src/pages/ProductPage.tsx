import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ProductStockIndicator } from '@/components/ProductStockIndicator';
import { ReservationRequestForm } from '@/components/ReservationRequestForm';
import { SampleOrderDialog } from '@/components/SampleOrderDialog';
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
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  collection: string | null;
  origin: string | null;
  price_per_sqm: number | null;
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
  page_type: string;
  product_category: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  variant_label: string;
  nominal_size: string | null;
  thickness_mm: number | null;
  width_mm: number | null;
  length_mm: number | null;
  price_per_sqm: number | null;
  price_per_tile: number | null;
  stock_allocation: number | null;
  stock_sold: number | null;
  stock_reserved_manual: number | null;
  sqm_per_tile: number | null;
  tiles_per_box: number | null;
  sqm_per_box: number | null;
  kg_per_box: number | null;
  boxes_per_pallet: number | null;
  sqm_per_pallet: number | null;
  data_sheet_url: string | null;
  display_order: number | null;
}

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [dbHeroImage, setDbHeroImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await (supabase
        .from('products')
        .select('*') as any)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProduct(data);

      // Fetch variants
      const { data: variantData } = await (supabase
        .from('product_variants')
        .select('*') as any)
        .eq('product_id', data.id)
        .order('display_order');

      if (variantData && variantData.length > 0) {
        setVariants(variantData);
        setSelectedVariantId(variantData[0].id);
      }

      const { data: images } = await supabase
        .from('product_images')
        .select('image_url, image_type')
        .eq('product_id', data.id)
        .order('display_order');

      if (images) {
        const hero = images.find(img => img.image_type === 'hero');
        if (hero) setDbHeroImage(hero.image_url);
        setProductImages(images.filter(img => img.image_type !== 'hero').map(img => img.image_url));
      }

      setLoading(false);
    };

    if (slug) fetchProduct();
  }, [slug]);

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm tracking-widest uppercase">Loading</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-3xl text-foreground mb-2">Product Not Found</h1>
          <p className="text-muted-foreground">This product doesn't exist or is no longer available.</p>
        </div>
      </div>
    );
  }

  const hasVariants = variants.length > 0;
  const selectedVariant = hasVariants ? variants.find(v => v.id === selectedVariantId) || variants[0] : null;

  // Use variant-level price if available, otherwise product-level
  const pricePerSqm = selectedVariant?.price_per_sqm ?? product?.price_per_sqm ?? null;
  const isProductSale = product?.page_type === 'product_sale';
  const hasPrice = isProductSale && pricePerSqm !== null && pricePerSqm > 0;

  // Use variant-level specs for display, falling back to product-level
  const activeNominalSize = selectedVariant?.nominal_size ?? product?.nominal_size;
  const activeThickness = selectedVariant?.thickness_mm ?? product?.thickness_mm;
  const activeWidth = selectedVariant?.width_mm ?? product?.width_mm;
  const activeLength = selectedVariant?.length_mm ?? product?.length_mm;
  const activeDataSheet = selectedVariant?.data_sheet_url ?? product?.data_sheet_url;

  return (
    <div className="min-h-screen bg-background">
      {product && hasPrice && (
        <StockBanner
          productId={product.id}
          stockAllocation={selectedVariant?.stock_allocation ?? product.stock_allocation ?? 0}
          stockSold={selectedVariant?.stock_sold ?? product.stock_sold ?? 0}
        />
      )}

      <header className="py-3 sm:py-5">
        <div className="section-container flex items-center justify-between">
          <img src={innerSpaceLogo} alt="Inner Space" className="h-5 sm:h-10 w-auto" />
          <div className="flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            <span className="text-[9px] sm:text-[11px] tracking-[0.12em] uppercase text-muted-foreground">
              Nationwide Delivery
            </span>
          </div>
        </div>
      </header>

      <div className="section-container"><div className="section-divider" /></div>

      <section className="pt-6 pb-6 sm:pt-10 sm:pb-8 lg:pt-12 lg:pb-10">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-14 items-start">
            <div className="order-1">
              {dbHeroImage ? (
                <ImageCarousel images={productImages} heroImage={dbHeroImage} />
              ) : (
                <div className="aspect-square bg-muted w-full" />
              )}
            </div>

            <div className="order-2 text-center lg:text-left">
              <p className="text-[11px] sm:text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">
                {[product?.material, activeNominalSize, product?.finish].filter(Boolean).join(' · ')}
              </p>

              <h1 className="font-serif text-[28px] sm:text-[40px] lg:text-[44px] font-light text-foreground mb-2 leading-[1.08]">
                {product?.name}<br />
                {hasPrice && <span className="text-brand-accent">Factory Allocation</span>}
              </h1>

              {/* Variant size selector */}
              {hasVariants && (
                <div className="flex gap-2 mb-4 justify-center lg:justify-start flex-wrap">
                  {variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={cn(
                        "px-4 py-2 text-sm border transition-colors rounded",
                        v.id === selectedVariantId
                          ? "border-foreground bg-foreground text-background font-medium"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                      )}
                    >
                      {v.variant_label}
                    </button>
                  ))}
                </div>
              )}

              {hasPrice && (
                <div className="flex items-center gap-2 mb-3 justify-center lg:justify-start flex-wrap">
                  <span className="text-lg sm:text-xl font-semibold text-foreground">
                    £{pricePerSqm!.toFixed(2)}/sq.m
                  </span>
                  <span className="text-[10px] text-muted-foreground tracking-[0.1em] uppercase">ex. vat</span>
                </div>
              )}

              <div data-hero-cta className="flex flex-col gap-2.5 max-w-md mx-auto lg:mx-0 mb-5">
                <RegisterInterestInline
                  buttonClassName="h-12 tracking-[0.05em] w-full transition-colors font-semibold"
                  buttonStyle={{ backgroundColor: '#f0aa47', color: '#ffffff', border: 'none', fontSize: '1.05rem' }}
                  productName={product?.name}
                />
                <SampleOrderDialog productId={product?.id}>
                  <button className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-muted-foreground/30 hover:decoration-foreground/50 cursor-pointer">
                    Not ready? Order a £7.00 sample tile →
                  </button>
                </SampleOrderDialog>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mb-4 text-left max-w-md mx-auto lg:mx-0">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>{product?.factory_rating ? `${product.factory_rating} rated` : 'First-quality rated'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Truck className="h-4 w-4 text-success shrink-0" />
                  <span>Free kerbside delivery</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Factory className="h-4 w-4 text-success shrink-0" />
                  <span>{product?.origin ? `Direct from ${product.origin}` : 'Direct from factory'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Shield className="h-4 w-4 text-success shrink-0" />
                  <span>{product?.suitability || 'Walls & floors'}</span>
                </div>
              </div>

              {hasPrice && (
                <div className="mb-4">
                  <CountdownTimer endDate={settings.allocation_end_date} onExpired={() => setIsExpired(true)} />
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-border space-y-2">
                {product?.google_drive_link && (
                  <a href={product.google_drive_link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors hover-accent-underline justify-center lg:justify-start">
                    <Download className="h-4 w-4" /><span>Download high-res images</span>
                  </a>
                )}
                {activeDataSheet && (
                  <a href={`${activeDataSheet}?download=`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors hover-accent-underline justify-center lg:justify-start">
                    <FileText className="h-4 w-4" /><span>Tile performance data sheet{hasVariants && selectedVariant ? ` (${selectedVariant.variant_label})` : ''}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {hasPrice && (
        <section className="pb-6 sm:pb-14">
          <div className="section-container">
            {product && (
              <ProductStockIndicator
                productId={product.id}
                initialAllocation={selectedVariant?.stock_allocation ?? product.stock_allocation ?? 0}
                initialSold={selectedVariant?.stock_sold ?? product.stock_sold ?? 0}
              />
            )}
          </div>
        </section>
      )}

      <section className="pb-9 sm:pb-18">
        <div className="section-container">
          <Collapsible>
            <CollapsibleTrigger className="w-full text-left group">
              <p className="section-label">Technical Specification</p>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-h2 sm:text-h2-lg font-light text-foreground">Performance & Material Data</h2>
                <span className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-muted-foreground group-data-[state=open]:hidden">Show <ChevronDown className="h-3 w-3" /></span>
                <span className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-muted-foreground hidden group-data-[state=open]:flex">Hide <ChevronUp className="h-3 w-3" /></span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {product && (
                <TechnicalSpecs specs={{
                  origin: product.origin || undefined,
                  factoryRating: product.factory_rating || undefined,
                  tileColour: product.tile_colour || undefined,
                  thicknessMm: activeThickness || undefined,
                  widthMm: activeWidth || undefined,
                  lengthMm: activeLength || undefined,
                  nominalSize: activeNominalSize || undefined,
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
                  sqmPerTile: selectedVariant?.sqm_per_tile ? Number(selectedVariant.sqm_per_tile) : product.sqm_per_tile ? Number(product.sqm_per_tile) : undefined,
                  tilesPerBox: selectedVariant?.tiles_per_box ?? product.tiles_per_box ?? undefined,
                  sqmPerBox: selectedVariant?.sqm_per_box ? Number(selectedVariant.sqm_per_box) : product.sqm_per_box ? Number(product.sqm_per_box) : undefined,
                  kgPerBox: selectedVariant?.kg_per_box ? Number(selectedVariant.kg_per_box) : product.kg_per_box ? Number(product.kg_per_box) : undefined,
                  boxesPerPallet: selectedVariant?.boxes_per_pallet ?? product.boxes_per_pallet ?? undefined,
                  sqmPerPallet: selectedVariant?.sqm_per_pallet ? Number(selectedVariant.sqm_per_pallet) : product.sqm_per_pallet ? Number(product.sqm_per_pallet) : undefined,
                }} />
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </section>

      {hasPrice && (
        <section id="reservation" className="section-alt py-14 sm:py-24">
          <div className="section-container">
            <div className="max-w-2xl mx-auto">
              <p className="section-label">Reservation Process</p>
              <div className="mb-5">
                <h2 className="font-serif text-h2 sm:text-h2-lg font-light text-foreground mb-3">Request Reservation</h2>
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
      )}

      <section className="py-10 sm:py-18">
        <div className="section-container">
          <Collapsible>
            <CollapsibleTrigger className="w-full text-left group">
              <p className="section-label">Frequently Asked Questions</p>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-h2 sm:text-h2-lg font-light text-foreground">FAQ</h2>
                <span className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-muted-foreground group-data-[state=open]:hidden">Show <ChevronDown className="h-3 w-3" /></span>
                <span className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-muted-foreground hidden group-data-[state=open]:flex">Hide <ChevronUp className="h-3 w-3" /></span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-4"><FAQ showHeader={false} isEnquiryOnly={!isProductSale} /></div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </section>

      <div className="section-container"><div className="section-divider" /></div>
      <div className="py-5 sm:py-8 text-center">
        <p className="font-serif text-sm text-muted-foreground tracking-[0.05em]">
          Supplying premium porcelain to designers and contractors across the UK.
        </p>
      </div>
      <div className="section-container"><div className="section-divider" /></div>

      <footer className="py-8 sm:py-12 pb-20 sm:pb-12">
        <div className="section-container text-center">
          <img src={innerSpaceLogo} alt="Inner Space" className="h-10 w-auto mx-auto mb-4" />
          <p className="text-xs text-muted-foreground tracking-[0.05em]">
            © {new Date().getFullYear()} Inner Space. All rights reserved.
          </p>
        </div>
      </footer>

      <StickyMobileCTA productName={product?.name} isProductSale={isProductSale} pricePerSqm={pricePerSqm} />
    </div>
  );
};

export default ProductPage;
