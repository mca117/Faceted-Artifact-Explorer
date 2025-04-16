import { Link } from "wouter";
import { Artifact } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface ArtifactCardProps {
  artifact: Artifact;
}

export default function ArtifactCard({ artifact }: ArtifactCardProps) {
  // Get formatted date display
  const getDateDisplay = () => {
    if (!artifact.date_start && !artifact.date_end) return "";
    
    const startYear = artifact.date_start || "?";
    const endYear = artifact.date_end || "?";
    
    // Format BCE dates
    const formatYear = (year: number | string) => {
      if (typeof year === 'number' && year < 0) {
        return `${Math.abs(year)} BCE`;
      } else if (typeof year === 'number' && year > 0) {
        return `${year} CE`;
      }
      return year;
    };
    
    return `${formatYear(startYear)}${startYear !== endYear ? ` - ${formatYear(endYear)}` : ''}`;
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative aspect-square bg-neutral-100">
        {/* Placeholder for when we don't have an image URL yet */}
        <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
          <svg 
            className="w-16 h-16 text-neutral-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
        
        {artifact.has_3d_model && (
          <div className="absolute top-2 right-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
            3D Model
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-serif font-bold text-lg mb-1 line-clamp-1">{artifact.title}</h3>
        <p className="text-sm text-neutral-600 mb-2">
          {artifact.culture && `${artifact.culture}, `}
          {getDateDisplay()}
        </p>
        <p className="text-sm text-neutral-600 line-clamp-2">{artifact.description}</p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        {artifact.materials && artifact.materials.length > 0 && (
          <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
            {artifact.materials[0]}
          </span>
        )}
        <Link href={`/artifacts/${artifact.id}`}>
          <a className="text-primary-500 hover:text-primary-600 text-sm font-medium">
            View Details →
          </a>
        </Link>
      </CardFooter>
    </Card>
  );
}
