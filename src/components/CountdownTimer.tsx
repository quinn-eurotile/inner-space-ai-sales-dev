import { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const calculateTimeLeft = (endTime: number): TimeLeft | null => {
  const difference = endTime - Date.now();
  
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
  endDate?: string;
  onExpired?: () => void;
}

export function CountdownTimer({ endDate: endDateStr, onExpired }: CountdownTimerProps) {
  const endTime = useMemo(
    () => endDateStr ? new Date(endDateStr).getTime() : Date.now() + 14 * 24 * 60 * 60 * 1000,
    [endDateStr]
  );
  const endDate = useMemo(() => new Date(endTime), [endTime]);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calculateTimeLeft(endTime));
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(endTime);
      setTimeLeft(newTimeLeft);
      
      if (!newTimeLeft) {
        onExpiredRef.current?.();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

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
      <span className="font-serif text-xl sm:text-2xl font-light text-foreground tabular-nums">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground mt-1">
        {label}
      </span>
    </div>
  );

  return (
    <div className="text-center lg:text-left">
      <p className="text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-1">
        Allocation closes {format(endDate, "d MMMM yyyy")}
      </p>
      <div className="flex gap-4 sm:gap-5 justify-center lg:justify-start mt-3">
        <TimeBlock value={timeLeft.days} label="Days" />
        <span className="font-serif text-xl sm:text-2xl font-light text-muted-foreground/40">:</span>
        <TimeBlock value={timeLeft.hours} label="Hrs" />
        <span className="font-serif text-xl sm:text-2xl font-light text-muted-foreground/40">:</span>
        <TimeBlock value={timeLeft.minutes} label="Min" />
        <span className="hidden sm:inline font-serif text-xl sm:text-2xl font-light text-muted-foreground/40">:</span>
        <div className="hidden sm:block">
          <TimeBlock value={timeLeft.seconds} label="Sec" />
        </div>
      </div>
    </div>
  );
}
