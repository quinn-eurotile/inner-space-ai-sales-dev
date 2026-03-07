import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StockBannerProps {
  productId: string;
  stockAllocation: number;
  stockSold: number;
  sqmPerPallet?: number;
}

export function StockBanner({ productId, stockAllocation, stockSold: initialSold, sqmPerPallet }: StockBannerProps) {
  const [sold, setSold] = useState(initialSold);
  const [reserved, setReserved] = useState(0);
  const [manualReserved, setManualReserved] = useState(0);

  useEffect(() => {
    supabase
      .from('reservations')
      .select('required_quantity_sqm')
      .eq('product_id', productId)
      .not('status', 'in', '("released","cancelled","expired","sold")')
      .then(({ data }) => {
        if (data) setReserved(data.reduce((s, r) => s + Number(r.required_quantity_sqm), 0));
      });

    supabase
      .from('products')
      .select('stock_sold, stock_reserved_manual')
      .eq('id', productId)
      .single()
      .then(({ data }) => {
        if (data) {
          setSold(data.stock_sold || 0);
          setManualReserved((data as any).stock_reserved_manual || 0);
        }
      });
  }, [productId]);

  const remaining = Math.round(stockAllocation - sold - manualReserved - reserved);
  const pallets = Math.floor(remaining / 57.12);

  return (
    <div className="bg-foreground text-background py-2 px-4 text-center">
      <p className="text-xs sm:text-sm tracking-wide">
        <span className="font-semibold">{pallets > 0 ? `${pallets} pallets remaining` : 'Limited stock'}</span>
        <span className="mx-2 opacity-40 hidden sm:inline">·</span>
        <span className="opacity-60 hidden sm:inline">{Math.max(0, remaining).toLocaleString()} sq.m</span>
      </p>
    </div>
  );
}
