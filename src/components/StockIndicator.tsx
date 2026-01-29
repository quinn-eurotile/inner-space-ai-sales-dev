import { useState, useEffect } from 'react';

const INITIAL_STOCK = 38;
const STORAGE_KEY = 'innispace_remaining_stock';

const getStoredStock = (): number => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return parseInt(stored, 10);
  }
  localStorage.setItem(STORAGE_KEY, INITIAL_STOCK.toString());
  return INITIAL_STOCK;
};

export const decrementStock = () => {
  const current = getStoredStock();
  if (current > 0) {
    const newStock = current - 1;
    localStorage.setItem(STORAGE_KEY, newStock.toString());
    window.dispatchEvent(new CustomEvent('stockUpdated', { detail: newStock }));
    return newStock;
  }
  return current;
};

export function StockIndicator() {
  const [remainingStock, setRemainingStock] = useState<number>(getStoredStock);
  
  useEffect(() => {
    const handleStockUpdate = (event: CustomEvent<number>) => {
      setRemainingStock(event.detail);
    };
    
    window.addEventListener('stockUpdated', handleStockUpdate as EventListener);
    return () => window.removeEventListener('stockUpdated', handleStockUpdate as EventListener);
  }, []);

  const percentageRemaining = (remainingStock / INITIAL_STOCK) * 100;
  const isLowStock = remainingStock <= 10;
  const isCriticalStock = remainingStock <= 5;

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex justify-between items-baseline mb-3">
        <div>
          <span className="text-sm text-muted-foreground">Initial allocation: </span>
          <span className="font-medium">{INITIAL_STOCK} pallets</span>
        </div>
        <div className={`font-serif text-2xl font-semibold ${isCriticalStock ? 'text-destructive' : isLowStock ? 'text-warning' : 'text-foreground'}`}>
          {remainingStock} remaining
        </div>
      </div>
      
      <div className="relative h-3 bg-secondary rounded-full overflow-hidden shadow-inner-soft">
        <div 
          className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out rounded-full ${
            isCriticalStock 
              ? 'bg-destructive' 
              : isLowStock 
                ? 'bg-warning' 
                : 'bg-primary'
          }`}
          style={{ width: `${percentageRemaining}%` }}
        />
      </div>
      
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Remaining allocation updates in real time
      </p>
    </div>
  );
}
