import { useState } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Clock, AlertCircle, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

const MIN_ORDER_SQM = 57;

const reservationSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  email: z.string().trim().email('Please enter a valid email').max(255),
  phone: z.string().trim().min(10, 'Please enter a valid phone number').max(20),
  requiredQuantitySqm: z.number().min(MIN_ORDER_SQM, `Minimum order is ${MIN_ORDER_SQM} SQ.M`),
  needOutdoorTile: z.boolean(),
  deliveryDoorHouse: z.string().trim().min(1, 'Door/House number is required').max(100),
  deliveryStreet: z.string().trim().min(1, 'Street name is required').max(200),
  deliveryCity: z.string().trim().min(1, 'City is required').max(100),
  deliveryPostcode: z.string().trim().min(5, 'Please enter a valid postcode').max(10),
  requiredDeliveryDate: z.date().optional(),
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
    needOutdoorTile: false,
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
    setFormData(prev => ({ ...prev, needOutdoorTile: value === 'yes' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    
    setIsSubmitting(true);
    
    try {
      const heldUntilDate = addDays(new Date(), 7);
      
      const { error } = await supabase.from('reservations').insert([{
        product_id: productId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        required_quantity_sqm: formData.requiredQuantitySqm,
        need_outdoor_tile: formData.needOutdoorTile,
        delivery_door_house: formData.deliveryDoorHouse,
        delivery_street: formData.deliveryStreet,
        delivery_city: formData.deliveryCity,
        delivery_postcode: formData.deliveryPostcode,
        required_delivery_date: formData.requiredDeliveryDate ? format(formData.requiredDeliveryDate, 'yyyy-MM-dd') : null,
        held_until: heldUntilDate.toISOString(),
        status: 'pending',
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
              requiredQuantitySqm: formData.requiredQuantitySqm,
              needOutdoorTile: formData.needOutdoorTile,
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
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-xl font-bold mb-2">Reservation Request Sent</h3>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-secondary/30 border border-border rounded-lg p-4 mb-6">
        <p className="text-sm text-foreground leading-relaxed">
          <strong>Please note:</strong> Reservation requests are held provisionally for 7 days.
          During this time, samples can be ordered and an Inner Space representative will contact you to finalise details.
          If not confirmed within 7 days, the reservation is automatically released.
        </p>
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
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange('email')}
            className={errors.email ? 'border-destructive' : ''}
          />
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
          <Label>Need Matching Outdoor Tile?</Label>
          <RadioGroup
            value={formData.needOutdoorTile ? 'yes' : 'no'}
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
        <Label>Required Delivery Date (Optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.requiredDeliveryDate && "text-muted-foreground"
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
              onSelect={(date) => setFormData(prev => ({ ...prev, requiredDeliveryDate: date }))}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {submitError && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}
      
      <div className="pt-2">
        <Button 
          type="submit" 
          className="w-full h-12 text-base"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Request Reservation'}
        </Button>
      </div>
    </form>
  );
}
