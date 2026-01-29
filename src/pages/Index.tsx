import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/CountdownTimer';
import { StockIndicator } from '@/components/StockIndicator';
import { PostcodeChecker } from '@/components/PostcodeChecker';
import { ActionCard } from '@/components/ActionCard';
import { ReservationForm } from '@/components/ReservationForm';
import { SampleForm } from '@/components/SampleForm';
import { InterestForm } from '@/components/InterestForm';
import { Package, Box, Bell, Check, Factory, Ruler, Award } from 'lucide-react';
import heroImage from '@/assets/hero-tiles.jpg';
import tileDetail from '@/assets/tile-detail.jpg';

const Index = () => {
  const [isExpired, setIsExpired] = useState(false);

  if (isExpired) {
    return (
      <div className="min-h-screen bg-background">
        <AllocationClosed />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-6 border-b border-border">
        <div className="section-container">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">InniSpace</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Premium Italian porcelain tiles" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>
        
        <div className="relative z-10 section-container py-16 sm:py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-semibold mb-6 text-balance animate-fade-in-up">
              120×120 Italian Porcelain — Allocated Stock Release
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 text-balance animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Factory-allocated. Pallet-only. First-quality. Once this batch is gone, pricing reverts.
            </p>
            
            <div className="mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <CountdownTimer onExpired={() => setIsExpired(true)} />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Button size="lg" className="h-14 px-8 text-base" asChild>
                <a href="#actions">Reserve a Pallet</a>
              </Button>
              <Button size="lg" variant="secondary" className="h-14 px-8 text-base" asChild>
                <a href="#actions">Order a Sample</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stock Indicator Section */}
      <section className="py-16 bg-secondary/50">
        <div className="section-container">
          <StockIndicator />
        </div>
      </section>

      {/* What Makes This Different */}
      <section className="py-16 lg:py-24">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl sm:text-3xl font-serif font-semibold mb-8">
                What makes this allocation different
              </h3>
              
              <div className="space-y-6">
                <FeatureItem 
                  icon={Factory}
                  title="Made in Italy — First Quality"
                  description="Direct from Italian factories, not clearance or seconds"
                />
                <FeatureItem 
                  icon={Ruler}
                  title="120×120 Large-Format Porcelain"
                  description="Normally limited availability in this specification"
                />
                <FeatureItem 
                  icon={Award}
                  title="Factory-Allocated Stock"
                  description="Logistics-optimised release, not end-of-line"
                />
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={tileDetail} 
                alt="Tile surface detail" 
                className="rounded shadow-premium-lg w-full aspect-square object-cover"
              />
              <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground py-3 px-6 rounded shadow-lg">
                <span className="font-serif font-semibold">120×120cm</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Postcode Checker */}
      <section className="py-16 bg-card border-y border-border">
        <div className="section-container">
          <div className="max-w-xl mx-auto text-center mb-8">
            <h3 className="text-2xl font-serif font-semibold mb-3">Check Delivery Availability</h3>
            <p className="text-muted-foreground">
              Enter your postcode to confirm this allocation is available in your area.
            </p>
          </div>
          <PostcodeChecker />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 lg:py-24">
        <div className="section-container">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl sm:text-3xl font-serif font-semibold mb-6">
              Allocation Pricing
            </h3>
            
            <div className="bg-secondary/50 rounded-lg p-8 mb-6">
              <p className="text-muted-foreground mb-4">Typical retail pricing</p>
              <p className="text-3xl sm:text-4xl font-serif font-semibold line-through text-muted-foreground/60">
                £60/m²+ delivered
              </p>
              
              <div className="my-6 border-t border-border" />
              
              <p className="text-muted-foreground mb-2">Allocated pricing</p>
              <p className="text-xl font-medium text-foreground">
                Available during this release only
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Once this allocation closes, pricing reverts immediately.
            </p>
          </div>
        </div>
      </section>

      {/* Actions Section */}
      <section id="actions" className="py-16 lg:py-24 bg-muted/50">
        <div className="section-container">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-serif font-semibold mb-3">
              How to Proceed
            </h3>
            <p className="text-muted-foreground">Choose the option that suits your needs</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <ActionCard
              icon={Package}
              title="Reserve a Pallet"
              description="Secure your allocation for 48 hours. No payment required upfront."
              buttonText="Reserve Now"
              buttonVariant="default"
              highlight
            >
              <ReservationForm />
            </ActionCard>
            
            <ActionCard
              icon={Box}
              title="Order a Sample"
              description="See and feel the quality before committing. Dispatched within 24–48 hours."
              buttonText="Request Sample"
              buttonVariant="secondary"
            >
              <SampleForm />
            </ActionCard>
            
            <ActionCard
              icon={Bell}
              title="Register Interest"
              description="Not ready now? Get notified for future allocation releases."
              buttonText="Notify Me"
              buttonVariant="outline"
            >
              <InterestForm />
            </ActionCard>
          </div>
        </div>
      </section>

      {/* Footer / Brand Authority */}
      <footer className="py-16 bg-primary text-primary-foreground">
        <div className="section-container text-center">
          <h2 className="font-serif text-2xl font-semibold mb-4">InniSpace</h2>
          <p className="text-primary-foreground/80 max-w-md mx-auto">
            Supplying premium porcelain to designers and contractors across the UK.
          </p>
          <div className="mt-8 pt-8 border-t border-primary-foreground/20">
            <p className="text-sm text-primary-foreground/60">
              © {new Date().getFullYear()} InniSpace. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

function FeatureItem({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: typeof Check; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
        <Icon className="h-5 w-5 text-foreground" />
      </div>
      <div>
        <h4 className="font-medium mb-1">{title}</h4>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function AllocationClosed() {
  return (
    <>
      <header className="py-6 border-b border-border">
        <div className="section-container">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">InniSpace</h1>
        </div>
      </header>
      
      <section className="py-24 lg:py-32">
        <div className="section-container text-center">
          <div className="max-w-xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-8">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-serif font-semibold mb-4">
              This allocation has now closed
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              The allocated stock release has ended. Register below to be notified when the next allocation opens.
            </p>
            
            <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-auto">
              <InterestForm />
            </div>
          </div>
        </div>
      </section>
      
      <footer className="py-12 bg-muted/50 border-t border-border">
        <div className="section-container text-center">
          <h2 className="font-serif text-xl font-semibold mb-2">InniSpace</h2>
          <p className="text-sm text-muted-foreground">
            Supplying premium porcelain to designers and contractors across the UK.
          </p>
        </div>
      </footer>
    </>
  );
}

export default Index;
