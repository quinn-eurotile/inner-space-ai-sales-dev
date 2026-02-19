import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductStockIndicatorProps {
  productId: string;
  initialAllocation?: number;
  initialSold?: number;
  initialReservedManual?: number;
}

export function ProductStockIndicator({ 
  productId, 
  initialAllocation = 1498, 
  initialSold = 0,
  initialReservedManual = 0
}: ProductStockIndicatorProps) {
  const [stockAllocation, setStockAllocation] = useState(initialAllocation);
  const [stockSold, setStockSold] = useState(initialSold);
  const [stockReservedManual, setStockReservedManual] = useState(initialReservedManual);
  const [stockReservedOnline, setStockReservedOnline] = useState(0);
  
  const fetchReservations = async () => {
    const { data } = await supabase
      .from('reservations')
      .select('required_quantity_sqm')
      .eq('product_id', productId)
      .not('status', 'in', '("released","cancelled","expired","sold")');

    if (data) {
      const total = data.reduce((sum, r) => sum + Number(r.required_quantity_sqm), 0);
      setStockReservedOnline(total);
    }
  };

  useEffect(() => {
    const fetchStock = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('stock_allocation, stock_sold, stock_reserved_manual')
        .eq('id', productId)
        .single();
      
      if (data && !error) {
        setStockAllocation(data.stock_allocation || initialAllocation);
        setStockSold(data.stock_sold || initialSold);
        setStockReservedManual((data as any).stock_reserved_manual || initialReservedManual);
      }
    };

    fetchStock();
    fetchReservations();

    const productChannel = supabase
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
          if ((newData as any).stock_reserved_manual !== undefined) {
            setStockReservedManual((newData as any).stock_reserved_manual);
          }
        }
      )
      .subscribe();

    const reservationsChannel = supabase
      .channel('reservations-stock')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `product_id=eq.${productId}`,
        },
        () => {
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productChannel);
      supabase.removeChannel(reservationsChannel);
    };
  }, [productId, initialAllocation, initialSold]);

  const totalSqm = stockAllocation;
  const soldSqm = stockSold + stockReservedManual + stockReservedOnline;
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
