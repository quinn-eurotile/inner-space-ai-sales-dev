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
    
    // Show payment step
    setShowPayment(true);
  };

  const handlePayment = async () => {
    setIsSubmitting(true);
    
    try {
      // Save sample order to database
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
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      postcode: '',
    });
    setErrors({});
    setIsSuccess(false);
    setShowPayment(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <div className="text-center py-8 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-bold mb-2">Sample Order Confirmed</h3>
            <p className="text-muted-foreground mb-4">
              Your 20×15cm sample will be dispatched within 24–48 hours.
            </p>
            <Button onClick={() => handleOpenChange(false)} className="w-full">
              Close
            </Button>
          </div>
        ) : showPayment ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Payment</DialogTitle>
              <DialogDescription>
                Complete your sample order
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="bg-secondary/50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Tile Sample (20×15cm)</p>
                    <p className="text-sm text-muted-foreground">Including P&P</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">£7.00</p>
                </div>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Payment integration coming soon.</p>
                <p className="mt-1">For now, click below to complete your request.</p>
              </div>
              
              <Button 
                onClick={handlePayment}
                className="w-full h-12 text-base"
                disabled={isSubmitting}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Processing...' : 'Pay £7.00'}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => setShowPayment(false)}
                className="w-full"
              >
                Back to details
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Order a Sample</DialogTitle>
              <DialogDescription>
                Get a 20×15cm sample tile for £7. Charged to cover postage and packaging.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sample-name">Full Name *</Label>
                <Input
                  id="sample-name"
                  type="text"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange('name')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sample-email">Email *</Label>
                  <Input
                    id="sample-email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange('email')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sample-phone">Phone *</Label>
                  <Input
                    id="sample-phone"
                    type="tel"
                    placeholder="07XXX XXXXXX"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sample-address">Delivery Address *</Label>
                <Textarea
                  id="sample-address"
                  placeholder="Full delivery address"
                  value={formData.address}
                  onChange={handleChange('address')}
                  className={`min-h-[80px] ${errors.address ? 'border-destructive' : ''}`}
                />
                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sample-postcode">Postcode *</Label>
                <Input
                  id="sample-postcode"
                  type="text"
                  placeholder="SW1A 1AA"
                  value={formData.postcode}
                  onChange={handleChange('postcode')}
                  className={errors.postcode ? 'border-destructive' : ''}
                />
                {errors.postcode && <p className="text-xs text-destructive">{errors.postcode}</p>}
              </div>
              
              <div className="bg-secondary/50 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm">Sample cost (incl. P&P)</span>
                <span className="font-bold text-primary">£7.00</span>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base"
              >
                Continue to Payment
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
