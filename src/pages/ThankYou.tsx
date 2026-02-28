import { useEffect } from 'react';
import { Check } from 'lucide-react';
import { pinterestTrack } from '@/lib/pinterest';

export default function ThankYou() {
  useEffect(() => {
    document.title = 'Inner Space — Thank You';

    // Fire Meta Lead event on this page load — this is the URL Meta should track
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Lead', { content_name: 'Tile Enquiry' });
      console.log('[Meta Pixel] Lead event fired on /thank-you');
    }

    pinterestTrack('lead', { lead_type: 'Allocation Interest' });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Check className="h-6 w-6 text-foreground" />
        </div>
        <h1 className="font-serif text-2xl font-light text-foreground">Thank you for your enquiry</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We've received your details and will be in touch shortly to discuss availability and next steps.
        </p>
        <button
          onClick={() => window.history.back()}
          className="inline-block text-xs tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground/30 pb-0.5"
        >
          Back to product
        </button>
      </div>
    </div>
  );
}
