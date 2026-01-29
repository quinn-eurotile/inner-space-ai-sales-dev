import { useState, useEffect } from 'react';

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
        <p className="text-lg font-medium text-muted-foreground">
          This allocation has now closed
        </p>
      </div>
    );
  }

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-primary text-primary-foreground min-w-[4rem] sm:min-w-[5rem] py-3 sm:py-4 px-3 sm:px-4 rounded shadow-premium">
        <span className="text-2xl sm:text-4xl font-serif font-semibold tabular-nums">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs sm:text-sm text-muted-foreground mt-2 uppercase tracking-wider font-medium">
        {label}
      </span>
    </div>
  );

  return (
    <div className="text-center">
      <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4 font-medium">
        Allocation closes in
      </p>
      <div className="flex justify-center gap-2 sm:gap-4">
        <TimeBlock value={timeLeft.days} label="Days" />
        <div className="flex items-start pt-3 sm:pt-4 text-2xl sm:text-4xl font-light text-muted-foreground">:</div>
        <TimeBlock value={timeLeft.hours} label="Hours" />
        <div className="flex items-start pt-3 sm:pt-4 text-2xl sm:text-4xl font-light text-muted-foreground">:</div>
        <TimeBlock value={timeLeft.minutes} label="Mins" />
        <div className="hidden sm:flex items-start pt-3 sm:pt-4 text-2xl sm:text-4xl font-light text-muted-foreground">:</div>
        <div className="hidden sm:block">
          <TimeBlock value={timeLeft.seconds} label="Secs" />
        </div>
      </div>
    </div>
  );
}
