import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Check, Truck, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryZone {
  id: string;
  tier_code: string;
  tier_label: string;
  surcharge_type: string;
  surcharge_per_sqm: number;
  luxury_message: string;
}

interface PostcodeResult {
  zone: DeliveryZone;
  matchedRuleId: string | null;
}

interface PostcodeCheckerProps {
  defaultSqm?: number;
  onResult?: (result: PostcodeResult | null) => void;
  compact?: boolean;
}

function extractPostcodeParts(postcode: string) {
  const normalized = postcode.toUpperCase().replace(/\s/g, '');
  // UK postcode: outward code = everything except last 3 chars
  const outward = normalized.length > 3 ? normalized.slice(0, -3) : normalized;
  const area = outward.match(/^[A-Z]+/)?.[0] || '';
  const district = outward; // e.g. SW6, EC1, W1
  return { normalized, area, district };
}

function getUtmParams() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
    utm_content: params.get('utm_content') || null,
  };
}

// Placeholder tracking function
function trackEvent(eventName: string, data?: Record<string, unknown>) {
  console.log(`[Track] ${eventName}`, data);
}

export function PostcodeChecker({ defaultSqm = 57, onResult, compact = false }: PostcodeCheckerProps) {
  const [postcode, setPostcode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<PostcodeResult | null>(null);
  const [estimatedSqm, setEstimatedSqm] = useState(defaultSqm);
  const [showEstimator, setShowEstimator] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPostcode = async () => {
    if (!postcode.trim()) return;
    setIsChecking(true);
    setError(null);
    setResult(null);

    const { normalized, area, district } = extractPostcodeParts(postcode);
    const utms = getUtmParams();

    try {
      // Fetch all active rules with their zones
      const { data: rules, error: rulesError } = await supabase
        .from('postcode_rules')
        .select('id, match_type, pattern, zone_id, priority')
        .eq('active', true)
        .order('priority', { ascending: false });

      if (rulesError) throw rulesError;

      // Match: DISTRICT first, then AREA, by priority (already sorted desc)
      let matchedRule: typeof rules[0] | null = null;

      // Try district match first
      for (const rule of rules || []) {
        if (rule.match_type === 'DISTRICT' && rule.pattern === district) {
          matchedRule = rule;
          break;
        }
      }

      // Then area match
      if (!matchedRule) {
        for (const rule of rules || []) {
          if (rule.match_type === 'AREA' && rule.pattern === area) {
            matchedRule = rule;
            break;
          }
        }
      }

      // Get zone - either matched or default to Tier S
      let zone: DeliveryZone;
      if (matchedRule) {
        const { data: zoneData } = await supabase
          .from('delivery_zones')
          .select('*')
          .eq('id', matchedRule.zone_id)
          .single();
        zone = zoneData!;
      } else {
        // Default to Tier S
        const { data: defaultZone } = await supabase
          .from('delivery_zones')
          .select('*')
          .eq('tier_code', 'S')
          .single();
        zone = defaultZone!;
      }

      const postcodeResult: PostcodeResult = {
        zone,
        matchedRuleId: matchedRule?.id || null,
      };

      setResult(postcodeResult);
      onResult?.(postcodeResult);

      // Log the check
      await supabase.from('postcode_checks').insert({
        raw_postcode_input: postcode,
        normalized_postcode: normalized,
        extracted_area: area,
        extracted_district: district,
        matched_rule_id: matchedRule?.id || null,
        zone_id: zone.id,
        ...utms,
      });

      // Track events
      trackEvent('postcode_check_success', { tier: zone.tier_code, postcode: normalized });
      trackEvent(`postcode_check_tier_${zone.tier_code}`, { postcode: normalized });

    } catch (err) {
      console.error('Postcode check error:', err);
      setError('Unable to check postcode. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      checkPostcode();
    }
  };

  const zone = result?.zone;
  const isTierS = zone?.tier_code === 'S';
  const isTierQ = zone?.tier_code === 'quote_required' || zone?.surcharge_type === 'quote_required';
  const hasSurcharge = zone && !isTierS && !isTierQ;

  return (
    <div className={compact ? "w-full" : "w-full max-w-lg mx-auto"}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter your postcode (e.g. SW6 2AB)"
            value={postcode}
            onChange={(e) => {
              setPostcode(e.target.value);
              setResult(null);
              setError(null);
              onResult?.(null);
            }}
            onKeyDown={handleKeyDown}
            className="pl-10 h-12 text-base bg-background border-border focus:border-primary"
          />
        </div>
        <Button
          onClick={checkPostcode}
          disabled={!postcode.trim() || isChecking}
          className="h-12 px-6"
        >
          {isChecking ? 'Checking...' : 'Check Delivery'}
        </Button>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {zone && (
        <div className="mt-4 animate-fade-in">
          {/* Tier result card */}
          <div className={`p-4 rounded-lg border ${isTierS ? 'bg-success/10 border-success/20' : isTierQ ? 'bg-primary/10 border-primary/20' : 'bg-secondary/50 border-border'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isTierS ? 'bg-success/20' : isTierQ ? 'bg-primary/20' : 'bg-secondary'}`}>
                {isTierS ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Truck className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-semibold text-sm ${isTierS ? 'text-success' : 'text-foreground'}`}>
                  {zone.tier_label}
                </p>
                {hasSurcharge && (
                  <p className="text-lg font-bold text-foreground mt-1">
                    +£{Number(zone.surcharge_per_sqm).toFixed(2)} per m²
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {zone.luxury_message}
                </p>
              </div>
            </div>
          </div>

          {/* Estimated cost calculator for surcharge tiers */}
          {hasSurcharge && (
            <div className="mt-3 p-3 bg-secondary/30 border border-border rounded-lg">
              <button
                type="button"
                onClick={() => setShowEstimator(!showEstimator)}
                className="text-xs font-medium text-primary hover:underline underline-offset-2"
              >
                {showEstimator ? 'Hide' : 'Show'} estimated delivery surcharge
              </button>
              {showEstimator && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">Estimated m²:</label>
                    <Input
                      type="number"
                      min={1}
                      value={estimatedSqm}
                      onChange={(e) => setEstimatedSqm(Number(e.target.value) || 0)}
                      className="h-8 w-24 text-sm"
                    />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {estimatedSqm} m² × £{Number(zone.surcharge_per_sqm).toFixed(2)} ={' '}
                    <span className="text-primary font-bold">
                      £{(estimatedSqm * Number(zone.surcharge_per_sqm)).toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-3 text-center">
        Delivery tariffs are pass-through logistics costs based on your delivery postcode.
      </p>
    </div>
  );
}
