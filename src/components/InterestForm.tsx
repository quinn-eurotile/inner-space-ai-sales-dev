import { useState } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, Bell } from 'lucide-react';

const interestSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  email: z.string().trim().email('Please enter a valid email').max(255),
  postcode: z.string().trim().min(5, 'Please enter a valid postcode').max(10),
});

type FormData = z.infer<typeof interestSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;

interface InterestFormProps {
  onSuccess?: () => void;
}

export function InterestForm({ onSuccess }: InterestFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    postcode: '',
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

  const handleSubmit = (e: React.FormEvent) => {
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
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      onSuccess?.();
    }, 1000);
  };

  if (isSuccess) {
    return (
      <div className="text-center py-6 animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
          <Check className="h-6 w-6 text-success" />
        </div>
        <h3 className="text-lg font-serif font-semibold mb-2">You're on the list</h3>
        <p className="text-sm text-muted-foreground">
          We'll notify you when the next allocation opens.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
          <Bell className="h-5 w-5 text-accent-foreground" />
        </div>
        <div>
          <h3 className="font-medium">Register Interest</h3>
          <p className="text-sm text-muted-foreground">For future allocation releases</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="interest-name">Name</Label>
        <Input
          id="interest-name"
          type="text"
          placeholder="Your name"
          value={formData.name}
          onChange={handleChange('name')}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="interest-email">Email</Label>
        <Input
          id="interest-email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange('email')}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="interest-postcode">Postcode</Label>
        <Input
          id="interest-postcode"
          type="text"
          placeholder="SW1A 1AA"
          value={formData.postcode}
          onChange={handleChange('postcode')}
          className={errors.postcode ? 'border-destructive' : ''}
        />
        {errors.postcode && <p className="text-xs text-destructive">{errors.postcode}</p>}
      </div>
      
      <Button 
        type="submit" 
        variant="outline"
        className="w-full h-11"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Registering...' : 'Notify Me'}
      </Button>
    </form>
  );
}
