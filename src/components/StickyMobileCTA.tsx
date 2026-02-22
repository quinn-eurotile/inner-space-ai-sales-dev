import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface StickyMobileCTAProps {
  onReserveClick: () => void;
}

export function StickyMobileCTA({ onReserveClick }: StickyMobileCTAProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border p-3 sm:hidden animate-fade-in">
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">From £36/sq.m</p>
          <p className="text-[10px] text-muted-foreground">Free delivery · Save 52%</p>
        </div>
        <Button
          size="lg"
          className="h-10 px-5 shrink-0 font-semibold text-sm"
          style={{ backgroundColor: '#f0aa47', color: '#ffffff', border: 'none' }}
          onClick={onReserveClick}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#d4913a')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f0aa47')}
        >
          Reserve Now
        </Button>
      </div>
    </div>
  );
}
