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
    
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      onSuccess?.();
    }, 1000);
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <Check className="h-5 w-5 text-foreground mx-auto mb-4" />
        <h3 className="font-serif text-lg font-light text-foreground mb-2">You're on the list</h3>
        <p className="text-sm text-muted-foreground">
          We'll notify you when the next allocation opens.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="interest-name" className="text-xs tracking-wide uppercase text-muted-foreground">Name</Label>
        <Input
          id="interest-name"
          type="text"
          placeholder="Your name"
          value={formData.name}
          onChange={handleChange('name')}
          className={`h-11 ${errors.name ? 'border-muted-foreground' : ''}`}
        />
        {errors.name && <p className="text-xs text-muted-foreground">{errors.name}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="interest-email" className="text-xs tracking-wide uppercase text-muted-foreground">Email</Label>
        <Input
          id="interest-email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange('email')}
          className={`h-11 ${errors.email ? 'border-muted-foreground' : ''}`}
        />
        {errors.email && <p className="text-xs text-muted-foreground">{errors.email}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="interest-postcode" className="text-xs tracking-wide uppercase text-muted-foreground">Postcode</Label>
        <Input
          id="interest-postcode"
          type="text"
          placeholder="SW1A 1AA"
          value={formData.postcode}
          onChange={handleChange('postcode')}
          className={`h-11 ${errors.postcode ? 'border-muted-foreground' : ''}`}
        />
        {errors.postcode && <p className="text-xs text-muted-foreground">{errors.postcode}</p>}
      </div>
      
      <Button 
        type="submit" 
        variant="outline"
        className="w-full h-11"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Registering…' : 'Notify Me'}
      </Button>
    </form>
  );
}
