import { useState, useRef } from "react";
import { ArtifactImage } from "@shared/schema";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn,
  Download,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageGalleryProps {
  images: ArtifactImage[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPosition, setStartPanPosition] = useState({ x: 0, y: 0 });
  const fullscreenRef = useRef<HTMLDivElement>(null);
  
  // Handle empty images array
  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-neutral-100 flex items-center justify-center">
        <div className="text-center text-neutral-500">
          <svg className="w-16 h-16 mx-auto text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2">No images available</p>
        </div>
      </div>
    );
  }
  
  // Sort images based on primary and sort_order
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.sort_order - b.sort_order;
  });
  
  // Navigate to next image
  const nextImage = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === sortedImages.length - 1 ? 0 : prevIndex + 1
    );
    resetZoomAndPan();
  };
  
  // Navigate to previous image
  const prevImage = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? sortedImages.length - 1 : prevIndex - 1
    );
    resetZoomAndPan();
  };
  
  // Select a thumbnail
  const selectThumbnail = (index: number) => {
    setCurrentIndex(index);
    resetZoomAndPan();
  };
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    resetZoomAndPan();
  };
  
  // Reset zoom and pan
  const resetZoomAndPan = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };
  
  // Zoom in/out
  const handleZoom = (factor: number) => {
    setZoomLevel((prevZoom) => {
      const newZoom = prevZoom + factor;
      // Limit zoom between 1 and 4
      return Math.max(1, Math.min(4, newZoom));
    });
  };
  
  // Handle mouse down for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsPanning(true);
      setStartPanPosition({
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y
      });
    }
  };
  
  // Handle mouse move for panning
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - startPanPosition.x,
        y: e.clientY - startPanPosition.y
      });
    }
  };
  
  // Handle mouse up to stop panning
  const handleMouseUp = () => {
    setIsPanning(false);
  };
  
  // Handle key presses for navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevImage();
    } else if (e.key === 'ArrowRight') {
      nextImage();
    } else if (e.key === 'Escape') {
      if (isFullscreen) {
        setIsFullscreen(false);
        resetZoomAndPan();
      }
    }
  };
  
  return (
    <>
      {/* Main Gallery */}
      <div className="relative">
        <div className="aspect-square bg-neutral-100 flex items-center justify-center overflow-hidden">
          {sortedImages[currentIndex]?.url ? (
            <img 
              src={sortedImages[currentIndex].url} 
              alt={sortedImages[currentIndex].caption || `Image ${currentIndex + 1}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center text-neutral-500">
              <svg className="w-16 h-16 mx-auto text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2">Image not available</p>
            </div>
          )}
          
          {/* Navigation buttons */}
          {sortedImages.length > 1 && (
            <>
              <button 
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                onClick={prevImage}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                onClick={nextImage}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          
          {/* Fullscreen button */}
          <button 
            id="galleryFullscreen"
            className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
            onClick={toggleFullscreen}
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        </div>
        
        {/* Caption */}
        {sortedImages[currentIndex]?.caption && (
          <div className="bg-neutral-100 p-2 text-sm text-neutral-700 text-center">
            {sortedImages[currentIndex].caption}
          </div>
        )}
      </div>
      
      {/* Thumbnails */}
      {sortedImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2 mt-2">
          {sortedImages.map((image, index) => (
            <button
              key={`thumb-${image.id}`}
              className={`aspect-square bg-neutral-100 rounded overflow-hidden ${
                index === currentIndex ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => selectThumbnail(index)}
            >
              {image.url ? (
                <img 
                  src={image.url} 
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
      
      {/* Fullscreen view */}
      {isFullscreen && (
        <div 
          ref={fullscreenRef}
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-full flex flex-col">
            {/* Toolbar */}
            <div className="bg-black bg-opacity-70 p-3 flex justify-between items-center">
              <div className="text-white font-medium">
                Image {currentIndex + 1} of {sortedImages.length}
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:bg-neutral-800"
                  onClick={() => handleZoom(0.5)}
                >
                  <ZoomIn className="h-5 w-5 mr-1" /> Zoom In
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:bg-neutral-800"
                  onClick={() => handleZoom(-0.5)}
                >
                  <ZoomIn className="h-5 w-5 mr-1" /> Zoom Out
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:bg-neutral-800"
                  onClick={resetZoomAndPan}
                >
                  Reset
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:bg-neutral-800"
                >
                  <Download className="h-5 w-5 mr-1" /> Download
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:bg-neutral-800"
                  onClick={toggleFullscreen}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Main image area with zoom */}
            <div 
              className="flex-1 flex items-center justify-center overflow-hidden relative"
              style={{ cursor: zoomLevel > 1 ? 'move' : 'default' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {sortedImages[currentIndex]?.url ? (
                <div 
                  style={{
                    transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                    transition: isPanning ? 'none' : 'transform 0.2s ease-out',
                  }}
                >
                  <img 
                    src={sortedImages[currentIndex].url} 
                    alt={sortedImages[currentIndex].caption || `Image ${currentIndex + 1}`}
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                </div>
              ) : (
                <div className="text-center text-white">
                  <svg className="w-24 h-24 mx-auto text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-4 text-xl">Image not available</p>
                </div>
              )}
              
              {/* Navigation buttons */}
              {sortedImages.length > 1 && (
                <>
                  <button 
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                  <button 
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                </>
              )}
            </div>
            
            {/* Caption */}
            {sortedImages[currentIndex]?.caption && (
              <div className="bg-black bg-opacity-70 p-3 text-white">
                {sortedImages[currentIndex].caption}
              </div>
            )}
            
            {/* Thumbnails */}
            {sortedImages.length > 1 && (
              <div className="bg-black bg-opacity-70 p-3 flex justify-center">
                <div className="flex space-x-2 overflow-x-auto max-w-full py-2">
                  {sortedImages.map((image, index) => (
                    <button
                      key={`fs-thumb-${image.id}`}
                      className={`w-16 h-16 flex-shrink-0 bg-neutral-800 rounded overflow-hidden ${
                        index === currentIndex ? 'ring-2 ring-primary-500' : ''
                      }`}
                      onClick={() => selectThumbnail(index)}
                    >
                      {image.url ? (
                        <img 
                          src={image.url} 
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
