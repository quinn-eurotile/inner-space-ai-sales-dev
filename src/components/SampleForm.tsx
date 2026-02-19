import { useState } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, Package } from 'lucide-react';
import { pinterestTrack } from '@/lib/pinterest';

const sampleSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  email: z.string().trim().email('Please enter a valid email').max(255),
  phone: z.string().trim().min(10, 'Please enter a valid phone number').max(20),
  address: z.string().trim().min(10, 'Please enter your full address').max(300),
  postcode: z.string().trim().min(5, 'Please enter a valid postcode').max(10),
});

type FormData = z.infer<typeof sampleSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;

interface SampleFormProps {
  onSuccess?: () => void;
}

export function SampleForm({ onSuccess }: SampleFormProps) {
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
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      pinterestTrack('checkout', {
        value: 7,
        order_quantity: 1,
        currency: 'GBP',
      });
      setIsSubmitting(false);
      setIsSuccess(true);
      onSuccess?.();
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
          <Package className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-xl font-serif font-semibold mb-2">Sample Request Received</h3>
        <p className="text-muted-foreground">
          Your sample will be dispatched within 24–48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sample-name">Full Name</Label>
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
          <Label htmlFor="sample-email">Email</Label>
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
          <Label htmlFor="sample-phone">Phone</Label>
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
        <Label htmlFor="sample-address">Delivery Address</Label>
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
        <Label htmlFor="sample-postcode">Postcode</Label>
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
      
      <div className="pt-2">
        <Button 
          type="submit" 
          variant="secondary"
          className="w-full h-12 text-base"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Order Sample'}
        </Button>
      </div>
      
      <p className="text-xs text-center text-muted-foreground">
        Samples dispatched within 24–48 hours
      </p>
    </form>
  );
}
