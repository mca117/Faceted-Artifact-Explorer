import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Search as SearchIcon, X } from "lucide-react";

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export default function SearchBar({ initialQuery = "", onSearch, className = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useLocation();
  const search = useSearch();
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Show suggestions based on query (in a real app, this would call an API)
    if (newQuery.length > 2) {
      // Mock suggestions - in a real app this would be from the API
      setSuggestions([
        `${newQuery} artifacts`,
        `${newQuery} culture`,
        `ancient ${newQuery}`,
        `${newQuery} period`
      ]);
    } else {
      setSuggestions([]);
    }
  };
  
  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim()) {
      if (onSearch) {
        onSearch(query);
      } else {
        // Update URL search params
        const currentParams = new URLSearchParams(search);
        currentParams.set("query", query);
        
        // Navigate to home with search params
        setLocation(`/?${currentParams.toString()}`);
      }
    }
    
    inputRef.current?.blur();
  };
  
  // Clear search
  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };
  
  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search artifacts, cultures, materials..."
            className="w-full px-4 py-2 pr-10 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
          />
          
          {query && (
            <button
              type="button"
              className="absolute right-10 top-2.5 text-neutral-400 hover:text-neutral-600"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          <button
            type="submit"
            className="absolute right-3 top-2 text-neutral-400 hover:text-primary-500"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
      
      {/* Search suggestions */}
      {isFocused && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg">
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 flex items-center"
                  onClick={() => {
                    setQuery(suggestion);
                    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                  }}
                >
                  <SearchIcon className="h-4 w-4 mr-2 text-neutral-400" />
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
