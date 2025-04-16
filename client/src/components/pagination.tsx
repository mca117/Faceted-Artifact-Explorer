import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className = ""
}: PaginationProps) {
  const [pages, setPages] = useState<(number | null)[]>([]);
  
  // Calculate page numbers to show
  useEffect(() => {
    const generatePages = () => {
      // Always show first and last page, and up to 5 pages around the current page
      const pageNumbers: (number | null)[] = [];
      
      if (totalPages <= 7) {
        // If there are 7 or fewer pages, show all pages
        for (let i = 1; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Always show first page
        pageNumbers.push(1);
        
        // Calculate start and end of the middle section
        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);
        
        // Adjust to always show 3 pages in the middle
        if (start === 2) {
          end = Math.min(totalPages - 1, start + 2);
        }
        if (end === totalPages - 1) {
          start = Math.max(2, end - 2);
        }
        
        // Add ellipsis before middle section if needed
        if (start > 2) {
          pageNumbers.push(null); // Represents ellipsis
        }
        
        // Add middle section pages
        for (let i = start; i <= end; i++) {
          pageNumbers.push(i);
        }
        
        // Add ellipsis after middle section if needed
        if (end < totalPages - 1) {
          pageNumbers.push(null); // Represents ellipsis
        }
        
        // Always show last page
        pageNumbers.push(totalPages);
      }
      
      setPages(pageNumbers);
    };
    
    generatePages();
  }, [currentPage, totalPages]);
  
  // Prevent rendering if there's only one page
  if (totalPages <= 1) {
    return null;
  }
  
  return (
    <nav className={`flex justify-center ${className}`} aria-label="Pagination">
      <ul className="inline-flex items-center -space-x-px">
        {/* Previous page button */}
        <li>
          <Button
            variant="outline"
            size="icon"
            className="rounded-l-md border border-neutral-200"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <span className="sr-only">Previous</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </li>
        
        {/* Page numbers */}
        {pages.map((page, index) => (
          page === null ? (
            // Ellipsis
            <li key={`ellipsis-${index}`}>
              <span className="relative inline-flex items-center px-4 py-2 border border-neutral-200 bg-white text-sm font-medium text-neutral-700">
                ...
              </span>
            </li>
          ) : (
            // Page number
            <li key={`page-${page}`}>
              <Button
                variant={page === currentPage ? "default" : "outline"}
                className={`
                  rounded-none border border-neutral-200 
                  ${page === currentPage ? 'bg-primary-500 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'}
                `}
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            </li>
          )
        ))}
        
        {/* Next page button */}
        <li>
          <Button
            variant="outline"
            size="icon"
            className="rounded-r-md border border-neutral-200"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <span className="sr-only">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </li>
      </ul>
    </nav>
  );
}
