import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export async function generateThumbnail(file: File, format: string): Promise<Blob | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10000);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(512, 512);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 10, 5);
    scene.add(dirLight);
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight2.position.set(-10, -5, -5);
    scene.add(dirLight2);

    let object: THREE.Object3D;

    switch (format.toUpperCase()) {
      case 'STL': {
        const loader = new STLLoader();
        const geometry = loader.parse(arrayBuffer);
        geometry.computeVertexNormals();
        geometry.center();
        object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
          color: 0x6366f1, metalness: 0.3, roughness: 0.6,
        }));
        break;
      }
      case 'PLY': {
        const loader = new PLYLoader();
        const geometry = loader.parse(arrayBuffer);
        geometry.computeVertexNormals();
        geometry.center();
        const hasColors = geometry.hasAttribute('color');
        object = new THREE.Mesh(geometry, hasColors
          ? new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.1, roughness: 0.8 })
          : new THREE.MeshStandardMaterial({ color: 0x6366f1, metalness: 0.3, roughness: 0.6 })
        );
        break;
      }
      case 'OBJ': {
        const loader = new OBJLoader();
        const text = new TextDecoder().decode(arrayBuffer);
        object = loader.parse(text);
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.computeVertexNormals();
            child.material = new THREE.MeshStandardMaterial({
              color: 0x6366f1, metalness: 0.3, roughness: 0.6,
            });
          }
        });
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        object.position.sub(center);
        break;
      }
      default:
        renderer.dispose();
        return null;
    }

    scene.add(object);

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 1.8;
    camera.position.set(distance * 0.7, distance * 0.5, distance * 0.7);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => {
        renderer.dispose();
        scene.clear();
        resolve(blob);
      }, 'image/png');
    });
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    return null;
  }
}
