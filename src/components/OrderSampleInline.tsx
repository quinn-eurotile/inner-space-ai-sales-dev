import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const step1Schema = z.object({
  email: z.string().trim().email('Please enter a valid email').max(255),
});

const step2Schema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  phone: z.string().trim().min(10, 'Please enter a valid phone number').max(20),
  address: z.string().trim().min(10, 'Please enter your full address').max(300),
  postcode: z.string().trim().min(5, 'Please enter a valid postcode').max(10),
  estimatedQuantity: z.string().trim().max(20).optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type FormErrors = Partial<Record<string, string>>;

interface OrderSampleInlineProps {
  buttonStyle?: React.CSSProperties;
  buttonClassName?: string;
  productId?: string;
  productName?: string;
  onOrderComplete?: () => void;
}

export function OrderSampleInline({ buttonStyle, buttonClassName, productId, productName, onOrderComplete }: OrderSampleInlineProps) {
  const [expanded, setExpanded] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Data>({ email: '' });
  const [step2Data, setStep2Data] = useState<Step2Data>({
    name: '',
    phone: '',
    address: '',
    postcode: '',
    estimatedQuantity: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleStep1Change = (field: keyof Step1Data) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setStep1Data(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleStep2Change = (field: keyof Step2Data) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setStep2Data(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = step1Schema.safeParse(step1Data);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach(err => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = step2Schema.safeParse(step2Data);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach(err => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the free sample order
      const { data: order, error: insertError } = await supabase
        .from('sample_orders')
        .insert({
          name: result.data.name,
          email: step1Data.email.trim().toLowerCase(),
          phone: result.data.phone,
          address: result.data.address,
          postcode: result.data.postcode,
          product_id: productId || null,
          status: 'confirmed',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Also save interest/quantity data if provided
      if (result.data.estimatedQuantity) {
        await supabase.from('interest_submissions').insert({
          email: step1Data.email.trim().toLowerCase(),
          name: result.data.name,
          tel: result.data.phone,
          delivery_postcode: result.data.postcode,
          estimated_quantity: result.data.estimatedQuantity,
          product_name: productName || null,
        });
      }

      // 3. Send confirmation email
      if (order) {
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
      }

      // Fire Meta Pixel Lead event
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', { content_name: productName || 'Sample Order' });
      }

      setIsSuccess(true);
      onOrderComplete?.();
    } catch (error) {
      console.error('Sample order error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <Button
        size="lg"
        className={buttonClassName}
        style={buttonStyle}
        onClick={() => setExpanded(prev => !prev)}
        onMouseEnter={e => buttonStyle?.backgroundColor && (e.currentTarget.style.backgroundColor = '#d4913a')}
        onMouseLeave={e => buttonStyle?.backgroundColor && (e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor as string)}
      >
        Order Your Free Sample
        {expanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
      </Button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
      >
        {isSuccess ? (
          <div className="text-center py-6 animate-fade-in border border-border rounded-lg p-6">
            <Check className="h-5 w-5 text-foreground mx-auto mb-3" />
            <h3 className="font-serif text-lg font-light text-foreground mb-2">Sample on its way</h3>
            <p className="text-sm text-muted-foreground">
              Your sample will be dispatched within 24–48 hours. We'll be in touch with your allocation details.
            </p>
          </div>
        ) : step === 1 ? (
          <form onSubmit={handleStep1Submit} className="border border-border rounded-lg p-4 space-y-3" autoComplete="on">
            <p className="text-xs text-muted-foreground leading-relaxed">
              We'll send you a free sample tile so you can see the quality first-hand.
            </p>
            <div className="space-y-1">
              <Label htmlFor="os-email" className="text-[10px] tracking-wide uppercase text-muted-foreground">
                Email <span className="text-foreground">*</span>
              </Label>
              <Input
                id="os-email"
                name="email"
                autoComplete="email"
                type="email"
                placeholder="you@example.com"
                value={step1Data.email}
                onChange={handleStep1Change('email')}
                className={`h-10 text-sm ${errors.email ? 'border-destructive' : ''}`}
              />
              {errors.email && <p className="text-[10px] text-destructive">{errors.email}</p>}
            </div>
            <Button
              type="submit"
              className="w-full h-10 font-semibold text-sm bg-foreground text-background hover:bg-foreground/90"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        ) : (
          <form onSubmit={handleStep2Submit} className="border border-border rounded-lg p-4 space-y-2.5 animate-fade-in" autoComplete="on">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-6 rounded-full bg-foreground" />
                <div className="h-1.5 w-6 rounded-full bg-foreground" />
              </div>
              <span className="text-[10px] text-muted-foreground tracking-wide uppercase">Where should we send it?</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="os-name" className="text-[10px] tracking-wide uppercase text-muted-foreground">
                  Name <span className="text-foreground">*</span>
                </Label>
                <Input
                  id="os-name"
                  name="name"
                  autoComplete="name"
                  type="text"
                  placeholder="Full name"
                  value={step2Data.name}
                  onChange={handleStep2Change('name')}
                  className={`h-9 text-sm ${errors.name ? 'border-destructive' : ''}`}
                />
                {errors.name && <p className="text-[10px] text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="os-phone" className="text-[10px] tracking-wide uppercase text-muted-foreground">
                  Phone <span className="text-foreground">*</span>
                </Label>
                <Input
                  id="os-phone"
                  name="tel"
                  autoComplete="tel"
                  type="tel"
                  placeholder="+44 7700 900000"
                  value={step2Data.phone}
                  onChange={handleStep2Change('phone')}
                  className={`h-9 text-sm ${errors.phone ? 'border-destructive' : ''}`}
                />
                {errors.phone && <p className="text-[10px] text-destructive">{errors.phone}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="os-address" className="text-[10px] tracking-wide uppercase text-muted-foreground">
                Delivery Address <span className="text-foreground">*</span>
              </Label>
              <Textarea
                id="os-address"
                name="address"
                autoComplete="street-address"
                placeholder="Full delivery address"
                value={step2Data.address}
                onChange={handleStep2Change('address')}
                className={`min-h-[60px] text-sm ${errors.address ? 'border-destructive' : ''}`}
              />
              {errors.address && <p className="text-[10px] text-destructive">{errors.address}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="os-postcode" className="text-[10px] tracking-wide uppercase text-muted-foreground">
                Postcode <span className="text-foreground">*</span>
              </Label>
              <Input
                id="os-postcode"
                name="postal-code"
                autoComplete="postal-code"
                type="text"
                placeholder="SW1A 1AA"
                value={step2Data.postcode}
                onChange={handleStep2Change('postcode')}
                className={`h-9 text-sm ${errors.postcode ? 'border-destructive' : ''}`}
              />
              {errors.postcode && <p className="text-[10px] text-destructive">{errors.postcode}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="os-quantity" className="text-[10px] tracking-wide uppercase text-muted-foreground">
                How much are you looking for? (sq.m) <span className="text-muted-foreground/60">Optional</span>
              </Label>
              <Input
                id="os-quantity"
                name="quantity"
                autoComplete="off"
                type="text"
                placeholder="e.g. 60"
                value={step2Data.estimatedQuantity}
                onChange={handleStep2Change('estimatedQuantity')}
                className="h-9 text-sm"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-9 font-semibold text-sm bg-foreground text-background hover:bg-foreground/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending…' : 'Send My Free Sample'}
            </Button>

            <button
              type="button"
              onClick={() => { setStep(1); setErrors({}); }}
              className="w-full text-[10px] text-muted-foreground hover:text-foreground transition-colors tracking-wide uppercase"
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
