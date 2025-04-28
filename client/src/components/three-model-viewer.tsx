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

export default function ThreeModelViewer({
  artifact,
  modelUrl,
  modelType,
  onClose,
}: ThreeModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Determine if this is a Clara.io embed
  const isIframe = modelUrl.includes("clara.io/embed");

  useEffect(() => {
    // Skip Three.js setup if using an iframe
    if (isIframe) {
      return;
    }
    if (!containerRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x12262e);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(1, 1, 1);
    scene.add(dirLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    containerRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Model loading
    const loadModel = () => {
      const manager = new THREE.LoadingManager();
      manager.onError = (url) => {
        setError(`Failed to load model: ${url}`);
        setIsLoading(false);
      };

      if (modelType.toLowerCase() === "gltf" || modelType.toLowerCase() === "glb") {
        new GLTFLoader(manager).load(
          modelUrl,
          (gltf) => {
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            gltf.scene.position.sub(center);
            const maxDim = Math.max(size.x, size.y, size.z);
            camera.position.z = maxDim * 2;
            controls.target.set(0, 0, 0);
            controls.update();
            scene.add(gltf.scene);
            setIsLoading(false);
          },
          undefined,
          (err) => {
            setError(`Failed to load GLTF: ${err.message}`);
            setIsLoading(false);
          }
        );
      } else if (modelType.toLowerCase() === "obj") {
        const mtlLoader = new MTLLoader(manager);
        const objLoader = new OBJLoader(manager);
        const baseUrl = modelUrl.replace(/\.[^.]+$/, "");
        mtlLoader.load(
          `${baseUrl}.mtl`,
          (mtl) => {
            mtl.preload();
            objLoader.setMaterials(mtl);
            objLoader.load(
              modelUrl,
              (obj) => {
                const box = new THREE.Box3().setFromObject(obj);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                obj.position.sub(center);
                const maxDim = Math.max(size.x, size.y, size.z);
                camera.position.z = maxDim * 2;
                controls.target.set(0, 0, 0);
                controls.update();
                scene.add(obj);
                setIsLoading(false);
              },
              undefined,
              (err) => {
                setError(`Failed to load OBJ: ${err.message}`);
                setIsLoading(false);
              }
            );
          },
          undefined,
          () => {
            objLoader.load(
              modelUrl,
              (obj) => {
                scene.add(obj);
                setIsLoading(false);
              },
              undefined,
              (err) => {
                setError(`Failed to load OBJ: ${err.message}`);
                setIsLoading(false);
              }
            );
          }
        );
      } else {
        setError(`Unsupported model type: ${modelType}`);
        setIsLoading(false);
      }
    };

    loadModel();

    // Handle resize
    const onResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };
    window.addEventListener("resize", onResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", onResize);
      if (renderer && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [modelUrl, modelType, isIframe]);

  // Render iframe if Clara URL
  if (isIframe) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-neutral-900 rounded-lg w-full max-w-4xl h-[80vh] overflow-hidden">
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
          <iframe
            title={`3D Model: ${artifact.title}`}
            src={modelUrl}
            className="w-full h-full border-0"
            allow="fullscreen; vr"
          />
        </div>
      </div>
    );
  }

  // Render Three.js canvas
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
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-10">
              <Loader2 className="h-12 w-12 text-primary-500 animate-spin mb-4" />
              <p className="text-white">Loading 3D Model...</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-10">
              <div className="text-white text-center p-8">
                <svg
                  className="w-16 h-16 mx-auto text-red-500 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856…"
                  />
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
                  controlsRef.current!.autoRotate = !controlsRef.current!.autoRotate;
                }}
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
                onClick={() => {
                  cameraRef.current!.position.set(0, 0, 5);
                  controlsRef.current!.target.set(0, 0, 0);
                  controlsRef.current!.update();
                }}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
                onClick={() => {
                  sceneRef.current!.traverse((obj) => {
                    if (obj instanceof THREE.Mesh) {
                      (obj.material as any).wireframe = !(obj.material as any).wireframe;
                    }
                  });
                }}
              >
                <Contrast className="h-5 w-5" />
              </Button>
            </div>
            <Button className="bg-primary-500 hover:bg-primary-600">
              <Download className="h-5 w-5 mr-2" />
              Download Model
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
