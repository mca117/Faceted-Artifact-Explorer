import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import FilterSidebar from "@/components/filter-sidebar";
import ArtifactCard from "@/components/artifact-card";
import Pagination from "@/components/pagination";
import FilterTag from "@/components/filter-tag";
import { Artifact } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useSearch } from "wouter";
import { ArtifactSearchResult } from "@/lib/types";

export default function HomePage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  
  const [searchQuery, setSearchQuery] = useState(params.get("query") || "");
  const [cultures, setCultures] = useState<string[]>(params.get("cultures")?.split(",").filter(Boolean) || []);
  const [materials, setMaterials] = useState<string[]>(params.get("materials")?.split(",").filter(Boolean) || []);
  const [dateRange, setDateRange] = useState<[number, number]>([
    parseInt(params.get("dateStart") || "-3000"), 
    parseInt(params.get("dateEnd") || "2000")
  ]);
  const [has3dModel, setHas3dModel] = useState(params.get("has3dModel") === "true");
  const [sortOption, setSortOption] = useState(params.get("sort") || "relevance");
  const [currentPage, setCurrentPage] = useState(parseInt(params.get("page") || "1"));
  
  // Build query string for API request
  const buildQueryString = () => {
    const queryParams = new URLSearchParams();
    
    if (searchQuery) queryParams.append("query", searchQuery);
    if (cultures.length > 0) queryParams.append("cultures", cultures.join(","));
    if (materials.length > 0) queryParams.append("materials", materials.join(","));
    if (dateRange[0] !== -3000) queryParams.append("dateStart", dateRange[0].toString());
    if (dateRange[1] !== 2000) queryParams.append("dateEnd", dateRange[1].toString());
    if (has3dModel) queryParams.append("has3dModel", "true");
    if (sortOption !== "relevance") queryParams.append("sort", sortOption);
    if (currentPage !== 1) queryParams.append("page", currentPage.toString());
    
    return queryParams.toString();
  };
  
  // Fetch artifacts based on filters
  const { data, isLoading, isError } = useQuery<ArtifactSearchResult>({
    queryKey: [`/api/search?${buildQueryString()}`],
  });
  
  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setCultures([]);
    setMaterials([]);
    setDateRange([-3000, 2000]);
    setHas3dModel(false);
    setSortOption("relevance");
    setCurrentPage(1);
  };
  
  // Remove a specific filter
  const removeFilter = (type: string, value: string) => {
    switch (type) {
      case "culture":
        setCultures(cultures.filter(c => c !== value));
        break;
      case "material":
        setMaterials(materials.filter(m => m !== value));
        break;
      case "dateRange":
        setDateRange([-3000, 2000]);
        break;
      case "has3dModel":
        setHas3dModel(false);
        break;
    }
  };
  
  // When page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row">
      {/* Filter Sidebar */}
      <FilterSidebar 
        cultures={cultures}
        setCultures={setCultures}
        materials={materials}
        setMaterials={setMaterials}
        dateRange={dateRange}
        setDateRange={setDateRange}
        has3dModel={has3dModel}
        setHas3dModel={setHas3dModel}
        applyFilters={applyFilters}
        resetFilters={resetFilters}
      />
      
      <div className="flex-1">
        {/* Results Header */}
        <div className="bg-white rounded-lg shadow-md p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <h2 className="font-serif text-2xl font-bold text-primary-600">
              Artifacts 
              {!isLoading && data && (
                <span className="text-neutral-500 font-sans text-base font-normal ml-2">
                  ({data.pagination?.total || 0} results)
                </span>
              )}
            </h2>
            <div className="mt-2 sm:mt-0 flex items-center space-x-2">
              <span className="text-sm text-neutral-600">Sort by:</span>
              <select 
                className="border border-neutral-200 rounded-md p-1 text-sm"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="relevance">Relevance</option>
                <option value="date_asc">Date (Oldest)</option>
                <option value="date_desc">Date (Newest)</option>
                <option value="az">Name (A-Z)</option>
              </select>
            </div>
          </div>
          
          {/* Active Filters */}
          {(cultures.length > 0 || materials.length > 0 || dateRange[0] !== -3000 || dateRange[1] !== 2000 || has3dModel) && (
            <div className="flex flex-wrap gap-2">
              {cultures.map(culture => (
                <FilterTag 
                  key={`culture-${culture}`}
                  label={culture}
                  onRemove={() => removeFilter("culture", culture)}
                />
              ))}
              
              {materials.map(material => (
                <FilterTag 
                  key={`material-${material}`}
                  label={material}
                  onRemove={() => removeFilter("material", material)}
                />
              ))}
              
              {(dateRange[0] !== -3000 || dateRange[1] !== 2000) && (
                <FilterTag 
                  label={`${dateRange[0]}-${dateRange[1]}`}
                  onRemove={() => removeFilter("dateRange", "")}
                />
              )}
              
              {has3dModel && (
                <FilterTag 
                  label="Has 3D Model"
                  onRemove={() => removeFilter("has3dModel", "")}
                />
              )}
            </div>
          )}
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
          </div>
        )}
        
        {/* Error State */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error loading artifacts</h3>
            <p className="text-red-600">There was a problem retrieving the artifact data. Please try again later.</p>
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && !isError && data && data.artifacts && data.artifacts.length === 0 && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium text-neutral-800 mb-2">No artifacts found</h3>
            <p className="text-neutral-600 mb-4">Try adjusting your filters or search query to find artifacts.</p>
            <button 
              onClick={resetFilters}
              className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}
        
        {/* Artifacts Grid */}
        {!isLoading && !isError && data && data.artifacts && data.artifacts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.artifacts.map((artifact: Artifact) => (
              <ArtifactCard key={artifact.id} artifact={artifact} />
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {!isLoading && !isError && data && data.pagination && data.pagination.totalPages > 1 && (
          <div className="mt-8">
            <Pagination 
              currentPage={currentPage}
              totalPages={data.pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
