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
}: ActionCardProps) {
  return (
    <div>
      <div className="mb-4">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <h3 className="font-serif text-lg font-light text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{description}</p>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant={buttonVariant} className="text-sm tracking-wide">
            {buttonText}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif font-light text-xl">{title}</DialogTitle>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    </div>
  );
}
