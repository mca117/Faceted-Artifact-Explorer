import { Box, Database, Map, Image, History, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-primary-600 mb-6">About the Faceted Artifact Explorer</h1>
        
        <p className="text-lg mb-8 text-neutral-700">
          The Faceted Artifact Explorer is a comprehensive digital platform designed to make archaeological and historical artifacts accessible to researchers, educators, students, and the general public.
        </p>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-medium text-primary-500 mb-4">Our Mission</h2>
          <p className="text-neutral-700 mb-4">
            Our mission is to provide an intuitive and powerful tool for exploring cultural heritage collections, enabling users to discover connections between artifacts across time, geography, and cultures.
          </p>
          <p className="text-neutral-700">
            We aim to democratize access to cultural heritage by making artifacts searchable, filterable, and viewable in both 2D and 3D formats, breaking down barriers between institutions and opening collections to global audiences.
          </p>
        </div>
        
        <div className="space-y-8">
          <h2 className="text-2xl font-medium text-primary-500 mb-4">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-5 border border-neutral-100">
              <div className="flex items-center mb-3">
                <Database className="h-6 w-6 text-primary-500 mr-3" />
                <h3 className="text-lg font-medium">Faceted Search</h3>
              </div>
              <p className="text-neutral-600">
                Filter artifacts by culture, material, time period, and other key attributes to narrow your search and discover specific items.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-5 border border-neutral-100">
              <div className="flex items-center mb-3">
                <Image className="h-6 w-6 text-primary-500 mr-3" />
                <h3 className="text-lg font-medium">High-Quality Images</h3>
              </div>
              <p className="text-neutral-600">
                Explore detailed photographs of artifacts from multiple angles, with zooming capabilities to examine fine details.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-5 border border-neutral-100">
              <div className="flex items-center mb-3">
                <Map className="h-6 w-6 text-primary-500 mr-3" />
                <h3 className="text-lg font-medium">Geographic Mapping</h3>
              </div>
              <p className="text-neutral-600">
                View the geographic distribution of artifacts and explore collections through an interactive map interface.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-5 border border-neutral-100">
              <div className="flex items-center mb-3">
                <History className="h-6 w-6 text-primary-500 mr-3" />
                <h3 className="text-lg font-medium">Chronological Timeline</h3>
              </div>
              <p className="text-neutral-600">
                Place artifacts in their historical context with an interactive timeline that spans from prehistory to modern times.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-5 border border-neutral-100">
              <div className="flex items-center mb-3">
                <Award className="h-6 w-6 text-primary-500 mr-3" />
                <h3 className="text-lg font-medium">Curatorial Insights</h3>
              </div>
              <p className="text-neutral-600">
                Access expert commentary and curatorial notes that provide context and significance for featured artifacts.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-5 border border-neutral-100">
              <div className="flex items-center mb-3">
                <Box className="h-6 w-6 text-primary-500 mr-3" />
                <h3 className="text-lg font-medium">3D Model Viewing</h3>
              </div>
              <p className="text-neutral-600">
                Interact with 3D scans of select artifacts, allowing for a more complete understanding of their form and features.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-primary-50 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-medium text-primary-500 mb-4">Get Involved</h2>
          <p className="text-neutral-700 mb-4">
            The Faceted Artifact Explorer is a collaborative project that welcomes contributions from institutions, researchers, and the public.
          </p>
          <p className="text-neutral-700">
            If you would like to contribute artifacts, expertise, or feedback, please contact us at <a href="mailto:info@facetedartifacts.org" className="text-primary-600 underline">info@facetedartifacts.org</a>.
          </p>
        </div>
      </div>
    </div>
  );
}