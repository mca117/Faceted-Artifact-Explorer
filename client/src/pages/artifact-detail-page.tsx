import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Artifact, ArtifactImage, Tag } from "@shared/schema";
import { Loader2, Download, ZoomIn, Layers, Edit } from "lucide-react";
import ImageGallery from "@/components/image-gallery";
import ThreeModelViewer from "@/components/three-model-viewer";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export default function ArtifactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [showModel, setShowModel] = useState(false);
  const { user } = useAuth();
  
  // Fetch artifact data
  const { data, isLoading, isError } = useQuery({
    queryKey: [`/api/artifacts/${id}`],
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
      </div>
    );
  }
  
  if (isError || !data) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-serif font-bold text-primary-600 mb-4">Artifact Not Found</h2>
        <p className="text-neutral-600 mb-6">We couldn't find the artifact you're looking for.</p>
        <button 
          onClick={() => navigate("/")}
          className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }
  
  const { artifact, images, tags } = data as { 
    artifact: Artifact, 
    images: ArtifactImage[],
    tags: Tag[]
  };
  
  const primaryImage = images.find(img => img.is_primary) || images[0];
  
  // Format date display
  const formatDateDisplay = () => {
    if (!artifact.date_start && !artifact.date_end) return "Unknown";
    
    const startYear = artifact.date_start || "?";
    const endYear = artifact.date_end || "?";
    const bceStart = startYear < 0 ? " BCE" : " CE";
    const bceEnd = endYear < 0 ? " BCE" : " CE";
    
    // Convert negative years (BCE) to positive for display
    const displayStart = Math.abs(Number(startYear)) + (startYear < 0 ? bceStart : bceStart);
    const displayEnd = Math.abs(Number(endYear)) + (endYear < 0 ? bceEnd : bceEnd);
    
    if (startYear === endYear) return displayStart;
    return `${displayStart} - ${displayEnd}`;
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Artifact header */}
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-primary-600">{artifact.title}</h1>
          <div className="flex items-center space-x-2">
            {user && (user.id === artifact.user_id || user.role === 'curator' || user.role === 'admin') && (
              <button
                onClick={() => navigate(`/edit-artifact/${artifact.id}`)}
                className="text-primary-500 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 p-2 rounded-full"
                title="Edit artifact"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="text-neutral-500 hover:text-neutral-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row">
          {/* Left side: Images and 3D model */}
          <div className="w-full md:w-1/2 p-4">
            <div className="mb-4 bg-neutral-100 rounded-lg overflow-hidden">
              <ImageGallery images={images} />
            </div>
            
            <div className="mt-4 p-4 border border-neutral-200 rounded-lg">
              <h3 className="font-medium mb-2 text-primary-600">View Options</h3>
              <div className="flex justify-between">
                <button 
                  className="px-3 py-1 flex items-center bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                  onClick={() => document.getElementById('galleryFullscreen')?.click()}
                >
                  <ZoomIn className="w-4 h-4 mr-1" /> ZoomIn
                </button>
                
                {artifact.has_3d_model && (
                  <button 
                    className="px-3 py-1 flex items-center bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200"
                    onClick={() => setShowModel(true)}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                    3D Model
                  </button>
                )}
                
                <button 
                  className="px-3 py-1 flex items-center bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200"
                >
                  <Layers className="w-4 h-4 mr-1" /> Annotations
                </button>
                
                <button 
                  className="px-3 py-1 flex items-center bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200"
                >
                  <Download className="w-4 h-4 mr-1" /> Download
                </button>
              </div>
            </div>
          </div>
          
          {/* Right side: Metadata and details */}
          <div className="w-full md:w-1/2 p-4 bg-neutral-50">
            <div className="mb-6">
              <h3 className="font-serif text-xl font-bold text-primary-600 mb-2">Artifact Details</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-neutral-700 align-top">Object Type:</td>
                    <td className="py-2 text-neutral-900">{artifact.description.split('.')[0]}</td>
                  </tr>
                  
                  {artifact.culture && (
                    <tr>
                      <td className="py-2 pr-4 font-medium text-neutral-700 align-top">Culture:</td>
                      <td className="py-2 text-neutral-900">{artifact.culture}</td>
                    </tr>
                  )}
                  
                  {(artifact.period || artifact.date_start || artifact.date_end) && (
                    <tr>
                      <td className="py-2 pr-4 font-medium text-neutral-700 align-top">Date:</td>
                      <td className="py-2 text-neutral-900">
                        {formatDateDisplay()}
                        {artifact.period && ` (${artifact.period})`}
                      </td>
                    </tr>
                  )}
                  
                  {artifact.materials && artifact.materials.length > 0 && (
                    <tr>
                      <td className="py-2 pr-4 font-medium text-neutral-700 align-top">Material:</td>
                      <td className="py-2 text-neutral-900">{artifact.materials.join(', ')}</td>
                    </tr>
                  )}
                  
                  {artifact.dimensions && (
                    <tr>
                      <td className="py-2 pr-4 font-medium text-neutral-700 align-top">Dimensions:</td>
                      <td className="py-2 text-neutral-900">{artifact.dimensions}</td>
                    </tr>
                  )}
                  
                  {artifact.provenance && (
                    <tr>
                      <td className="py-2 pr-4 font-medium text-neutral-700 align-top">Provenance:</td>
                      <td className="py-2 text-neutral-900">{artifact.provenance}</td>
                    </tr>
                  )}
                  
                  <tr>
                    <td className="py-2 pr-4 font-medium text-neutral-700 align-top">ID Number:</td>
                    <td className="py-2 text-neutral-900">{artifact.id_number}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mb-6">
              <h3 className="font-serif text-xl font-bold text-primary-600 mb-2">Description</h3>
              <p className="text-sm text-neutral-800 leading-relaxed">
                {artifact.description}
              </p>
            </div>
            
            {tags && tags.length > 0 && (
              <div className="mb-6">
                <h3 className="font-serif text-xl font-bold text-primary-600 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge key={tag.id} variant="outline" className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h3 className="font-serif text-xl font-bold text-primary-600 mb-2">Citation</h3>
              <div className="bg-neutral-100 p-3 rounded-lg text-sm font-mono text-neutral-800">
                <p>"{artifact.title}." Faceted Artifact Explorer, ID: {artifact.id_number}. Accessed on {new Date().toLocaleDateString()}.</p>
              </div>
              <div className="mt-2 flex justify-end">
                <button className="px-3 py-1 text-sm bg-neutral-200 text-neutral-700 rounded hover:bg-neutral-300 mr-2">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
                <button className="px-3 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600">
                  <Download className="w-4 h-4 inline mr-1" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 3D Model Viewer */}
      {showModel && (
        <ThreeModelViewer
          artifact={artifact}
          modelUrl={artifact.model_url || ''}
          modelType={artifact.model_type || 'gltf'}
          onClose={() => setShowModel(false)}
        />
      )}
    </div>
  );
}
