import { Check, X } from 'lucide-react';

interface TechnicalSpecsProps {
  specs: {
    origin?: string;
    factoryRating?: string;
    tileColour?: string;
    thicknessMm?: number;
    widthMm?: number;
    lengthMm?: number;
    nominalSize?: string;
    finish?: string;
    matchingOutdoorOption?: boolean;
    shape?: string;
    suitability?: string;
    underfloorHeatingCompatible?: boolean;
    tileStyle?: string;
    edge?: string;
    slipRating?: string;
    noTileFaces?: string;
    material?: string;
    frostResistant?: boolean;
    sqmPerTile?: number;
    tilesPerBox?: number;
    sqmPerBox?: number;
    kgPerBox?: number;
    boxesPerPallet?: number;
    sqmPerPallet?: number;
  };
}

export function TechnicalSpecs({ specs }: TechnicalSpecsProps) {
  const renderValue = (value: boolean | string | number | undefined) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-4 w-4 text-foreground" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      );
    }
    return value ?? '—';
  };

  const specItems = [
    { label: 'Origin', value: specs.origin },
    { label: 'Factory Rating', value: specs.factoryRating },
    { label: 'Tile Colour', value: specs.tileColour },
    { label: 'Thickness (mm)', value: specs.thicknessMm },
    { label: 'Width (mm)', value: specs.widthMm },
    { label: 'Length (mm)', value: specs.lengthMm },
    { label: 'Nominal Size (cm)', value: specs.nominalSize },
    { label: 'Finish', value: specs.finish },
    { label: 'Matching Outdoor Option', value: specs.matchingOutdoorOption },
    { label: 'Shape', value: specs.shape },
    { label: 'Suitability', value: specs.suitability },
    { label: 'Underfloor Heating Compatible', value: specs.underfloorHeatingCompatible },
    { label: 'Tile Style', value: specs.tileStyle },
    { label: 'Edge', value: specs.edge },
    { label: 'Slip Rating', value: specs.slipRating },
    { label: 'No. Tile Faces', value: specs.noTileFaces },
    { label: 'Material', value: specs.material },
    { label: 'Frost Resistant', value: specs.frostResistant },
    { label: 'SQ.M Per Tile', value: specs.sqmPerTile },
    { label: 'Tiles Per Box', value: specs.tilesPerBox },
    { label: 'SQ.M Per Box', value: specs.sqmPerBox },
    { label: 'KG Per Box', value: specs.kgPerBox },
    { label: 'Boxes Per Pallet', value: specs.boxesPerPallet },
    { label: 'SQ.M Per Pallet', value: specs.sqmPerPallet },
  ];

  return (
    <div>
      <h2 className="font-serif text-h2 sm:text-h2-lg font-light text-foreground mb-8">
        Technical Specification
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12">
        {specItems.map((item) => (
          <div
            key={item.label}
            className="flex justify-between items-center py-3 border-b border-border gap-4"
          >
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="text-sm text-foreground flex items-center">
              {renderValue(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
