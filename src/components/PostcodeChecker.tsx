import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, MapPin } from 'lucide-react';

// Sample valid postcode prefixes (England coverage)
const VALID_PREFIXES = [
  'B', 'BA', 'BB', 'BD', 'BH', 'BL', 'BN', 'BR', 'BS', 'CA', 'CB', 'CF', 'CH', 
  'CM', 'CO', 'CR', 'CT', 'CV', 'CW', 'DA', 'DE', 'DH', 'DL', 'DN', 'DT', 'DY',
  'E', 'EC', 'EN', 'EX', 'FY', 'GL', 'GU', 'HA', 'HD', 'HG', 'HP', 'HR', 'HU',
  'HX', 'IG', 'IP', 'KT', 'L', 'LA', 'LE', 'LN', 'LS', 'LU', 'M', 'ME', 'MK',
  'N', 'NE', 'NG', 'NN', 'NR', 'NW', 'OL', 'OX', 'PE', 'PL', 'PO', 'PR', 'RG',
  'RH', 'RM', 'S', 'SE', 'SG', 'SK', 'SL', 'SM', 'SN', 'SO', 'SP', 'SR', 'SS',
  'ST', 'SW', 'SY', 'TA', 'TF', 'TN', 'TQ', 'TR', 'TS', 'TW', 'UB', 'W', 'WA',
  'WC', 'WD', 'WF', 'WN', 'WR', 'WS', 'WV', 'YO'
];

// Some areas excluded for "logistics optimization"
const EXCLUDED_PREFIXES = ['TR', 'PL', 'EX', 'TA', 'CA', 'LA', 'DL'];

type CheckStatus = 'idle' | 'available' | 'unavailable';

interface PostcodeCheckerProps {
  onAvailable?: (postcode: string) => void;
  onUnavailable?: (postcode: string) => void;
}

export function PostcodeChecker({ onAvailable, onUnavailable }: PostcodeCheckerProps) {
  const [postcode, setPostcode] = useState('');
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [isChecking, setIsChecking] = useState(false);

  const checkPostcode = () => {
    if (!postcode.trim()) return;
    
    setIsChecking(true);
    
    // Simulate API call
    setTimeout(() => {
      const normalizedPostcode = postcode.toUpperCase().replace(/\s/g, '');
      const prefix = normalizedPostcode.match(/^[A-Z]+/)?.[0] || '';
      
      if (EXCLUDED_PREFIXES.includes(prefix)) {
        setStatus('unavailable');
        onUnavailable?.(postcode);
      } else if (VALID_PREFIXES.includes(prefix)) {
        setStatus('available');
        onAvailable?.(postcode);
      } else {
        setStatus('unavailable');
        onUnavailable?.(postcode);
      }
      
      setIsChecking(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkPostcode();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter your postcode"
            value={postcode}
            onChange={(e) => {
              setPostcode(e.target.value);
              setStatus('idle');
            }}
            onKeyDown={handleKeyDown}
            className="pl-10 h-12 text-base bg-background border-border focus:border-primary"
          />
        </div>
        <Button 
          onClick={checkPostcode}
          disabled={!postcode.trim() || isChecking}
          className="h-12 px-6"
        >
          {isChecking ? 'Checking...' : 'Check'}
        </Button>
      </div>
      
      {status === 'available' && (
        <div className="mt-4 p-4 bg-success/10 border border-success/20 rounded flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
            <Check className="h-4 w-4 text-success" />
          </div>
          <div>
            <p className="font-medium text-success">Delivery available to this postcode</p>
            <p className="text-sm text-muted-foreground">You can proceed with your reservation</p>
          </div>
        </div>
      )}
      
      {status === 'unavailable' && (
        <div className="mt-4 p-4 bg-muted border border-border rounded animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <X className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="font-medium">This allocation is not available in your area</p>
          </div>
          <button className="text-sm text-copper hover:underline underline-offset-2">
            Register interest for the next allocation release →
          </button>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground mt-3 text-center">
        This allocation is logistics-optimised and available to selected postcodes only.
      </p>
    </div>
  );
}
