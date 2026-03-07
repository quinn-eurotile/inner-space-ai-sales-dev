import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface StickyMobileCTAProps {
  productName?: string;
  isProductSale?: boolean;
  pricePerSqm?: number | null;
}

export function StickyMobileCTA({ productName, isProductSale = true, pricePerSqm }: StickyMobileCTAProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToHeroCTA = () => {
    const hero = document.querySelector('[data-hero-cta]');
    if (hero) {
      hero.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border p-3 sm:hidden animate-fade-in">
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="min-w-0">
          {isProductSale && pricePerSqm ? (
            <>
              <p className="text-sm font-semibold text-foreground truncate">From £{pricePerSqm.toFixed(2)}/sq.m</p>
              <p className="text-[10px] text-muted-foreground">Free delivery</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground truncate">{productName || 'This Tile'}</p>
              <p className="text-[10px] text-muted-foreground">Free samples available</p>
            </>
          )}
        </div>
        <Button
          size="lg"
          className="h-10 px-5 shrink-0 font-semibold text-sm"
          style={{ backgroundColor: '#f0aa47', color: '#ffffff', border: 'none' }}
          onClick={scrollToHeroCTA}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#d4913a')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f0aa47')}
        >
          Free Sample
        </Button>
      </div>
    </div>
  );
}
