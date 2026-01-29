import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { 
  LogOut, 
  Package, 
  Users, 
  Image as ImageIcon, 
  Settings,
  Upload,
  Trash2,
  Save
} from 'lucide-react';
import { format } from 'date-fns';
import innerSpaceLogo from '@/assets/inner-space-logo.png';

interface Product {
  id: string;
  name: string;
  collection: string | null;
  price_per_sqm: number;
  stock_allocation: number | null;
  stock_sold: number | null;
  google_drive_link: string | null;
  is_active: boolean | null;
}

interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  required_quantity_sqm: number;
  need_outdoor_tile: boolean | null;
  delivery_postcode: string;
  status: string;
  held_until: string;
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
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

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
    
    const [productsRes, reservationsRes, imagesRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('reservations').select('*').order('created_at', { ascending: false }),
      supabase.from('product_images').select('*').order('display_order'),
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (reservationsRes.data) setReservations(reservationsRes.data);
    if (imagesRes.data) setProductImages(imagesRes.data);
    
    if (productsRes.data && productsRes.data.length > 0) {
      setSelectedProduct(productsRes.data[0]);
    }
    
    setLoading(false);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'hero' | 'carousel') => {
    if (!e.target.files || !e.target.files[0] || !selectedProduct) return;
    
    setUploadingImage(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedProduct.id}/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
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

  const deleteImage = async (imageId: string, imageUrl: string) => {
    // Extract file path from URL
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'confirmed':
        return <Badge className="bg-success text-success-foreground">Confirmed</Badge>;
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
              className="h-8 w-auto"
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
            <TabsTrigger value="images" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Images
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Product List */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Products</h3>
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
                      <p className="text-sm text-muted-foreground">{product.collection}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Details */}
              {selectedProduct && (
                <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-6">Edit Product</h3>
                  
                  <div className="grid gap-6">
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

                    <div className="space-y-2">
                      <Label>Price Per SQ.M (£)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={selectedProduct.price_per_sqm}
                        onChange={(e) => updateProduct({ price_per_sqm: parseFloat(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Google Drive Link (High-Res Images)</Label>
                      <Input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={selectedProduct.google_drive_link || ''}
                        onChange={(e) => updateProduct({ google_drive_link: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Active</Label>
                        <p className="text-sm text-muted-foreground">Show this product on the main page</p>
                      </div>
                      <Switch
                        checked={selectedProduct.is_active || false}
                        onCheckedChange={(checked) => updateProduct({ is_active: checked })}
                      />
                    </div>

                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        {saving ? 'Saving...' : 'Changes are saved automatically'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Quantity (SQ.M)</TableHead>
                    <TableHead>Outdoor</TableHead>
                    <TableHead>Postcode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Held Until</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map(reservation => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">{reservation.name}</TableCell>
                      <TableCell>{reservation.email}</TableCell>
                      <TableCell>{reservation.required_quantity_sqm}</TableCell>
                      <TableCell>{reservation.need_outdoor_tile ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{reservation.delivery_postcode}</TableCell>
                      <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                      <TableCell>
                        {format(new Date(reservation.held_until), 'dd/MM/yyyy HH:mm')}
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
                  {reservations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No reservations yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images">
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
        </Tabs>
      </main>
    </div>
  );
}
