import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';

interface ImageCarouselProps {
  images: string[];
  heroImage?: string;
}

export function ImageCarousel({ images, heroImage }: ImageCarouselProps) {
  const allImages = heroImage ? [heroImage, ...images] : images;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const thumbRef = useRef<HTMLDivElement>(null);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  if (allImages.length === 0) {
    return (
      <div className="aspect-square bg-muted flex items-center justify-center">
        <span className="text-muted-foreground text-sm">No images available</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full overflow-hidden">
        <div 
          className="aspect-square relative overflow-hidden cursor-pointer group"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={allImages[currentIndex]}
            alt={`Product image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
          
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="h-5 w-5 text-foreground/60" />
            </div>
          </div>
          
          {allImages.length > 1 && (
            <>
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        
        {allImages.length > 1 && (
          <div className="relative flex items-center gap-2 mt-3">
            <button
              className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-muted hover:bg-accent transition-colors"
              onClick={() => {
                if (thumbRef.current) {
                  thumbRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                }
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div
              ref={thumbRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {allImages.map((image, index) => (
                <button
                  key={index}
                  className={`flex-shrink-0 w-20 h-20 overflow-hidden border transition-colors ${
                    index === currentIndex 
                      ? 'border-foreground' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            <button
              className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-muted hover:bg-accent transition-colors"
              onClick={() => {
                if (thumbRef.current) {
                  thumbRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                }
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background border-border">
          <div className="relative w-full h-full flex items-center justify-center p-6">
            <DialogClose className="absolute top-4 right-4 z-10 h-8 w-8 flex items-center justify-center bg-background border border-border hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </DialogClose>
            
            <img
              src={allImages[currentIndex]}
              alt={`Product image ${currentIndex + 1} - enlarged`}
              className="max-w-full max-h-[85vh] object-contain"
            />
            
            {allImages.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-background border border-border hover:bg-muted transition-colors"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-background border border-border hover:bg-muted transition-colors"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
