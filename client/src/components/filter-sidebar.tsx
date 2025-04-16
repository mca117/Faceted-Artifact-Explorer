import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FilterSidebarProps {
  cultures: string[];
  setCultures: (cultures: string[]) => void;
  materials: string[];
  setMaterials: (materials: string[]) => void;
  dateRange: [number, number];
  setDateRange: (range: [number, number]) => void;
  has3dModel: boolean;
  setHas3dModel: (has3dModel: boolean) => void;
  applyFilters: () => void;
  resetFilters: () => void;
}

export default function FilterSidebar({
  cultures,
  setCultures,
  materials,
  setMaterials,
  dateRange,
  setDateRange,
  has3dModel,
  setHas3dModel,
  applyFilters,
  resetFilters
}: FilterSidebarProps) {
  const [sliderValue, setSliderValue] = useState<[number]>([dateRange[0]]); // For single value slider
  const [dateDisplay, setDateDisplay] = useState<[string, string]>(['3000 BCE', '2000 CE']);
  const [periodDisplay, setPeriodDisplay] = useState<[string, string]>(['Early Bronze Age', 'Modern']);
  
  // Fetch available cultures
  const { data: availableCultures, isLoading: culturesLoading } = useQuery({
    queryKey: ['/api/cultures'],
  });
  
  // Fetch available materials
  const { data: availableMaterials, isLoading: materialsLoading } = useQuery({
    queryKey: ['/api/materials'],
  });
  
  // Fetch regions for map
  const { data: regions, isLoading: regionsLoading } = useQuery({
    queryKey: ['/api/regions'],
    queryFn: () => {
      // Placeholder since we don't have this API yet
      return Promise.resolve([
        { value: 'mesopotamia', label: 'Mesopotamia', count: 342 },
        { value: 'egypt', label: 'Ancient Egypt', count: 256 },
        { value: 'greece', label: 'Ancient Greece', count: 187 },
        { value: 'rome', label: 'Roman Empire', count: 201 },
        { value: 'mesoamerica', label: 'Mesoamerica', count: 123 }
      ]);
    }
  });
  
  // Helper function to convert year to BCE/CE format
  const formatYear = (year: number): string => {
    if (year < 0) {
      return `${Math.abs(year)} BCE`;
    } else if (year > 0) {
      return `${year} CE`;
    }
    return '0';
  };
  
  // Update date display when slider value changes
  useEffect(() => {
    setDateDisplay([formatYear(dateRange[0]), formatYear(dateRange[1])]);
    
    // Update period display based on date range
    // This is a simplification - in a real app, this would be more sophisticated
    const getPeriod = (year: number): string => {
      if (year < -2500) return 'Early Bronze Age';
      if (year < -1200) return 'Bronze Age';
      if (year < -500) return 'Iron Age';
      if (year < 500) return 'Classical';
      if (year < 1500) return 'Medieval';
      return 'Modern';
    };
    
    setPeriodDisplay([getPeriod(dateRange[0]), getPeriod(dateRange[1])]);
  }, [dateRange]);
  
  // Toggle culture selection
  const toggleCulture = (culture: string) => {
    if (cultures.includes(culture)) {
      setCultures(cultures.filter(c => c !== culture));
    } else {
      setCultures([...cultures, culture]);
    }
  };
  
  // Toggle material selection
  const toggleMaterial = (material: string) => {
    if (materials.includes(material)) {
      setMaterials(materials.filter(m => m !== material));
    } else {
      setMaterials([...materials, material]);
    }
  };
  
  // Handle date slider change
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value as [number]);
    // In a real app, this would be more sophisticated with double-ended slider
    // For simplicity, we're just using a single slider that sets the start date
    setDateRange([value[0], dateRange[1]]);
  };
  
  return (
    <aside className="w-full md:w-64 lg:w-72 md:pr-6 mb-6 md:mb-0 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-md p-5 sticky top-20">
        <h2 className="font-serif text-xl font-bold mb-4 text-primary-600 border-b border-neutral-200 pb-2">Filters</h2>
        
        {/* Time Period Filter */}
        <div className="mb-5">
          <h3 className="font-medium text-neutral-800 mb-2">Time Period</h3>
          <div className="mb-2">
            <div className="flex justify-between text-sm text-neutral-600 mb-1">
              <span>{dateDisplay[0]}</span>
              <span>{dateDisplay[1]}</span>
            </div>
            <Slider 
              defaultValue={[dateRange[0]]} 
              max={2000}
              min={-3000}
              step={100}
              value={sliderValue}
              onValueChange={handleSliderChange}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-xs text-neutral-500">
            <span>{periodDisplay[0]}</span>
            <span>{periodDisplay[1]}</span>
          </div>
        </div>
        
        {/* Location Filter */}
        <div className="mb-5">
          <h3 className="font-medium text-neutral-800 mb-2">Location</h3>
          <div className="h-32 rounded-lg mb-2 relative bg-neutral-200 overflow-hidden">
            {/* This would be replaced with a Leaflet/Mapbox map */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-neutral-600 font-medium">Geographic Filter</span>
            </div>
          </div>
          <select className="w-full border border-neutral-200 rounded-md p-2 text-sm">
            <option value="">All Regions</option>
            {!regionsLoading && regions?.map(region => (
              <option key={region.value} value={region.value}>
                {region.label} ({region.count})
              </option>
            ))}
          </select>
        </div>
        
        {/* Material Filter */}
        <div className="mb-5">
          <h3 className="font-medium text-neutral-800 mb-2">Material</h3>
          
          {materialsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="space-y-2">
              {availableMaterials?.slice(0, 5).map((material: string) => (
                <div key={material} className="flex items-center">
                  <Checkbox 
                    id={`material-${material}`} 
                    checked={materials.includes(material)}
                    onCheckedChange={() => toggleMaterial(material)}
                  />
                  <Label 
                    htmlFor={`material-${material}`}
                    className="ml-2 text-sm text-neutral-700 flex-grow"
                  >
                    {material}
                  </Label>
                  <span className="text-xs text-neutral-500">
                    {/* This would be the count from the API */}
                    {Math.floor(Math.random() * 500)}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {availableMaterials?.length > 5 && (
            <button className="text-primary-500 text-sm mt-1 hover:text-primary-600">
              + Show more
            </button>
          )}
        </div>
        
        {/* Culture Filter */}
        <div className="mb-5">
          <h3 className="font-medium text-neutral-800 mb-2">Culture</h3>
          
          {culturesLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="space-y-2">
              {availableCultures?.slice(0, 5).map((culture: string) => (
                <div key={culture} className="flex items-center">
                  <Checkbox 
                    id={`culture-${culture}`} 
                    checked={cultures.includes(culture)}
                    onCheckedChange={() => toggleCulture(culture)}
                  />
                  <Label 
                    htmlFor={`culture-${culture}`}
                    className="ml-2 text-sm text-neutral-700 flex-grow"
                  >
                    {culture}
                  </Label>
                  <span className="text-xs text-neutral-500">
                    {/* This would be the count from the API */}
                    {Math.floor(Math.random() * 300)}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {availableCultures?.length > 5 && (
            <button className="text-primary-500 text-sm mt-1 hover:text-primary-600">
              + Show more
            </button>
          )}
        </div>
        
        {/* 3D Model Filter */}
        <div className="mb-5">
          <div className="flex items-center">
            <Checkbox 
              id="has-3d-model" 
              checked={has3dModel}
              onCheckedChange={() => setHas3dModel(!has3dModel)}
            />
            <Label 
              htmlFor="has-3d-model"
              className="ml-2 text-sm text-neutral-700"
            >
              Has 3D Model
            </Label>
          </div>
        </div>
        
        <div className="pt-2 border-t border-neutral-200">
          <Button 
            onClick={applyFilters}
            className="w-full mb-2"
          >
            Apply Filters
          </Button>
          <Button 
            variant="outline" 
            onClick={resetFilters}
            className="w-full"
          >
            Reset All
          </Button>
        </div>
      </div>
    </aside>
  );
}
