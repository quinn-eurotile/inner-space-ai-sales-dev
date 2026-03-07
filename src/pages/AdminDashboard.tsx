import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  LogOut, 
  Package, 
  Users, 
  Image as ImageIcon, 
  Upload,
  Trash2,
  FileText,
  ShoppingBag,
  Settings,
  CalendarIcon,
  Plus,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import innerSpaceLogo from '@/assets/inner-space-logo-trans.png';
import { useSiteSettings } from '@/hooks/use-site-settings';

interface Product {
  id: string;
  name: string;
  slug: string | null;
  collection: string | null;
  origin: string | null;
  price_per_sqm: number | null;
  price_per_tile: number | null;
  stock_allocation: number | null;
  stock_sold: number | null;
  stock_reserved_manual: number | null;
  google_drive_link: string | null;
  data_sheet_url: string | null;
  is_active: boolean | null;
  nominal_size: string | null;
  finish: string | null;
  material: string | null;
  tile_colour: string | null;
  tile_style: string | null;
  slip_rating: string | null;
  factory_rating: string | null;
  matching_outdoor_option: boolean | null;
  underfloor_heating_compatible: boolean | null;
  frost_resistant: boolean | null;
  thickness_mm: number | null;
  width_mm: number | null;
  length_mm: number | null;
  sqm_per_tile: number | null;
  tiles_per_box: number | null;
  sqm_per_box: number | null;
  kg_per_box: number | null;
  boxes_per_pallet: number | null;
  sqm_per_pallet: number | null;
  edge: string | null;
  shape: string | null;
  suitability: string | null;
  no_tile_faces: string | null;
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

interface Reservation {
  id: string;
  product_id: string;
  name: string;
  email: string;
  phone: string;
  required_quantity_sqm: number;
  need_outdoor_tile: boolean | null;
  delivery_postcode: string;
  delivery_door_house: string | null;
  delivery_street: string | null;
  delivery_city: string | null;
  required_delivery_date: string | null;
  status: string;
  held_until: string;
  created_at: string;
  admin_notes: string | null;
}

interface SampleOrder {
  id: string;
  product_id: string | null;
  name: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
  status: string;
  created_at: string;
}

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  image_type: string;
  display_order: number | null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [sampleOrders, setSampleOrders] = useState<SampleOrder[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const { settings, updateSetting } = useSiteSettings();
  const [settingsSaving, setSettingsSaving] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  // Fetch variants when selected product changes
  useEffect(() => {
    if (selectedProduct) {
      fetchVariants(selectedProduct.id);
    }
  }, [selectedProduct?.id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin/login');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (roles?.role !== 'admin') {
      await supabase.auth.signOut();
      navigate('/admin/login');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    
    const [productsRes, reservationsRes, imagesRes, samplesRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('reservations').select('*').order('created_at', { ascending: false }),
      supabase.from('product_images').select('*').order('display_order'),
      supabase.from('sample_orders').select('*').order('created_at', { ascending: false }),
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (reservationsRes.data) setReservations(reservationsRes.data);
    if (imagesRes.data) setProductImages(imagesRes.data);
    if (samplesRes.data) setSampleOrders(samplesRes.data);
    
    if (productsRes.data && productsRes.data.length > 0) {
      setSelectedProduct(productsRes.data[0]);
    }
    
    setLoading(false);
  };

  const fetchVariants = async (productId: string) => {
    const { data } = await (supabase
      .from('product_variants')
      .select('*') as any)
      .eq('product_id', productId)
      .order('display_order');
    setProductVariants(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const updateProduct = async (updates: Partial<Product>) => {
    if (!selectedProduct) return;
    setSaving(true);
    
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', selectedProduct.id);

    if (!error) {
      setSelectedProduct({ ...selectedProduct, ...updates });
      setProducts(products.map(p => 
        p.id === selectedProduct.id ? { ...p, ...updates } : p
      ));
    }
    
    setSaving(false);
  };

  const updateReservationStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setReservations(reservations.map(r => 
        r.id === id ? { ...r, status } : r
      ));
    }
  };

  const updateSampleStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('sample_orders')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setSampleOrders(sampleOrders.map(s => 
        s.id === id ? { ...s, status } : s
      ));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'hero' | 'carousel') => {
    if (!e.target.files || !e.target.files[0] || !selectedProduct) return;
    
    setUploadingImage(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedProduct.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      setUploadingImage(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    const { data: imageData, error: insertError } = await supabase
      .from('product_images')
      .insert({
        product_id: selectedProduct.id,
        image_url: publicUrl,
        image_type: imageType,
        display_order: productImages.filter(i => i.product_id === selectedProduct.id).length,
      })
      .select()
      .single();

    if (!insertError && imageData) {
      setProductImages([...productImages, imageData]);
    }
    
    setUploadingImage(false);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedProduct) return;
    
    setUploadingPdf(true);
    const file = e.target.files[0];
    const fileName = `${selectedProduct.id}/data-sheet-${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { contentType: 'application/pdf' });

    if (uploadError) {
      console.error('PDF upload error:', uploadError);
      setUploadingPdf(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    await updateProduct({ data_sheet_url: publicUrl } as any);
    setUploadingPdf(false);
  };

  const deleteImage = async (imageId: string, imageUrl: string) => {
    const urlParts = imageUrl.split('/');
    const filePath = urlParts.slice(-2).join('/');
    
    await supabase.storage.from('product-images').remove([filePath]);
    
    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (!error) {
      setProductImages(productImages.filter(i => i.id !== imageId));
    }
  };

  const createProduct = async () => {
    const name = 'New Product';
    const slug = 'new-product-' + Date.now();
    const { data, error } = await (supabase
      .from('products')
      .insert({ name, slug } as any)
      .select()
      .single() as any);

    if (!error && data) {
      setProducts([data, ...products]);
      setSelectedProduct(data);
    }
  };

  // Variant CRUD
  const addVariant = async () => {
    if (!selectedProduct) return;
    const { data, error } = await (supabase
      .from('product_variants')
      .insert({
        product_id: selectedProduct.id,
        variant_label: 'New Size',
        display_order: productVariants.length,
      } as any)
      .select()
      .single() as any);

    if (!error && data) {
      setProductVariants([...productVariants, data]);
    }
  };

  const updateVariant = async (variantId: string, updates: Partial<ProductVariant>) => {
    const { error } = await (supabase
      .from('product_variants')
      .update(updates) as any)
      .eq('id', variantId);

    if (!error) {
      setProductVariants(productVariants.map(v =>
        v.id === variantId ? { ...v, ...updates } : v
      ));
    }
  };

  const deleteVariant = async (variantId: string) => {
    const { error } = await (supabase
      .from('product_variants')
      .delete() as any)
      .eq('id', variantId);

    if (!error) {
      setProductVariants(productVariants.filter(v => v.id !== variantId));
    }
  };

  const handleVariantPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, variantId: string) => {
    if (!e.target.files || !e.target.files[0] || !selectedProduct) return;
    const file = e.target.files[0];
    const fileName = `${selectedProduct.id}/variant-${variantId}-${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { contentType: 'application/pdf' });

    if (uploadError) return;

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    await updateVariant(variantId, { data_sheet_url: publicUrl });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'confirmed':
        return <Badge className="bg-success text-success-foreground">Confirmed</Badge>;
      case 'dispatched':
        return <Badge className="bg-primary text-primary-foreground">Dispatched</Badge>;
      case 'released':
        return <Badge variant="outline">Released</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={innerSpaceLogo} 
              alt="Inner Space" 
              className="h-14 w-auto"
            />
            <span className="text-muted-foreground">|</span>
            <span className="font-medium">Admin Dashboard</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="products">
          <TabsList className="mb-8">
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="reservations" className="gap-2">
              <Users className="h-4 w-4" />
              Reservations
            </TabsTrigger>
            <TabsTrigger value="samples" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Sample Orders
            </TabsTrigger>
            <TabsTrigger value="images" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Product List */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Products</h3>
                  <Button size="sm" onClick={createProduct}>+ New</Button>
                </div>
                <div className="space-y-2">
                  {products.map(product => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedProduct?.id === product.id 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'hover:bg-secondary'
                      }`}
                    >
                      <p className="font-medium">{product.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{(product as any).product_category || 'tiles'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{(product as any).page_type === 'enquiry_only' ? 'Enquiry' : 'Sale'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">/{product.slug || '—'}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Details */}
              {selectedProduct && (
                <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-6">
                  <h3 className="text-xl font-semibold">Edit Product</h3>
                  
                   {/* Page Type & Category */}
                   <div className="space-y-4">
                     <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Page Setup</h4>
                     <div className="grid sm:grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label>Page Type</Label>
                         <div className="flex gap-2">
                           {[{ value: 'product_sale', label: 'Product Sale' }, { value: 'enquiry_only', label: 'Enquiry Only' }].map(opt => (
                             <button
                               key={opt.value}
                               onClick={() => updateProduct({ page_type: opt.value } as any)}
                               className={cn(
                                 "px-4 py-2 text-sm border rounded transition-colors flex-1",
                                 (selectedProduct as any).page_type === opt.value
                                   ? "border-foreground bg-foreground text-background font-medium"
                                   : "border-border text-muted-foreground hover:border-foreground"
                               )}
                             >
                               {opt.label}
                             </button>
                           ))}
                         </div>
                          <p className="text-xs text-muted-foreground">Enquiry Only hides pricing, stock & reservations</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Product Category</Label>
                          <div className="flex gap-2">
                            {[{ value: 'tiles', label: 'Tiles' }, { value: 'wood', label: 'Wood' }, { value: 'lvt', label: 'LVT' }].map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => updateProduct({ product_category: opt.value } as any)}
                                className={cn(
                                  "px-4 py-2 text-sm border rounded transition-colors flex-1",
                                  (selectedProduct as any).product_category === opt.value
                                    ? "border-foreground bg-foreground text-background font-medium"
                                    : "border-border text-muted-foreground hover:border-foreground"
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-secondary/20">
                        <div>
                          <Label className="text-sm font-medium">Chargeable Samples</Label>
                          <p className="text-xs text-muted-foreground">When enabled, samples cost £7.00 via Stripe. When off, samples are free.</p>
                        </div>
                        <Switch
                          checked={(selectedProduct as any).samples_chargeable !== false}
                          onCheckedChange={(checked) => updateProduct({ samples_chargeable: checked } as any)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-secondary/20">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">Minimum Order Quantity</Label>
                          <p className="text-xs text-muted-foreground">Set a minimum sq.m order for reservations. Leave empty for no minimum.</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="None"
                            className="w-24 h-9 text-sm"
                            value={(selectedProduct as any).min_order_sqm ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseFloat(e.target.value);
                              updateProduct({ min_order_sqm: val } as any);
                            }}
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">sq.m</span>
                        </div>
                      </div>
                   </div>

                   {/* Basic Info */}
                   <div className="space-y-4 pt-4 border-t border-border">
                     <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Basic Info</h4>
                     <div className="grid sm:grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label>Product Name</Label>
                         <Input
                           value={selectedProduct.name}
                           onChange={(e) => updateProduct({ name: e.target.value })}
                         />
                       </div>
                       <div className="space-y-2">
                         <Label>Collection</Label>
                         <Input
                           value={selectedProduct.collection || ''}
                           onChange={(e) => updateProduct({ collection: e.target.value })}
                         />
                       </div>
                     </div>
                     <div className="space-y-2">
                       <Label>URL Slug</Label>
                       <div className="flex items-center gap-2">
                         <span className="text-sm text-muted-foreground whitespace-nowrap">/products/</span>
                         <Input
                           value={selectedProduct.slug || ''}
                           onChange={(e) => updateProduct({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') } as any)}
                           placeholder="e.g. marble-grey-120"
                         />
                       </div>
                       <p className="text-xs text-muted-foreground">This is the public URL for this product page</p>
                     </div>
                     <div className="grid sm:grid-cols-3 gap-4">
                       <div className="space-y-2">
                         <Label>Origin</Label>
                         <Input
                           value={selectedProduct.origin || ''}
                           onChange={(e) => updateProduct({ origin: e.target.value })}
                         />
                       </div>
                       <div className="space-y-2">
                         <Label>Material</Label>
                         <Input
                           value={selectedProduct.material || ''}
                           onChange={(e) => updateProduct({ material: e.target.value })}
                         />
                       </div>
                       <div className="space-y-2">
                         <Label>Factory Rating</Label>
                         <Input
                           value={selectedProduct.factory_rating || ''}
                           onChange={(e) => updateProduct({ factory_rating: e.target.value })}
                         />
                       </div>
                     </div>
                   </div>

                  {/* Pricing & Stock */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Pricing & Stock</h4>
                    <p className="text-xs text-muted-foreground">Leave price at 0 or empty for no-price products (sample & interest only). If this product has size variants, set pricing per variant below.</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price Per SQ.M (£)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={selectedProduct.price_per_sqm ?? ''}
                          onChange={(e) => updateProduct({ price_per_sqm: e.target.value ? parseFloat(e.target.value) : null } as any)}
                          placeholder="Leave empty for no price"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price Per Tile (£)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={selectedProduct.price_per_tile || ''}
                          onChange={(e) => updateProduct({ price_per_tile: parseFloat(e.target.value) || null } as any)}
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Stock Allocation (Pallets)</Label>
                        <Input
                          type="number"
                          value={selectedProduct.stock_allocation || 0}
                          onChange={(e) => updateProduct({ stock_allocation: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stock Sold (Pallets)</Label>
                        <Input
                          type="number"
                          value={selectedProduct.stock_sold || 0}
                          onChange={(e) => updateProduct({ stock_sold: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SIZE VARIANTS */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Size Variants</h4>
                      <Button size="sm" variant="outline" onClick={addVariant}>
                        <Plus className="h-3 w-3 mr-1" /> Add Variant
                      </Button>
                    </div>
                    {productVariants.length === 0 && (
                      <p className="text-sm text-muted-foreground">No variants — product uses a single size. Add variants if this product comes in multiple sizes.</p>
                    )}
                    {productVariants.map((variant) => (
                      <div key={variant.id} className="border border-border rounded-lg p-4 space-y-3 bg-secondary/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Input
                              value={variant.variant_label}
                              onChange={(e) => updateVariant(variant.id, { variant_label: e.target.value })}
                              className="w-40 font-medium"
                              placeholder="e.g. 90x90"
                            />
                            <Input
                              value={variant.nominal_size || ''}
                              onChange={(e) => updateVariant(variant.id, { nominal_size: e.target.value })}
                              className="w-32"
                              placeholder="Nominal size"
                            />
                          </div>
                          <Button size="sm" variant="destructive" onClick={() => deleteVariant(variant.id)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Width (mm)</Label>
                            <Input type="number" step="0.1" value={variant.width_mm || ''} onChange={(e) => updateVariant(variant.id, { width_mm: parseFloat(e.target.value) || null } as any)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Length (mm)</Label>
                            <Input type="number" step="0.1" value={variant.length_mm || ''} onChange={(e) => updateVariant(variant.id, { length_mm: parseFloat(e.target.value) || null } as any)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Thickness (mm)</Label>
                            <Input type="number" step="0.1" value={variant.thickness_mm || ''} onChange={(e) => updateVariant(variant.id, { thickness_mm: parseFloat(e.target.value) || null } as any)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Price/sq.m (£)</Label>
                            <Input type="number" step="0.01" value={variant.price_per_sqm ?? ''} onChange={(e) => updateVariant(variant.id, { price_per_sqm: e.target.value ? parseFloat(e.target.value) : null } as any)} placeholder="Optional" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">SQM/tile</Label>
                            <Input type="number" step="0.01" value={variant.sqm_per_tile || ''} onChange={(e) => updateVariant(variant.id, { sqm_per_tile: parseFloat(e.target.value) || null } as any)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Tiles/box</Label>
                            <Input type="number" value={variant.tiles_per_box || ''} onChange={(e) => updateVariant(variant.id, { tiles_per_box: parseInt(e.target.value) || null } as any)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">SQM/box</Label>
                            <Input type="number" step="0.01" value={variant.sqm_per_box || ''} onChange={(e) => updateVariant(variant.id, { sqm_per_box: parseFloat(e.target.value) || null } as any)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">KG/box</Label>
                            <Input type="number" step="0.01" value={variant.kg_per_box || ''} onChange={(e) => updateVariant(variant.id, { kg_per_box: parseFloat(e.target.value) || null } as any)} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Boxes/pallet</Label>
                            <Input type="number" value={variant.boxes_per_pallet || ''} onChange={(e) => updateVariant(variant.id, { boxes_per_pallet: parseInt(e.target.value) || null } as any)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">SQM/pallet</Label>
                            <Input type="number" step="0.01" value={variant.sqm_per_pallet || ''} onChange={(e) => updateVariant(variant.id, { sqm_per_pallet: parseFloat(e.target.value) || null } as any)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Stock alloc.</Label>
                            <Input type="number" value={variant.stock_allocation || ''} onChange={(e) => updateVariant(variant.id, { stock_allocation: parseInt(e.target.value) || null } as any)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Stock sold</Label>
                            <Input type="number" value={variant.stock_sold || ''} onChange={(e) => updateVariant(variant.id, { stock_sold: parseInt(e.target.value) || null } as any)} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Data Sheet PDF</Label>
                          <div className="flex items-center gap-2">
                            {variant.data_sheet_url ? (
                              <a href={variant.data_sheet_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline truncate max-w-[200px]">View PDF</a>
                            ) : <span className="text-xs text-muted-foreground">No PDF</span>}
                            <Input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => handleVariantPdfUpload(e, variant.id)}
                              className="text-xs h-8 w-auto"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tile Specifications */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Tile Specifications (Product-level defaults)</h4>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Nominal Size</Label>
                        <Input
                          value={selectedProduct.nominal_size || ''}
                          onChange={(e) => updateProduct({ nominal_size: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Colour</Label>
                        <Input
                          value={selectedProduct.tile_colour || ''}
                          onChange={(e) => updateProduct({ tile_colour: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Input
                          value={selectedProduct.tile_style || ''}
                          onChange={(e) => updateProduct({ tile_style: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Thickness (mm)</Label>
                        <Input
                          type="number"
                          value={selectedProduct.thickness_mm || ''}
                          onChange={(e) => updateProduct({ thickness_mm: parseFloat(e.target.value) || null } as any)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Width (mm)</Label>
                        <Input
                          type="number"
                          value={selectedProduct.width_mm || ''}
                          onChange={(e) => updateProduct({ width_mm: parseFloat(e.target.value) || null } as any)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Length (mm)</Label>
                        <Input
                          type="number"
                          value={selectedProduct.length_mm || ''}
                          onChange={(e) => updateProduct({ length_mm: parseFloat(e.target.value) || null } as any)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Shape</Label>
                        <Input
                          value={selectedProduct.shape || ''}
                          onChange={(e) => updateProduct({ shape: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Finish</Label>
                        <Input
                          value={selectedProduct.finish || ''}
                          onChange={(e) => updateProduct({ finish: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Edge</Label>
                        <Input
                          value={selectedProduct.edge || ''}
                          onChange={(e) => updateProduct({ edge: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Slip Rating</Label>
                        <Input
                          value={selectedProduct.slip_rating || ''}
                          onChange={(e) => updateProduct({ slip_rating: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Suitability</Label>
                        <Input
                          value={selectedProduct.suitability || ''}
                          onChange={(e) => updateProduct({ suitability: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>No. Tile Faces</Label>
                        <Input
                          value={selectedProduct.no_tile_faces || ''}
                          onChange={(e) => updateProduct({ no_tile_faces: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Wear Layer (mm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={(selectedProduct as any).wear_layer_mm || ''}
                          onChange={(e) => updateProduct({ wear_layer_mm: parseFloat(e.target.value) || null } as any)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Packing Info */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Packing Info (Product-level defaults)</h4>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>SQM per Tile</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={selectedProduct.sqm_per_tile || ''}
                          onChange={(e) => updateProduct({ sqm_per_tile: parseFloat(e.target.value) || null } as any)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tiles per Box</Label>
                        <Input
                          type="number"
                          value={selectedProduct.tiles_per_box || ''}
                          onChange={(e) => updateProduct({ tiles_per_box: parseInt(e.target.value) || null } as any)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SQM per Box</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={selectedProduct.sqm_per_box || ''}
                          onChange={(e) => updateProduct({ sqm_per_box: parseFloat(e.target.value) || null } as any)}
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>KG per Box</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={selectedProduct.kg_per_box || ''}
                          onChange={(e) => updateProduct({ kg_per_box: parseFloat(e.target.value) || null } as any)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Boxes per Pallet</Label>
                        <Input
                          type="number"
                          value={selectedProduct.boxes_per_pallet || ''}
                          onChange={(e) => updateProduct({ boxes_per_pallet: parseInt(e.target.value) || null } as any)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SQM per Pallet</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={selectedProduct.sqm_per_pallet || ''}
                          onChange={(e) => updateProduct({ sqm_per_pallet: parseFloat(e.target.value) || null } as any)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Options</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <Label>Active</Label>
                        <Switch
                          checked={selectedProduct.is_active || false}
                          onCheckedChange={(checked) => updateProduct({ is_active: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <Label>Matching Outdoor Option</Label>
                        <Switch
                          checked={selectedProduct.matching_outdoor_option || false}
                          onCheckedChange={(checked) => updateProduct({ matching_outdoor_option: checked } as any)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <Label>Underfloor Heating</Label>
                        <Switch
                          checked={selectedProduct.underfloor_heating_compatible || false}
                          onCheckedChange={(checked) => updateProduct({ underfloor_heating_compatible: checked } as any)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <Label>Frost Resistant</Label>
                        <Switch
                          checked={selectedProduct.frost_resistant || false}
                          onCheckedChange={(checked) => updateProduct({ frost_resistant: checked } as any)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Links & Downloads */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Links & Downloads</h4>
                    <div className="space-y-2">
                      <Label>Google Drive Link (High-Res Images)</Label>
                      <Input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={selectedProduct.google_drive_link || ''}
                        onChange={(e) => updateProduct({ google_drive_link: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tile Performance Data Sheet (PDF)</Label>
                      {selectedProduct.data_sheet_url ? (
                        <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                          <FileText className="h-5 w-5 text-primary shrink-0" />
                          <a 
                            href={selectedProduct.data_sheet_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary underline truncate flex-1"
                          >
                            View current PDF
                          </a>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => updateProduct({ data_sheet_url: null } as any)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : null}
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={handlePdfUpload}
                          className="hidden"
                          id="pdf-upload"
                          disabled={uploadingPdf}
                        />
                        <label htmlFor="pdf-upload" className="cursor-pointer">
                          <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {uploadingPdf ? 'Uploading...' : 'Click to upload PDF data sheet'}
                          </p>
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">Or enter a URL directly:</p>
                      <Input
                        type="url"
                        placeholder="https://example.com/data-sheet.pdf"
                        value={selectedProduct.data_sheet_url || ''}
                        onChange={(e) => updateProduct({ data_sheet_url: e.target.value } as any)}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      {saving ? 'Saving...' : 'Changes are saved automatically'}
                    </p>
                  </div>
                </div>
              )}
              <div className="lg:col-span-3 bg-card border border-border rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold">Landing Page Content</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Allocation Notice Banner</Label>
                    <Input
                      value={settings.allocation_notice}
                      onBlur={(e) => updateSetting('allocation_notice', e.target.value)}
                      onChange={(e) => {}}
                      defaultValue={settings.allocation_notice}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Order Label</Label>
                    <Input
                      defaultValue={settings.min_order_label}
                      onBlur={(e) => updateSetting('min_order_label', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Heading</Label>
                    <Input
                      defaultValue={settings.hero_heading}
                      onBlur={(e) => updateSetting('hero_heading', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Subheading</Label>
                    <Input
                      defaultValue={settings.hero_subheading}
                      onBlur={(e) => updateSetting('hero_subheading', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Product Description</Label>
                    <Textarea
                      defaultValue={settings.hero_description}
                      onBlur={(e) => updateSetting('hero_description', e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Changes save automatically when you leave each field.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations">
            {/* Product Selector */}
            <div className="flex items-center gap-3 mb-4">
              <Label className="text-sm font-medium shrink-0">Product:</Label>
              <div className="flex gap-2 flex-wrap">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={cn(
                      "px-3 py-1.5 text-sm border rounded-lg transition-colors",
                      selectedProduct?.id === p.id
                        ? "border-foreground bg-foreground text-background font-medium"
                        : "border-border text-muted-foreground hover:border-foreground"
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Qty (sq.m)</TableHead>
                    <TableHead>Outdoor</TableHead>
                    <TableHead>Delivery Address</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Held Until</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.filter(r => r.product_id === selectedProduct?.id).map(reservation => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">{reservation.name}</TableCell>
                      <TableCell className="text-xs">{reservation.email}</TableCell>
                      <TableCell className="text-xs">{reservation.phone}</TableCell>
                      <TableCell>{reservation.required_quantity_sqm}</TableCell>
                      <TableCell>{reservation.need_outdoor_tile ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">
                        {[reservation.delivery_door_house, reservation.delivery_street, reservation.delivery_city, reservation.delivery_postcode].filter(Boolean).join(', ')}
                      </TableCell>
                      <TableCell className="text-xs">
                        {reservation.required_delivery_date || '—'}
                      </TableCell>
                      <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(reservation.held_until), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">
                        {reservation.admin_notes || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {reservation.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                              >
                                Confirm
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {reservations.filter(r => r.product_id === selectedProduct?.id).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        No reservations for this product
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Sample Orders Tab */}
          <TabsContent value="samples">
            {/* Product Selector */}
            <div className="flex items-center gap-3 mb-4">
              <Label className="text-sm font-medium shrink-0">Product:</Label>
              <div className="flex gap-2 flex-wrap">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={cn(
                      "px-3 py-1.5 text-sm border rounded-lg transition-colors",
                      selectedProduct?.id === p.id
                        ? "border-foreground bg-foreground text-background font-medium"
                        : "border-border text-muted-foreground hover:border-foreground"
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Postcode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleOrders.filter(o => o.product_id === selectedProduct?.id).map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="text-xs">
                        {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-medium">{order.name}</TableCell>
                      <TableCell className="text-xs">{order.email}</TableCell>
                      <TableCell className="text-xs">{order.phone}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{order.address}</TableCell>
                      <TableCell>{order.postcode}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {order.status === 'confirmed' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateSampleStatus(order.id, 'dispatched')}
                            >
                              Mark Dispatched
                            </Button>
                          )}
                          {order.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => updateSampleStatus(order.id, 'confirmed')}
                              >
                                Confirm
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => updateSampleStatus(order.id, 'cancelled')}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sampleOrders.filter(o => o.product_id === selectedProduct?.id).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No sample orders for this product
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images">
            {/* Product Selector */}
            <div className="flex items-center gap-3 mb-4">
              <Label className="text-sm font-medium shrink-0">Product:</Label>
              <div className="flex gap-2 flex-wrap">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={cn(
                      "px-3 py-1.5 text-sm border rounded-lg transition-colors",
                      selectedProduct?.id === p.id
                        ? "border-foreground bg-foreground text-background font-medium"
                        : "border-border text-muted-foreground hover:border-foreground"
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            {selectedProduct && (
              <div className="space-y-8">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Upload Images for {selectedProduct.name}</h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hero Image</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'hero')}
                          className="hidden"
                          id="hero-upload"
                          disabled={uploadingImage}
                        />
                        <label htmlFor="hero-upload" className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {uploadingImage ? 'Uploading...' : 'Click to upload hero image'}
                          </p>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Carousel Image</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'carousel')}
                          className="hidden"
                          id="carousel-upload"
                          disabled={uploadingImage}
                        />
                        <label htmlFor="carousel-upload" className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {uploadingImage ? 'Uploading...' : 'Click to upload carousel image'}
                          </p>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Current Images</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {productImages
                      .filter(img => img.product_id === selectedProduct.id)
                      .map(image => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.image_url}
                            alt=""
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteImage(image.id, image.image_url)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <Badge className="absolute top-2 left-2" variant="secondary">
                            {image.image_type}
                          </Badge>
                        </div>
                      ))}
                    {productImages.filter(img => img.product_id === selectedProduct?.id).length === 0 && (
                      <p className="text-muted-foreground col-span-4 text-center py-8">
                        No images uploaded yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          {/* Settings Tab */}
          <TabsContent value="settings">
            {/* Product Selector */}
            <div className="flex items-center gap-3 mb-4">
              <Label className="text-sm font-medium shrink-0">Product:</Label>
              <div className="flex gap-2 flex-wrap">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={cn(
                      "px-3 py-1.5 text-sm border rounded-lg transition-colors",
                      selectedProduct?.id === p.id
                        ? "border-foreground bg-foreground text-background font-medium"
                        : "border-border text-muted-foreground hover:border-foreground"
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-w-2xl space-y-8">
              {/* Allocation Timer */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold">Allocation Timer</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Allocation Open</Label>
                      <p className="text-xs text-muted-foreground">Toggle the allocation on or off manually</p>
                    </div>
                    <Switch
                      checked={settings.allocation_open === 'true'}
                      onCheckedChange={async (checked) => {
                        setSettingsSaving('allocation_open');
                        await updateSetting('allocation_open', checked ? 'true' : 'false');
                        setSettingsSaving(null);
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Allocation End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !settings.allocation_end_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {settings.allocation_end_date
                            ? format(new Date(settings.allocation_end_date), 'PPP')
                            : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={new Date(settings.allocation_end_date)}
                          onSelect={async (date) => {
                            if (date) {
                              setSettingsSaving('allocation_end_date');
                              await updateSetting('allocation_end_date', date.toISOString());
                              setSettingsSaving(null);
                            }
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      The countdown timer on the landing page will count down to this date.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stock Allocation */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold">Stock Allocation</h3>
                {selectedProduct ? (() => {
                  const totalSqm = selectedProduct.stock_allocation || 0;
                  const soldSqm = selectedProduct.stock_sold || 0;
                  const manualReservedSqm = selectedProduct.stock_reserved_manual || 0;

                  const onlineReservedSqm = reservations
                    .filter(r => r.product_id === selectedProduct.id && (r.status === 'pending' || r.status === 'confirmed'))
                    .reduce((sum, r) => sum + (r.required_quantity_sqm || 0), 0);

                  const totalReservedSqm = onlineReservedSqm + manualReservedSqm;
                  const remainingSqm = totalSqm - totalReservedSqm - soldSqm;

                  return (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Total Allocation (sq.m)</Label>
                          <Input
                            type="number"
                            value={totalSqm}
                            onChange={(e) => updateProduct({ stock_allocation: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Manual Reserved (sq.m)</Label>
                          <Input
                            type="number"
                            value={manualReservedSqm}
                            onChange={(e) => updateProduct({ stock_reserved_manual: parseFloat(e.target.value) || 0 } as any)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Offline reservations
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Sold (sq.m)</Label>
                          <Input
                            type="number"
                            value={soldSqm}
                            onChange={(e) => updateProduct({ stock_sold: parseInt(e.target.value) || 0 })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Offline sales
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 p-4 bg-secondary/30 rounded-lg text-center">
                        <div>
                          <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Reserved</p>
                          <p className="text-lg font-medium tabular-nums">{Math.round(totalReservedSqm).toLocaleString()} sq.m</p>
                          <p className="text-[10px] text-muted-foreground">{Math.round(onlineReservedSqm)} online + {Math.round(manualReservedSqm)} manual</p>
                        </div>
                        <div>
                          <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Sold</p>
                          <p className="text-lg font-medium tabular-nums">{Math.round(soldSqm).toLocaleString()} sq.m</p>
                        </div>
                        <div>
                          <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">Remaining</p>
                          <p className={cn("text-lg font-medium tabular-nums", remainingSqm < 0 && "text-destructive")}>
                            {Math.round(remainingSqm).toLocaleString()} sq.m
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Online reserved is auto-calculated from pending &amp; confirmed reservations. Use manual fields for offline orders.
                      </p>
                    </div>
                  );
                })() : (
                  <p className="text-sm text-muted-foreground">No product selected.</p>
                )}
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
