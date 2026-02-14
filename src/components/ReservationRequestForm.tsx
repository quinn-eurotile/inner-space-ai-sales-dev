import { useState } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Clock, AlertCircle, CalendarIcon, ShieldCheck, Info, CircleAlert } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { PostcodeChecker } from '@/components/PostcodeChecker';
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

  const handleShowTerms = (e: React.FormEvent) => {
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
    
    setShowTerms(true);
    setTermsAccepted(false);
  };

  const handleSubmit = async () => {
    if (!termsAccepted) return;
    setSubmitError(null);
    setIsSubmitting(true);
    setIsCheckingEligibility(true);

    try {
      // Check if the email has a confirmed sample order
      const { data: sampleOrders, error: sampleError } = await supabase
        .from('sample_orders')
        .select('id')
        .eq('email', formData.email.trim().toLowerCase())
        .eq('status', 'confirmed')
        .limit(1);

      if (sampleError) throw sampleError;

      if (!sampleOrders || sampleOrders.length === 0) {
        setSubmitError('A sample order is required before reserving stock. Please order a sample first — your reservation will be linked to the same email address.');
        setIsSubmitting(false);
        setIsCheckingEligibility(false);
        return;
      }

      setIsCheckingEligibility(false);

      // Check existing reservations for this email
      const { data: existingReservations } = await supabase
        .from('reservations')
        .select('required_quantity_sqm')
        .eq('email', formData.email.trim().toLowerCase())
        .in('status', ['pending', 'confirmed']);

      const existingTotal = existingReservations?.reduce((sum, r) => sum + Number(r.required_quantity_sqm), 0) || 0;
      const remainingAllowance = MAX_RESERVATION_SQM - existingTotal;

      if (remainingAllowance <= 0) {
        setSubmitError(`You have already reserved the maximum of ${MAX_RESERVATION_SQM} SQ.M with this email address. A representative will contact you if you need additional stock.`);
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
        admin_notes: deliveryResult ? `Delivery: ${deliveryResult.zone.tier_label}${deliveryResult.zone.surcharge_type === 'per_sqm' ? ` (+£${Number(deliveryResult.zone.surcharge_per_sqm).toFixed(2)}/m²)` : deliveryResult.zone.surcharge_type === 'quote_required' ? ' (Quote required)' : ''}` : null,
      }]);

      if (error) throw error;

      // Try to send email notification (non-blocking)
      try {
        await supabase.functions.invoke('send-reservation-email', {
          body: {
            reservation: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              requiredQuantitySqm: reservedQuantity,
              needOutdoorTile: formData.needOutdoorTile === 'yes',
              deliveryAddress: `${formData.deliveryDoorHouse}, ${formData.deliveryStreet}, ${formData.deliveryCity}, ${formData.deliveryPostcode}`,
              requiredDeliveryDate: formData.requiredDeliveryDate,
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
      setIsCheckingEligibility(false);
    }
  };

  if (isSuccess && heldUntil) {
    const reservedQty = Math.min(requestedQuantity, MAX_RESERVATION_SQM);
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-xl font-bold mb-2">Reservation Request Sent</h3>
        
        {exceededMax && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4 text-left">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Maximum reservation limit reached
                </p>
                <p className="text-sm text-muted-foreground">
                  You requested {requestedQuantity} SQ.M, but the maximum per sample order is {MAX_RESERVATION_SQM} SQ.M. 
                  We've reserved {reservedQty} SQ.M for you. An Inner Space representative will contact you shortly about your additional requirements.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-secondary/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            <span>Provisionally held until:</span>
          </div>
          <p className="text-lg font-semibold text-primary">
            {format(heldUntil, "EEEE, d MMMM yyyy 'at' HH:mm")}
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
      {/* Postcode Checker for Reservation */}
      <div className="bg-secondary/20 border border-border rounded-lg p-4">
        <h4 className="font-medium text-sm mb-3">Check Delivery Tariff for Your Postcode</h4>
        <PostcodeChecker
          compact
          defaultSqm={formData.requiredQuantitySqm || 57}
          onResult={(res) => setDeliveryResult(res)}
        />
      </div>

      {deliveryResult && deliveryResult.zone.surcharge_type !== 'none' && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            {deliveryResult.zone.surcharge_type === 'quote_required'
              ? 'A delivery quotation will be included with your reservation request.'
              : `An additional delivery surcharge of +£${Number(deliveryResult.zone.surcharge_per_sqm).toFixed(2)} per m² applies and will be included with your reservation request.`}
          </p>
        </div>
      )}

    {showTerms && (
      <div className="bg-secondary/30 border border-border rounded-lg p-5 space-y-4 animate-fade-in">
        <div className="flex items-start gap-3">
          <CircleAlert className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <h4 className="font-semibold text-foreground">Important Allocation Conditions</h4>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground pl-2">
          {[
            `Minimum ${MIN_ORDER_SQM} m² applies`,
            '£36 per m² + VAT',
            'Full payment required prior to delivery',
            'Kerbside HGV delivery',
            '10–15% overage recommended',
            'Additional quantities not batch guaranteed',
            'Delivery tariff may apply',
            'Qualifying damage credited (no replacements)',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-start gap-3 pt-2 border-t border-border">
          <Checkbox
            id="terms-accept"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
          />
          <Label htmlFor="terms-accept" className="font-normal cursor-pointer text-sm leading-relaxed">
            I confirm I have reviewed and understand the allocation terms
          </Label>
        </div>

        {submitError && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{submitError}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowTerms(false)}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="button"
            className="flex-1 h-12 text-base"
            disabled={!termsAccepted || isSubmitting}
            onClick={handleSubmit}
          >
            {isCheckingEligibility ? 'Verifying eligibility...' : isSubmitting ? 'Processing...' : 'Complete Reservation Request'}
          </Button>
        </div>
      </div>
    )}

    <form onSubmit={handleShowTerms} className={cn("space-y-4", showTerms && "hidden")}>
      <div className="bg-secondary/30 border border-border rounded-lg p-4 mb-2">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-foreground leading-relaxed mb-2">
              <strong>Sample order required:</strong> To ensure our limited stock goes to genuinely interested customers, 
              reservations are only available after a sample has been ordered. Your reservation will be linked to the email address used for your sample order.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Reservations are held provisionally for 7 days (max {MAX_RESERVATION_SQM} SQ.M per order). 
              During this time, an Inner Space representative will contact you to finalise details.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          type="text"
          placeholder="Your full name"
          value={formData.name}
          onChange={handleChange('name')}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="Same email used for sample order"
            value={formData.email}
            onChange={handleChange('email')}
            className={errors.email ? 'border-destructive' : ''}
          />
          <p className="text-xs text-muted-foreground">Must match your sample order email</p>
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="07XXX XXXXXX"
            value={formData.phone}
            onChange={handleChange('phone')}
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="requiredQuantitySqm">Required Quantity (SQ.M) *</Label>
          <Input
            id="requiredQuantitySqm"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 57.12"
            value={formData.requiredQuantitySqm || ''}
            onChange={handleChange('requiredQuantitySqm')}
            className={errors.requiredQuantitySqm ? 'border-destructive' : ''}
          />
          {errors.requiredQuantitySqm && <p className="text-xs text-destructive">{errors.requiredQuantitySqm}</p>}
        </div>

        <div className="space-y-2">
          <Label>Need Matching Outdoor/Patio Tile? *</Label>
          <RadioGroup
            value={formData.needOutdoorTile || ''}
            onValueChange={handleOutdoorChange}
            className="flex gap-4 pt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="outdoor-yes" />
              <Label htmlFor="outdoor-yes" className="font-normal cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="outdoor-no" />
              <Label htmlFor="outdoor-no" className="font-normal cursor-pointer">No</Label>
            </div>
          </RadioGroup>
          {errors.needOutdoorTile && <p className="text-xs text-destructive">{errors.needOutdoorTile}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground">Delivery Address</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="deliveryDoorHouse">Door/House Number *</Label>
            <Input
              id="deliveryDoorHouse"
              type="text"
              placeholder="e.g. 42"
              value={formData.deliveryDoorHouse}
              onChange={handleChange('deliveryDoorHouse')}
              className={errors.deliveryDoorHouse ? 'border-destructive' : ''}
            />
            {errors.deliveryDoorHouse && <p className="text-xs text-destructive">{errors.deliveryDoorHouse}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryStreet">Street Name *</Label>
            <Input
              id="deliveryStreet"
              type="text"
              placeholder="e.g. High Street"
              value={formData.deliveryStreet}
              onChange={handleChange('deliveryStreet')}
              className={errors.deliveryStreet ? 'border-destructive' : ''}
            />
            {errors.deliveryStreet && <p className="text-xs text-destructive">{errors.deliveryStreet}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="deliveryCity">City *</Label>
            <Input
              id="deliveryCity"
              type="text"
              placeholder="e.g. London"
              value={formData.deliveryCity}
              onChange={handleChange('deliveryCity')}
              className={errors.deliveryCity ? 'border-destructive' : ''}
            />
            {errors.deliveryCity && <p className="text-xs text-destructive">{errors.deliveryCity}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryPostcode">Postcode *</Label>
            <Input
              id="deliveryPostcode"
              type="text"
              placeholder="e.g. SW1A 1AA"
              value={formData.deliveryPostcode}
              onChange={handleChange('deliveryPostcode')}
              className={errors.deliveryPostcode ? 'border-destructive' : ''}
            />
            {errors.deliveryPostcode && <p className="text-xs text-destructive">{errors.deliveryPostcode}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Required Delivery Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
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
              disabled={(date) => date < new Date()}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Please confirm your preferred delivery date. We provide 7 days complimentary storage from this date. Thereafter, storage is charged at £10 per pallet, per week.
        </p>
        {errors.requiredDeliveryDate && <p className="text-xs text-destructive">{errors.requiredDeliveryDate}</p>}
      </div>

      <div className="pt-2">
        <Button 
          type="submit" 
          className="w-full h-12 text-base"
        >
          Request Reservation
        </Button>
      </div>
    </form>
    </div>
  );
}
