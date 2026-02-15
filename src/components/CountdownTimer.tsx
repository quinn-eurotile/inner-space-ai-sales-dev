import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const ALLOCATION_DURATION_DAYS = 14;
const STORAGE_KEY = 'innispace_allocation_end';

const getEndDate = (): Date => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return new Date(stored);
  }
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + ALLOCATION_DURATION_DAYS);
  localStorage.setItem(STORAGE_KEY, endDate.toISOString());
  return endDate;
};

const calculateTimeLeft = (endDate: Date): TimeLeft | null => {
  const difference = endDate.getTime() - new Date().getTime();
  
  if (difference <= 0) {
    return null;
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

interface CountdownTimerProps {
  onExpired?: () => void;
}

export function CountdownTimer({ onExpired }: CountdownTimerProps) {
  const [endDate] = useState<Date>(getEndDate);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calculateTimeLeft(endDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(endDate);
      setTimeLeft(newTimeLeft);
      
      if (!newTimeLeft && onExpired) {
        onExpired();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, onExpired]);

  if (!timeLeft) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          This allocation has now closed
        </p>
      </div>
    );
  }

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <span className="font-serif text-2xl sm:text-3xl font-light text-foreground tabular-nums">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground mt-1">
        {label}
      </span>
    </div>
  );

  return (
    <div>
      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
        Allocation closes on
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        {format(endDate, "d MMMM yyyy")}
      </p>
      <div className="flex gap-5 sm:gap-6">
        <TimeBlock value={timeLeft.days} label="Days" />
        <span className="font-serif text-2xl sm:text-3xl font-light text-muted-foreground/40">:</span>
        <TimeBlock value={timeLeft.hours} label="Hours" />
        <span className="font-serif text-2xl sm:text-3xl font-light text-muted-foreground/40">:</span>
        <TimeBlock value={timeLeft.minutes} label="Mins" />
        <span className="hidden sm:inline font-serif text-2xl sm:text-3xl font-light text-muted-foreground/40">:</span>
        <div className="hidden sm:block">
          <TimeBlock value={timeLeft.seconds} label="Secs" />
        </div>
      </div>
    </div>
  );
}
