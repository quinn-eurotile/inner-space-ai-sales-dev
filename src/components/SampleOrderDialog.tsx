import { useState } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, Package, CreditCard } from 'lucide-react';
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
}

export function SampleOrderDialog({ children, productId }: SampleOrderDialogProps) {
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
  const [showPayment, setShowPayment] = useState(false);

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    setShowPayment(true);
  };

  const handlePayment = async () => {
    setIsSubmitting(true);
    try {
      await supabase.from('sample_orders').insert([{
        product_id: productId || null,
        name: formData.name,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone,
        address: formData.address,
        postcode: formData.postcode,
        status: 'confirmed',
      }]);
      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (error) {
      console.error('Sample order error:', error);
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', address: '', postcode: '' });
    setErrors({});
    setIsSuccess(false);
    setShowPayment(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <div className="text-center py-10 animate-fade-in">
            <Check className="h-5 w-5 text-foreground mx-auto mb-4" />
            <h3 className="font-serif text-xl font-light mb-2">Sample Order Confirmed</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Your 20×15cm sample will be dispatched within 24–48 hours.
            </p>
            <Button variant="outline" onClick={() => handleOpenChange(false)} className="w-full">
              Close
            </Button>
          </div>
        ) : showPayment ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl font-light">Payment</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Complete your sample order
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="py-4 border-y border-border">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-foreground">Tile Sample (20×15cm)</p>
                    <p className="text-xs text-muted-foreground">Including P&P</p>
                  </div>
                  <p className="font-serif text-xl font-light text-foreground">£7.00</p>
                </div>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Payment integration coming soon.</p>
                <p className="mt-1">Click below to complete your request.</p>
              </div>
              
              <Button 
                onClick={handlePayment}
                className="w-full h-11"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing…' : 'Pay £7.00'}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => setShowPayment(false)}
                className="w-full text-sm"
              >
                Back to details
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl font-light">Order a Sample</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                20×15cm sample tile — £7 to cover postage and packaging.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="sample-name" className="text-xs tracking-wide uppercase text-muted-foreground">Full Name</Label>
                <Input
                  id="sample-name"
                  type="text"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange('name')}
                  className={`h-11 ${errors.name ? 'border-muted-foreground' : ''}`}
                />
                {errors.name && <p className="text-xs text-muted-foreground">{errors.name}</p>}
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
                    className={`h-11 ${errors.email ? 'border-muted-foreground' : ''}`}
                  />
                  {errors.email && <p className="text-xs text-muted-foreground">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sample-phone" className="text-xs tracking-wide uppercase text-muted-foreground">Phone</Label>
                  <Input
                    id="sample-phone"
                    type="tel"
                    placeholder="07XXX XXXXXX"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    className={`h-11 ${errors.phone ? 'border-muted-foreground' : ''}`}
                  />
                  {errors.phone && <p className="text-xs text-muted-foreground">{errors.phone}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sample-address" className="text-xs tracking-wide uppercase text-muted-foreground">Delivery Address</Label>
                <Textarea
                  id="sample-address"
                  placeholder="Full delivery address"
                  value={formData.address}
                  onChange={handleChange('address')}
                  className={`min-h-[80px] ${errors.address ? 'border-muted-foreground' : ''}`}
                />
                {errors.address && <p className="text-xs text-muted-foreground">{errors.address}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sample-postcode" className="text-xs tracking-wide uppercase text-muted-foreground">Postcode</Label>
                <Input
                  id="sample-postcode"
                  type="text"
                  placeholder="SW1A 1AA"
                  value={formData.postcode}
                  onChange={handleChange('postcode')}
                  className={`h-11 ${errors.postcode ? 'border-muted-foreground' : ''}`}
                />
                {errors.postcode && <p className="text-xs text-muted-foreground">{errors.postcode}</p>}
              </div>
              
              <div className="py-3 border-y border-border flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sample cost (incl. P&P)</span>
                <span className="text-sm text-foreground">£7.00</span>
              </div>
              
              <Button type="submit" className="w-full h-11">
                Continue to Payment
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
