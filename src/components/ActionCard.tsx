import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  buttonText: string;
  buttonVariant?: 'default' | 'secondary' | 'outline';
  children: ReactNode;
  highlight?: boolean;
}

export function ActionCard({
  icon: Icon,
  title,
  description,
  buttonText,
  buttonVariant = 'default',
  children,
  highlight = false,
}: ActionCardProps) {
  return (
    <div 
      className={`p-6 rounded border transition-all ${
        highlight 
          ? 'bg-primary/5 border-primary/20 shadow-premium' 
          : 'bg-card border-border hover:border-primary/30 hover:shadow-premium'
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-foreground" />
      </div>
      
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant={buttonVariant} className="w-full">
            {buttonText}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold">{title}</DialogTitle>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    </div>
  );
}
