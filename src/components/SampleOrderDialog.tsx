import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const sampleSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  email: z.string().trim().email('Please enter a valid email').max(255),
  phone: z.string().trim().min(10, 'Please enter a valid phone number').max(20),
  address: z.string().trim().min(10, 'Please enter your full address').max(300),
  postcode: z.string().trim().min(5, 'Please enter a valid postcode').max(10),
});

type FormData = z.infer<typeof sampleSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;

interface SampleOrderDialogProps {
  children: React.ReactNode;
  productId?: string;
  onOrderComplete?: () => void;
  samplesChargeable?: boolean;
}

export function SampleOrderDialog({ children, productId, onOrderComplete, samplesChargeable = true }: SampleOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    postcode: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Check URL params for successful payment return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sampleSuccess = params.get('sample_success');
    if (sampleSuccess) {
      // Fire Meta Pixel Purchase event on confirmed Stripe payment
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Purchase', { value: 7.00, currency: 'GBP' });
        console.log('[Meta Pixel] Purchase event fired', { value: 7.00, currency: 'GBP' });
      } else {
        console.warn('[Meta Pixel] fbq not available - Purchase event NOT fired');
      }
      // Update order status to confirmed, then send confirmation emails
      supabase.from('sample_orders').update({ status: 'confirmed' }).eq('id', sampleSuccess).select().single().then(async ({ data: order, error: updateError }) => {
        if (updateError) {
          console.error('[Sample Order] Failed to update status:', updateError);
        }
        if (order) {
          console.log('[Sample Order] Status updated to confirmed, sending emails...');
          await supabase.functions.invoke('send-sample-confirmation', {
            body: {
              sampleOrder: {
                id: order.id,
                name: order.name,
                email: order.email,
                phone: order.phone,
                address: order.address,
                postcode: order.postcode,
                product_id: order.product_id,
              },
            },
          });
        } else {
          console.error('[Sample Order] No order data returned after update - RLS may be blocking');
        }
        onOrderComplete?.();
      });
      setIsSuccess(true);
      setOpen(true);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    const sampleCancelled = params.get('sample_cancelled');
    if (sampleCancelled) {
      // Delete the pending order
      supabase.from('sample_orders').delete().eq('id', sampleCancelled).eq('status', 'pending');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [onOrderComplete]);

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = sampleSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof FormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-sample-checkout', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          postcode: formData.postcode,
          productId: productId || null,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', address: '', postcode: '' });
    setErrors({});
    setIsSuccess(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isSuccess) {
      onOrderComplete?.();
    }
    setOpen(newOpen);
    if (!newOpen) resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <div className="text-center py-6 animate-fade-in">
            <Check className="h-5 w-5 text-foreground mx-auto mb-3" />
            <h3 className="font-serif text-xl font-light mb-1">Sample Order Confirmed</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your 20×15cm sample will be dispatched within 24–48 hours.
            </p>
            <Button variant="outline" onClick={() => handleOpenChange(false)} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl font-light">Order a Sample</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                You will receive a 20x15cm sample tile. The £7.00 fee covers handling, packaging and delivery. Please use the same email address for both sample requests and reservation submissions.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-3 py-2" data-fb-nototrack="true">
              <div className="space-y-2">
                <Label htmlFor="sample-name" className="text-xs tracking-wide uppercase text-muted-foreground">Full Name</Label>
                <Input
                  id="sample-name"
                  type="text"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange('name')}
                  className={`h-11 ${errors.name ? 'border-destructive ring-1 ring-destructive' : ''}`}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sample-email" className="text-xs tracking-wide uppercase text-muted-foreground">Email</Label>
                  <Input
                    id="sample-email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange('email')}
                    className={`h-11 ${errors.email ? 'border-destructive ring-1 ring-destructive' : ''}`}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sample-phone" className="text-xs tracking-wide uppercase text-muted-foreground">Phone</Label>
                  <Input
                    id="sample-phone"
                    type="tel"
                    placeholder="07XXX XXXXXX"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    className={`h-11 ${errors.phone ? 'border-destructive ring-1 ring-destructive' : ''}`}
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sample-address" className="text-xs tracking-wide uppercase text-muted-foreground">Delivery Address</Label>
                <Textarea
                  id="sample-address"
                  placeholder="Full delivery address"
                  value={formData.address}
                  onChange={handleChange('address')}
                  className={`min-h-[80px] ${errors.address ? 'border-destructive ring-1 ring-destructive' : ''}`}
                />
                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sample-postcode" className="text-xs tracking-wide uppercase text-muted-foreground">Postcode</Label>
                <Input
                  id="sample-postcode"
                  type="text"
                  placeholder="SW1A 1AA"
                  value={formData.postcode}
                  onChange={handleChange('postcode')}
                  className={`h-11 ${errors.postcode ? 'border-destructive ring-1 ring-destructive' : ''}`}
                />
                {errors.postcode && <p className="text-xs text-destructive">{errors.postcode}</p>}
              </div>
              
              <div className="py-3 border-y border-border flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sample cost (incl. P&P)</span>
                <span className="text-sm text-foreground">£7.00</span>
              </div>
              
              <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                {isSubmitting ? 'Redirecting to payment…' : 'Continue to Payment'}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
