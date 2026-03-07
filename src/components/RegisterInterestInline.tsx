import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const step1Schema = z.object({
  email: z.string().trim().email('Please enter a valid email').max(255),
});

const step2Schema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  tel: z.string().trim().min(5, 'Please enter a valid phone number').max(20),
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
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type FormErrors = Partial<Record<string, string>>;

interface RegisterInterestInlineProps {
  buttonStyle?: React.CSSProperties;
  buttonClassName?: string;
  productName?: string;
  productCategory?: string;
  sqmPerPallet?: number;
}

export function RegisterInterestInline({ buttonStyle, buttonClassName, productName, productCategory, sqmPerPallet = 57.12 }: RegisterInterestInlineProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Data>({ email: '' });
  const [step2Data, setStep2Data] = useState<Step2Data>({
    name: '',
    tel: '',
    deliveryPostcode: '',
    estimatedQuantity: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleStep1Change = (field: keyof Step1Data) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setStep1Data(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleStep2Change = (field: keyof Step2Data) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const { error } = await supabase.functions.invoke('send-register-interest', {
        body: {
          formData: {
            email: step1Data.email,
            ...result.data,
            productName: productName || 'Not specified',
          },
        },
      });
      if (error) throw error;
      navigate('/thank-you');
    } catch (err) {
      console.error('Failed to send interest form', err);
      // Still redirect since the lead is saved to DB even if email fails
      navigate('/thank-you');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePalletQuickSelect = () => {
    setStep2Data(prev => ({ ...prev, estimatedQuantity: '57.12' }));
    if (errors.estimatedQuantity) setErrors(prev => ({ ...prev, estimatedQuantity: undefined }));
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
        {productCategory === 'wood' ? 'Check Stock Availability' : 'Enquire About This Tile'}
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
            <h3 className="font-serif text-lg font-light text-foreground mb-2">Thank you</h3>
            <p className="text-sm text-muted-foreground">
              We'll be in touch shortly.
            </p>
          </div>
        ) : step === 1 ? (
          <form onSubmit={handleStep1Submit} className="border border-border rounded-lg p-4 space-y-3" autoComplete="on">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter your email to check availability and receive allocation details.
            </p>
            <div className="space-y-1">
              <Label htmlFor="ri-email" className="text-[10px] tracking-wide uppercase text-muted-foreground">
                Email <span className="text-foreground">*</span>
              </Label>
              <Input
                id="ri-email"
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
              <span className="text-[10px] text-muted-foreground tracking-wide uppercase">Final step</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="ri-name" className="text-[10px] tracking-wide uppercase text-muted-foreground">
                  Name <span className="text-foreground">*</span>
                </Label>
                <Input
                  id="ri-name"
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
                <Label htmlFor="ri-tel" className="text-[10px] tracking-wide uppercase text-muted-foreground">
                  Tel <span className="text-foreground">*</span>
                </Label>
                <Input
                  id="ri-tel"
                  name="tel"
                  autoComplete="tel"
                  type="tel"
                  placeholder="+44 7700 900000"
                  value={step2Data.tel}
                  onChange={handleStep2Change('tel')}
                  className={`h-9 text-sm ${errors.tel ? 'border-destructive' : ''}`}
                />
                {errors.tel && <p className="text-[10px] text-destructive">{errors.tel}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="ri-postcode" className="text-[10px] tracking-wide uppercase text-muted-foreground">
                Delivery Postcode <span className="text-foreground">*</span>
              </Label>
              <Input
                id="ri-postcode"
                name="postal-code"
                autoComplete="postal-code"
                type="text"
                placeholder="SW1A 1AA"
                value={step2Data.deliveryPostcode}
                onChange={handleStep2Change('deliveryPostcode')}
                className={`h-9 text-sm ${errors.deliveryPostcode ? 'border-destructive' : ''}`}
              />
              {errors.deliveryPostcode && <p className="text-[10px] text-destructive">{errors.deliveryPostcode}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="ri-quantity" className="text-[10px] tracking-wide uppercase text-muted-foreground">
                Estimated Quantity (sq.m) <span className="text-foreground">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="ri-quantity"
                  name="quantity"
                  autoComplete="off"
                  type="text"
                  placeholder="e.g. 80"
                  value={step2Data.estimatedQuantity}
                  onChange={handleStep2Change('estimatedQuantity')}
                  className={`h-9 text-sm flex-1 ${errors.estimatedQuantity ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={handlePalletQuickSelect}
                  className={`h-9 px-3 text-[10px] tracking-wide uppercase border rounded whitespace-nowrap transition-colors ${
                    step2Data.estimatedQuantity === '57.12'
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  }`}
                >
                  1 Pallet
                </button>
              </div>
              {errors.estimatedQuantity && <p className="text-[10px] text-destructive">{errors.estimatedQuantity}</p>}
              <p className="text-[10px] text-muted-foreground">Most customers reserve 1 pallet (57.12 sq.m)</p>
            </div>

            <Button
              type="submit"
              className="w-full h-9 font-semibold text-sm bg-foreground text-background hover:bg-foreground/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending…' : 'Submit Enquiry'}
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
