import { useState } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Clock, AlertCircle, CalendarIcon, Info, CircleAlert } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { PostcodeChecker } from '@/components/PostcodeChecker';
import { SampleOrderDialog } from '@/components/SampleOrderDialog';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

const MIN_ORDER_SQM = 57;
const MAX_RESERVATION_SQM = 200;

const reservationSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  email: z.string().trim().email('Please enter a valid email').max(255),
  phone: z.string().trim().min(10, 'Please enter a valid phone number').max(20),
  requiredQuantitySqm: z.number().min(MIN_ORDER_SQM, `Minimum order is ${MIN_ORDER_SQM} SQ.M`),
  needOutdoorTile: z.enum(['yes', 'no'], { required_error: 'Please select whether you need a matching outdoor tile' }),
  deliveryDoorHouse: z.string().trim().min(1, 'Door/House number is required').max(100),
  deliveryStreet: z.string().trim().min(1, 'Street name is required').max(200),
  deliveryCity: z.string().trim().min(1, 'City is required').max(100),
  deliveryPostcode: z.string().trim().min(5, 'Please enter a valid postcode').max(10),
  requiredDeliveryDate: z.date({ required_error: 'Please select a delivery date' }),
});

type FormData = z.infer<typeof reservationSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;

interface ReservationRequestFormProps {
  productId: string;
  onSuccess?: () => void;
}

export function ReservationRequestForm({ productId, onSuccess }: ReservationRequestFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    requiredQuantitySqm: 0,
    needOutdoorTile: undefined as any,
    deliveryDoorHouse: '',
    deliveryStreet: '',
    deliveryCity: '',
    deliveryPostcode: '',
    requiredDeliveryDate: undefined,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [heldUntil, setHeldUntil] = useState<Date | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [exceededMax, setExceededMax] = useState(false);
  const [requestedQuantity, setRequestedQuantity] = useState(0);
  const [deliveryResult, setDeliveryResult] = useState<{
    zone: { tier_code: string; tier_label: string; surcharge_type: string; surcharge_per_sqm: number; luxury_message: string };
  } | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [sampleVerified, setSampleVerified] = useState<boolean | null>(null);
  const [isVerifyingSample, setIsVerifyingSample] = useState(false);

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = field === 'requiredQuantitySqm' 
      ? parseFloat(e.target.value) || 0 
      : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    setSubmitError(null);
  };

  const handleOutdoorChange = (value: string) => {
    setFormData(prev => ({ ...prev, needOutdoorTile: value as 'yes' | 'no' }));
    if (errors.needOutdoorTile) {
      setErrors(prev => ({ ...prev, needOutdoorTile: undefined }));
    }
  };

  const handleShowTerms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    const result = reservationSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof FormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    // Check sample eligibility upfront
    setIsVerifyingSample(true);
    setSampleVerified(null);
    try {
      const { data: sampleOrders, error: sampleError } = await supabase
        .from('sample_orders')
        .select('id')
        .eq('email', formData.email.trim().toLowerCase())
        .eq('status', 'confirmed')
        .limit(1);

      if (sampleError) throw sampleError;
      setSampleVerified(sampleOrders && sampleOrders.length > 0);
    } catch {
      setSampleVerified(false);
    }
    setIsVerifyingSample(false);
    
    setShowTerms(true);
    setTermsAccepted(false);
  };

  const handleSubmit = async () => {
    if (sampleVerified !== true) return;
    
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const { data: existingReservations } = await supabase
        .from('reservations')
        .select('required_quantity_sqm')
        .eq('email', formData.email.trim().toLowerCase())
        .in('status', ['pending', 'confirmed']);

      const existingTotal = existingReservations?.reduce((sum, r) => sum + Number(r.required_quantity_sqm), 0) || 0;
      const remainingAllowance = MAX_RESERVATION_SQM - existingTotal;

      if (remainingAllowance <= 0) {
        setSubmitError(`You have already reserved the maximum of ${MAX_RESERVATION_SQM} SQ.M with this email address.`);
        setIsSubmitting(false);
        return;
      }

      const originalQuantity = formData.requiredQuantitySqm;
      const reservedQuantity = Math.min(formData.requiredQuantitySqm, remainingAllowance);
      const didExceed = originalQuantity > remainingAllowance;

      const heldUntilDate = addDays(new Date(), 7);
      
      const { error } = await supabase.from('reservations').insert([{
        product_id: productId,
        name: formData.name,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone,
        required_quantity_sqm: reservedQuantity,
        need_outdoor_tile: formData.needOutdoorTile === 'yes',
        delivery_door_house: formData.deliveryDoorHouse,
        delivery_street: formData.deliveryStreet,
        delivery_city: formData.deliveryCity,
        delivery_postcode: formData.deliveryPostcode,
        required_delivery_date: formData.requiredDeliveryDate ? format(formData.requiredDeliveryDate, 'yyyy-MM-dd') : null,
        held_until: heldUntilDate.toISOString(),
        status: 'pending',
        admin_notes: deliveryResult ? `Delivery: ${deliveryResult.zone.tier_label}${deliveryResult.zone.surcharge_type === 'per_sqm' ? ` (+£${Number(deliveryResult.zone.surcharge_per_sqm).toFixed(2)}/sq.m)` : deliveryResult.zone.surcharge_type === 'quote_required' ? ' (Quote required)' : ''}` : null,
      }]);

      if (error) throw error;

      try {
        await supabase.functions.invoke('send-reservation-email', {
          body: {
            reservation: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              requiredQuantitySqm: reservedQuantity,
              originalQuantitySqm: originalQuantity,
              needOutdoorTile: formData.needOutdoorTile === 'yes',
              deliveryAddress: `${formData.deliveryDoorHouse}, ${formData.deliveryStreet}, ${formData.deliveryCity}, ${formData.deliveryPostcode}`,
              requiredDeliveryDate: formData.requiredDeliveryDate ? format(formData.requiredDeliveryDate, 'yyyy-MM-dd') : null,
              heldUntil: heldUntilDate.toISOString(),
            },
          },
        });
      } catch (emailError) {
        console.log('Email notification failed, but reservation was saved');
      }

      setHeldUntil(heldUntilDate);
      setExceededMax(didExceed);
      setRequestedQuantity(originalQuantity);
      setIsSubmitting(false);
      setIsSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error('Reservation error:', error);
      setSubmitError('Failed to submit reservation. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isSuccess && heldUntil) {
    const reservedQty = Math.min(requestedQuantity, MAX_RESERVATION_SQM);
    return (
      <div className="text-center py-10 animate-fade-in">
        <Check className="h-5 w-5 text-foreground mx-auto mb-4" />
        <h3 className="font-serif text-xl font-light mb-3">Reservation Request Sent</h3>
        
        {exceededMax && (
          <div className="border-t border-border pt-4 mb-4 text-left">
            <p className="text-sm text-muted-foreground">
              You requested {requestedQuantity} sq.m — the maximum per order is {MAX_RESERVATION_SQM} sq.m. 
              We've reserved {reservedQty} sq.m. A representative will contact you about your additional requirements.
            </p>
          </div>
        )}

        <div className="py-4 border-y border-border mb-4">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">
            Provisionally held until
          </p>
          <p className="font-serif text-lg font-light text-foreground">
            {format(heldUntil, "EEEE, d MMMM yyyy")}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          An Inner Space representative will contact you to finalise details.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Postcode Checker */}
      <div className="py-5 border-y border-border">
        <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-4">Check Delivery Tariff</p>
        <PostcodeChecker
          compact
          defaultSqm={formData.requiredQuantitySqm || 57}
          onResult={(res) => setDeliveryResult(res)}
        />
      </div>

      {deliveryResult && deliveryResult.zone.surcharge_type === 'quote_required' && (
        <p className="text-sm text-muted-foreground">
          A delivery quotation will be included with your reservation request.
        </p>
      )}

      {showTerms && (
        <div className="border-t border-border pt-6 space-y-5 animate-fade-in">
          {/* Sample eligibility check */}
          {isVerifyingSample && (
            <p className="text-sm text-muted-foreground">Verifying sample order…</p>
          )}

          {sampleVerified === false && !isVerifyingSample && (
            <div className="pt-4 border-t border-border">
              <SampleOrderDialog productId={productId} onOrderComplete={async () => {
                setIsVerifyingSample(true);
                try {
                  const { data: sampleOrders, error: sampleError } = await supabase
                    .from('sample_orders')
                    .select('id')
                    .eq('email', formData.email.trim().toLowerCase())
                    .eq('status', 'confirmed')
                    .limit(1);
                  if (!sampleError && sampleOrders && sampleOrders.length > 0) {
                    setSampleVerified(true);
                  }
                } catch {}
                setIsVerifyingSample(false);
              }}>
                <button type="button" className="w-full text-left border border-destructive bg-destructive/5 p-4 rounded cursor-pointer hover:bg-destructive/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive leading-relaxed">
                      To preserve the integrity of reservations from allocated stock, you must order a £7.00 sample prior to making your reservation. <span className="underline font-medium">Please click here to order your sample.</span>
                    </p>
                  </div>
                </button>
              </SampleOrderDialog>
            </div>
          )}

          {sampleVerified === true && !isVerifyingSample && (
            <>
              {submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTerms(false)}
                  className="flex-1 h-11"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="flex-1 h-11"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? 'Processing…' : 'Complete Reservation'}
                </Button>
              </div>
            </>
          )}

          {sampleVerified === false && !isVerifyingSample && (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTerms(false)}
                className="flex-1 h-11"
              >
                Back
              </Button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleShowTerms} className={cn("space-y-5", showTerms && "hidden")}>
        <div className="py-4 border-y border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong>Reservations are linked to confirmed sample requests by your email. Minimum reservation quantity: {MIN_ORDER_SQM} sq.m</strong>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs tracking-wide uppercase text-muted-foreground">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your full name"
            value={formData.name}
            onChange={handleChange('name')}
            className={`h-11 ${errors.name ? 'border-destructive' : ''}`}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs tracking-wide uppercase text-muted-foreground">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Same email used for sample order"
              value={formData.email}
              onChange={handleChange('email')}
              className={`h-11 ${errors.email ? 'border-destructive' : ''}`}
            />
            <p className="text-xs text-muted-foreground">Must match your sample order email</p>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs tracking-wide uppercase text-muted-foreground">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="07XXX XXXXXX"
              value={formData.phone}
              onChange={handleChange('phone')}
              className={`h-11 ${errors.phone ? 'border-destructive' : ''}`}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="requiredQuantitySqm" className="text-xs tracking-wide uppercase text-muted-foreground">Required Quantity (sq.m)</Label>
            <Input
              id="requiredQuantitySqm"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 57.12"
              value={formData.requiredQuantitySqm || ''}
              onChange={handleChange('requiredQuantitySqm')}
              className={`h-11 ${errors.requiredQuantitySqm ? 'border-destructive' : ''}`}
            />
            {errors.requiredQuantitySqm && <p className="text-xs text-destructive">{errors.requiredQuantitySqm}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-xs tracking-wide uppercase text-muted-foreground">Need a matching patio/outdoor porcelain tile for indoor/outdoors?</Label>
            <RadioGroup
              value={formData.needOutdoorTile || ''}
              onValueChange={handleOutdoorChange}
              className="flex gap-6 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="outdoor-yes" />
                <Label htmlFor="outdoor-yes" className="font-normal cursor-pointer text-sm">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="outdoor-no" />
                <Label htmlFor="outdoor-no" className="font-normal cursor-pointer text-sm">No</Label>
              </div>
            </RadioGroup>
            {errors.needOutdoorTile && <p className="text-xs text-destructive">{errors.needOutdoorTile}</p>}
          </div>
        </div>

        <div className="space-y-5">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Delivery Address</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="deliveryDoorHouse" className="text-xs tracking-wide uppercase text-muted-foreground">Door / House No.</Label>
              <Input
                id="deliveryDoorHouse"
                type="text"
                placeholder="e.g. 42"
                value={formData.deliveryDoorHouse}
                onChange={handleChange('deliveryDoorHouse')}
                className={`h-11 ${errors.deliveryDoorHouse ? 'border-destructive' : ''}`}
              />
              {errors.deliveryDoorHouse && <p className="text-xs text-destructive">{errors.deliveryDoorHouse}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryStreet" className="text-xs tracking-wide uppercase text-muted-foreground">Street</Label>
              <Input
                id="deliveryStreet"
                type="text"
                placeholder="e.g. High Street"
                value={formData.deliveryStreet}
                onChange={handleChange('deliveryStreet')}
                className={`h-11 ${errors.deliveryStreet ? 'border-destructive' : ''}`}
              />
              {errors.deliveryStreet && <p className="text-xs text-destructive">{errors.deliveryStreet}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="deliveryCity" className="text-xs tracking-wide uppercase text-muted-foreground">City</Label>
              <Input
                id="deliveryCity"
                type="text"
                placeholder="e.g. London"
                value={formData.deliveryCity}
                onChange={handleChange('deliveryCity')}
                className={`h-11 ${errors.deliveryCity ? 'border-destructive' : ''}`}
              />
              {errors.deliveryCity && <p className="text-xs text-destructive">{errors.deliveryCity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryPostcode" className="text-xs tracking-wide uppercase text-muted-foreground">Postcode</Label>
              <Input
                id="deliveryPostcode"
                type="text"
                placeholder="e.g. SW1A 1AA"
                value={formData.deliveryPostcode}
                onChange={handleChange('deliveryPostcode')}
                className={`h-11 ${errors.deliveryPostcode ? 'border-destructive' : ''}`}
              />
              {errors.deliveryPostcode && <p className="text-xs text-destructive">{errors.deliveryPostcode}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs tracking-wide uppercase text-muted-foreground">Required Delivery Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-11",
                  !formData.requiredDeliveryDate && "text-muted-foreground",
                  errors.requiredDeliveryDate && "border-destructive"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.requiredDeliveryDate ? format(formData.requiredDeliveryDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.requiredDeliveryDate}
                onSelect={(date) => {
                  setFormData(prev => ({ ...prev, requiredDeliveryDate: date }));
                  if (errors.requiredDeliveryDate) {
                    setErrors(prev => ({ ...prev, requiredDeliveryDate: undefined }));
                  }
                }}
                disabled={(date) => {
                  const fourWeeksFromNow = new Date();
                  fourWeeksFromNow.setDate(fourWeeksFromNow.getDate() + 28);
                  fourWeeksFromNow.setHours(0, 0, 0, 0);
                  return date < fourWeeksFromNow;
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">
            7 days complimentary storage from this date. Thereafter £10 per pallet per week.
          </p>
          {errors.requiredDeliveryDate && <p className="text-xs text-destructive">{errors.requiredDeliveryDate}</p>}
        </div>

        <div className="pt-2">
          <Button type="submit" className="w-full h-11">
            Request Reservation
          </Button>
        </div>
      </form>
    </div>
  );
}
