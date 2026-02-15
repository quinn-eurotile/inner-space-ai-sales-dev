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

  const SQM_PER_PALLET = 39.42;
  const totalSqm = stockAllocation * SQM_PER_PALLET;
  const soldSqm = stockSold * SQM_PER_PALLET;
  const remainingSqm = totalSqm - soldSqm;

  return (
    <div className="w-full max-w-xl mx-auto text-center">
      <p className="section-label section-label--center">Allocation Overview</p>
      
      <div className="flex justify-center gap-14 sm:gap-20">
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2">
            Initial Allocation
          </p>
          <p className="font-serif text-xl font-light text-muted-foreground tabular-nums">
            {Math.round(totalSqm).toLocaleString()} sq.m
          </p>
        </div>
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2">
            Remaining
          </p>
          <p className="font-serif text-3xl font-light text-foreground tabular-nums">
            {Math.round(remainingSqm).toLocaleString()} sq.m
          </p>
          <div className="w-10 h-[2px] bg-brand-accent mx-auto mt-2" />
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mt-6 mb-6">
        Updated in real time based on confirmed reservations.
      </p>
    </div>
  );
}
