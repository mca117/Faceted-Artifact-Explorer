import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { Artifact } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2, X, Download, RefreshCw, Contrast, ZoomIn } from "lucide-react";

interface ThreeModelViewerProps {
  artifact: Artifact;
  modelUrl: string;
  modelType: string;
  onClose: () => void;
}

export default function ThreeModelViewer({ artifact, modelUrl, modelType, onClose }: ThreeModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  useEffect(() => {
    // Initialize Three.js scene
    if (!containerRef.current) return;
    
    try {
      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color(0x12262E);
      
      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);
      
      const pointLight = new THREE.PointLight(0xffffff, 1);
      pointLight.position.set(0, 5, 0);
      scene.add(pointLight);
      
      // Create camera
      const camera = new THREE.PerspectiveCamera(
        45, 
        containerRef.current.clientWidth / containerRef.current.clientHeight, 
        0.1, 
        1000
      );
      cameraRef.current = camera;
      camera.position.z = 5;
      
      // Create renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      rendererRef.current = renderer;
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.outputEncoding = THREE.sRGBEncoding;
      containerRef.current.appendChild(renderer.domElement);
      
      // Add controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controlsRef.current = controls;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      
      // Load model based on type
      if (modelUrl) {
        loadModel(modelUrl, modelType, scene);
      } else {
        setError("No model URL provided");
        setIsLoading(false);
      }
      
      // Handle resize
      const handleResize = () => {
        if (!containerRef.current || !camera || !renderer) return;
        
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        
        if (rendererRef.current && cameraRef.current && sceneRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      
      animate();
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        
        if (containerRef.current && rendererRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
      };
    } catch (err) {
      console.error("Error initializing Three.js:", err);
      setError("Failed to initialize 3D viewer");
      setIsLoading(false);
    }
  }, [modelUrl, modelType]);
  
  // Load the 3D model
  const loadModel = (url: string, type: string, scene: THREE.Scene) => {
    setIsLoading(true);
    
    // Create a loading manager to track progress
    const manager = new THREE.LoadingManager();
    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      console.log(`Loading file: ${url}, ${itemsLoaded}/${itemsTotal}`);
    };
    
    manager.onError = (url) => {
      console.error(`Error loading: ${url}`);
      setError(`Failed to load model: ${url}`);
      setIsLoading(false);
    };
    
    // Load model based on type
    if (type.toLowerCase() === 'gltf' || type.toLowerCase() === 'glb') {
      const loader = new GLTFLoader(manager);
      
      loader.load(
        url,
        (gltf) => {
          // Center model
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          // Reset model position to center
          gltf.scene.position.x = -center.x;
          gltf.scene.position.y = -center.y;
          gltf.scene.position.z = -center.z;
          
          // Adjust camera and controls to fit model
          const maxDim = Math.max(size.x, size.y, size.z);
          if (cameraRef.current) {
            cameraRef.current.position.z = maxDim * 2;
          }
          
          if (controlsRef.current) {
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
          }
          
          scene.add(gltf.scene);
          setIsLoading(false);
        },
        undefined,
        (error) => {
          console.error('Error loading GLTF model:', error);
          setError(`Failed to load 3D model: ${error.message}`);
          setIsLoading(false);
        }
      );
    } else if (type.toLowerCase() === 'obj') {
      // Try to load materials if available
      const mtlLoader = new MTLLoader(manager);
      const objLoader = new OBJLoader(manager);
      
      // Extract base URL and file name without extension
      const urlParts = url.split('.');
      urlParts.pop();
      const mtlUrl = `${urlParts.join('.')}.mtl`;
      
      // Try to load materials first, then the object
      mtlLoader.load(
        mtlUrl,
        (materials) => {
          materials.preload();
          objLoader.setMaterials(materials);
          loadOBJ(objLoader, url, scene);
        },
        undefined,
        () => {
          // If MTL fails, just load the OBJ without materials
          loadOBJ(objLoader, url, scene);
        }
      );
    } else {
      setError(`Unsupported model type: ${type}`);
      setIsLoading(false);
    }
  };
  
  // Helper for loading OBJ models
  const loadOBJ = (objLoader: OBJLoader, url: string, scene: THREE.Scene) => {
    objLoader.load(
      url,
      (object) => {
        // Center model
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Reset model position to center
        object.position.x = -center.x;
        object.position.y = -center.y;
        object.position.z = -center.z;
        
        // Adjust camera and controls to fit model
        const maxDim = Math.max(size.x, size.y, size.z);
        if (cameraRef.current) {
          cameraRef.current.position.z = maxDim * 2;
        }
        
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
        
        scene.add(object);
        setIsLoading(false);
      },
      undefined,
      (error) => {
        console.error('Error loading OBJ model:', error);
        setError(`Failed to load 3D model: ${error.message}`);
        setIsLoading(false);
      }
    );
  };
  
  // Reset camera view
  const resetView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 0, 5);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };
  
  // Toggle wireframe mode
  const toggleWireframe = () => {
    if (sceneRef.current) {
      sceneRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.material.wireframe = !object.material.wireframe;
        }
      });
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-700 flex justify-between items-center">
          <h2 className="font-serif text-xl font-bold text-white">
            3D Model: {artifact.title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-400 hover:text-white"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <div 
          ref={containerRef} 
          className="flex-1 relative h-[70vh] bg-gradient-to-b from-primary-900 to-neutral-900 flex items-center justify-center"
        >
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-10">
              <Loader2 className="h-12 w-12 text-primary-500 animate-spin mb-4" />
              <p className="text-white">Loading 3D Model...</p>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-10">
              <div className="text-white text-center p-8">
                <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-xl font-bold mb-2">Error Loading Model</h3>
                <p className="text-neutral-300">{error}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-neutral-800 p-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
                onClick={() => {
                  if (controlsRef.current) {
                    controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
                  }
                }}
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
                onClick={resetView}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
                onClick={toggleWireframe}
              >
                <Contrast className="h-5 w-5" />
              </Button>
            </div>
            <div>
              <Button
                className="bg-primary-500 hover:bg-primary-600"
              >
                <Download className="h-5 w-5 mr-2" />
                Download Model
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
