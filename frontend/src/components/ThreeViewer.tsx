import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Center, Environment, Grid } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';
import { Loader2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface ThreeViewerProps {
  fileUrl: string;
  fileFormat: string;
}

function STLModel({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url);

  useEffect(() => {
    geometry.computeVertexNormals();
    geometry.center();
  }, [geometry]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#6366f1" metalness={0.3} roughness={0.6} />
    </mesh>
  );
}

function PLYModel({ url }: { url: string }) {
  const geometry = useLoader(PLYLoader, url);

  useEffect(() => {
    geometry.computeVertexNormals();
    geometry.center();
  }, [geometry]);

  const hasColors = geometry.hasAttribute('color');

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      {hasColors ? (
        <meshStandardMaterial vertexColors metalness={0.1} roughness={0.8} />
      ) : (
        <meshStandardMaterial color="#6366f1" metalness={0.3} roughness={0.6} />
      )}
    </mesh>
  );
}

function OBJModel({ url }: { url: string }) {
  const obj = useLoader(OBJLoader, url);

  useEffect(() => {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.computeVertexNormals();
        child.material = new THREE.MeshStandardMaterial({
          color: '#6366f1',
          metalness: 0.3,
          roughness: 0.6,
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    obj.position.sub(center);
  }, [obj]);

  return <primitive object={obj} />;
}

function Model({ url, format }: { url: string; format: string }) {
  switch (format) {
    case 'STL':
      return <STLModel url={url} />;
    case 'PLY':
      return <PLYModel url={url} />;
    case 'OBJ':
      return <OBJModel url={url} />;
    default:
      return null;
  }
}

function SceneContent({ url, format }: { url: string; format: string }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      <Center>
        <Model url={url} format={format} />
      </Center>

      <Grid
        position={[0, -2, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#d1d5db"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#9ca3af"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
      />

      <OrbitControls
        makeDefault
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={50}
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-2" />
        <p className="text-gray-600">3Dモデルを読み込み中...</p>
      </div>
    </div>
  );
}

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-600">
          <p className="font-medium">3Dモデルの読み込みに失敗しました</p>
          <p className="text-sm">ファイルが破損しているか、対応していない形式です</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function ThreeViewer({ fileUrl, fileFormat }: ThreeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [key, setKey] = useState(0);

  const resetView = () => {
    setKey((prev) => prev + 1);
  };

  return (
    <div ref={containerRef} className="relative h-96 bg-gray-100">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button
          onClick={resetView}
          className="p-2 bg-white rounded-lg shadow hover:bg-gray-100 transition-colors"
          title="ビューをリセット"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
        ドラッグで回転 / スクロールでズーム / Shift+ドラッグで移動
      </div>

      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            key={key}
            shadows
            camera={{ position: [5, 5, 5], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
          >
            <SceneContent url={fileUrl} format={fileFormat} />
          </Canvas>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
