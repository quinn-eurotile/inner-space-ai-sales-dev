import { useState } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

const interestSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  email: z.string().trim().email('Please enter a valid email').max(255),
  deliveryPostcode: z.string().trim().min(3, 'Please enter a valid postcode').max(10),
  estimatedQuantity: z
    .string()
    .trim()
    .min(1, 'Please enter an estimated quantity')
    .max(20)
    .refine(val => {
      const num = parseFloat(val.replace(/[^0-9.]/g, ''));
      return !isNaN(num) && num > 57;
    }, { message: 'Minimum quantity is over 57 sq.m' }),
  tel: z.string().trim().max(20).optional(),
});

type FormData = z.infer<typeof interestSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;

interface RegisterInterestDialogProps {
  children: React.ReactNode;
}

export function RegisterInterestDialog({ children }: RegisterInterestDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    deliveryPostcode: '',
    estimatedQuantity: '',
    tel: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = interestSchema.safeParse(formData);
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
      await supabase.functions.invoke('send-register-interest', {
        body: { formData: result.data },
      });
      setIsSuccess(true);
    } catch (err) {
      console.error('Failed to send interest form', err);
      // Still show success to the user — email may have sent
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      // Reset form on close
      setTimeout(() => {
        setFormData({ name: '', email: '', deliveryPostcode: '', estimatedQuantity: '', tel: '' });
        setErrors({});
        setIsSuccess(false);
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif font-light text-xl">Register Interest</DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="text-center py-8 animate-fade-in">
            <Check className="h-5 w-5 text-foreground mx-auto mb-4" />
            <h3 className="font-serif text-lg font-light text-foreground mb-2">Thank you</h3>
            <p className="text-sm text-muted-foreground mb-6">
              We've received your interest and will be in touch shortly.
            </p>
            <Button
              variant="outline"
              className="text-sm"
              onClick={() => {
                setFormData({ name: '', email: '', deliveryPostcode: '', estimatedQuantity: '', tel: '' });
                setErrors({});
                setIsSuccess(false);
              }}
            >
              Register Another Interest
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-1" autoComplete="on">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="ri-name" className="text-xs tracking-wide uppercase text-muted-foreground">
                Name <span className="text-foreground">*</span>
              </Label>
              <Input
                id="ri-name"
                name="name"
                autoComplete="name"
                type="text"
                placeholder="Your full name"
                value={formData.name}
                onChange={handleChange('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            {/* Tel (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="ri-tel" className="text-xs tracking-wide uppercase text-muted-foreground">
                Tel <span className="text-muted-foreground text-[10px] normal-case tracking-normal">(optional)</span>
              </Label>
              <Input
                id="ri-tel"
                name="tel"
                autoComplete="tel"
                type="tel"
                placeholder="+44 7700 900000"
                value={formData.tel}
                onChange={handleChange('tel')}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="ri-email" className="text-xs tracking-wide uppercase text-muted-foreground">
                Email <span className="text-foreground">*</span>
              </Label>
              <Input
                id="ri-email"
                name="email"
                autoComplete="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            {/* Delivery Postcode */}
            <div className="space-y-1.5">
              <Label htmlFor="ri-postcode" className="text-xs tracking-wide uppercase text-muted-foreground">
                Delivery Postcode <span className="text-foreground">*</span>
              </Label>
              <Input
                id="ri-postcode"
                name="postal-code"
                autoComplete="postal-code"
                type="text"
                placeholder="SW1A 1AA"
                value={formData.deliveryPostcode}
                onChange={handleChange('deliveryPostcode')}
                className={errors.deliveryPostcode ? 'border-destructive' : ''}
              />
              {errors.deliveryPostcode && <p className="text-xs text-destructive">{errors.deliveryPostcode}</p>}
            </div>

            {/* Estimated Quantity */}
            <div className="space-y-1.5">
              <Label htmlFor="ri-quantity" className="text-xs tracking-wide uppercase text-muted-foreground">
                Estimated Quantity <span className="text-foreground">*</span>
              </Label>
              <Input
                id="ri-quantity"
                name="quantity"
                autoComplete="off"
                type="text"
                placeholder="e.g. 50 sq.m"
                value={formData.estimatedQuantity}
                onChange={handleChange('estimatedQuantity')}
                className={errors.estimatedQuantity ? 'border-destructive' : ''}
              />
              {errors.estimatedQuantity && <p className="text-xs text-destructive">{errors.estimatedQuantity}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-2 font-semibold"
              style={{ backgroundColor: '#f0aa47', color: '#ffffff', border: 'none' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending…' : 'Register Interest'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
