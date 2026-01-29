import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';

interface ImageCarouselProps {
  images: string[];
  heroImage?: string;
}

export function ImageCarousel({ images, heroImage }: ImageCarouselProps) {
  const allImages = heroImage ? [heroImage, ...images] : images;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  if (allImages.length === 0) {
    return (
      <div className="aspect-square bg-secondary flex items-center justify-center rounded-lg">
        <span className="text-muted-foreground">No images available</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full">
        {/* Main Image Display */}
        <div 
          className="aspect-square relative overflow-hidden rounded-lg cursor-pointer group"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={allImages[currentIndex]}
            alt={`Product image ${currentIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Zoom indicator */}
          <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-full p-3">
              <ZoomIn className="h-6 w-6 text-foreground" />
            </div>
          </div>
          
          {/* Navigation Arrows */}
          {allImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>
        
        {/* Thumbnail Strip */}
        {allImages.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {allImages.map((image, index) => (
              <button
                key={index}
                className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                  index === currentIndex 
                    ? 'border-primary' 
                    : 'border-transparent hover:border-muted-foreground/50'
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
        )}
        
        {/* Dot Indicators */}
        {allImages.length > 1 && (
          <div className="flex justify-center gap-2 mt-3">
            {allImages.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <DialogClose className="absolute top-4 right-4 z-10 rounded-full bg-background/80 p-2 hover:bg-background transition-colors">
              <X className="h-6 w-6" />
            </DialogClose>
            
            <img
              src={allImages[currentIndex]}
              alt={`Product image ${currentIndex + 1} - enlarged`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            
            {/* Lightbox Navigation */}
            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 h-12 w-12"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 h-12 w-12"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
            
            {/* Lightbox Thumbnails */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-background/80 p-2 rounded-lg">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-colors ${
                      index === currentIndex 
                        ? 'border-primary' 
                        : 'border-transparent hover:border-muted-foreground/50'
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
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
