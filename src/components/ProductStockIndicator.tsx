import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductStockIndicatorProps {
  productId: string;
  initialAllocation?: number;
  initialSold?: number;
}

export function ProductStockIndicator({ 
  productId, 
  initialAllocation = 38, 
  initialSold = 0 
}: ProductStockIndicatorProps) {
  const [stockAllocation, setStockAllocation] = useState(initialAllocation);
  const [stockSold, setStockSold] = useState(initialSold);
  
  useEffect(() => {
    // Fetch current stock from database
    const fetchStock = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('stock_allocation, stock_sold')
        .eq('id', productId)
        .single();
      
      if (data && !error) {
        setStockAllocation(data.stock_allocation || initialAllocation);
        setStockSold(data.stock_sold || initialSold);
      }
    };

    fetchStock();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('product-stock')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${productId}`,
        },
        (payload) => {
          const newData = payload.new as { stock_allocation?: number; stock_sold?: number };
          if (newData.stock_allocation !== undefined) {
            setStockAllocation(newData.stock_allocation);
          }
          if (newData.stock_sold !== undefined) {
            setStockSold(newData.stock_sold);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, initialAllocation, initialSold]);

  // Convert pallets to sq.m (assuming ~39.42 sqm per pallet based on product spec)
  const SQM_PER_PALLET = 39.42;
  const totalSqm = stockAllocation * SQM_PER_PALLET;
  const soldSqm = stockSold * SQM_PER_PALLET;
  const remainingSqm = totalSqm - soldSqm;
  
  const percentageRemaining = totalSqm > 0 ? (remainingSqm / totalSqm) * 100 : 0;
  const isLowStock = remainingSqm <= 400;
  const isCriticalStock = remainingSqm <= 200;

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex justify-between items-baseline mb-3">
        <div>
          <span className="text-sm text-muted-foreground">Initial allocation: </span>
          <span className="font-medium">{Math.round(totalSqm).toLocaleString()} SQ.M</span>
        </div>
        <div className={`text-2xl font-bold ${
          isCriticalStock ? 'text-destructive' : isLowStock ? 'text-primary' : 'text-foreground'
        }`}>
          {Math.round(remainingSqm).toLocaleString()} SQ.M remaining
        </div>
      </div>
      
      <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
        <div 
          className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out rounded-full ${
            isCriticalStock 
              ? 'bg-destructive' 
              : isLowStock 
                ? 'bg-primary' 
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
