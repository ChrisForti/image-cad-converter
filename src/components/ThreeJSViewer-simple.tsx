import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import { YachtFeature } from "../types/index.js";

interface ThreeJSViewerProps {
  features: YachtFeature[];
  isOpen: boolean;
  onClose: () => void;
  canvasWidth: number;
  canvasHeight: number;
}

export function ThreeJSViewer({
  features,
  isOpen,
  onClose,
  canvasWidth,
  canvasHeight,
}: ThreeJSViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [extrusionDepth, setExtrusionDepth] = useState<number>(2);
  const [materialType, setMaterialType] = useState<
    "standard" | "metallic" | "glass"
  >("standard");

  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(15, 10, 15);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create simple 3D geometry from features
    const scale = 0.02;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    features.forEach((feature, index) => {
      const points = feature.points;
      if (points.length < 3) return; // Need at least 3 points for a shape

      try {
        // Create shape from points
        const shape = new THREE.Shape();
        const shapePoints = points.map((p) => ({
          x: (p.x - centerX) * scale,
          y: (p.y - centerY) * scale,
        }));

        shape.moveTo(shapePoints[0].x, shapePoints[0].y);
        for (let i = 1; i < shapePoints.length; i++) {
          shape.lineTo(shapePoints[i].x, shapePoints[i].y);
        }

        // Simple extrusion
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: extrusionDepth,
          bevelEnabled: false,
        });

        // Create material based on type
        let material: THREE.Material;
        const color = [0x4a90e2, 0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4][
          index % 5
        ];

        switch (materialType) {
          case "metallic":
            material = new THREE.MeshStandardMaterial({
              color: color,
              metalness: 0.8,
              roughness: 0.2,
            });
            break;
          case "glass":
            material = new THREE.MeshPhysicalMaterial({
              color: color,
              transmission: 0.9,
              opacity: 0.3,
              transparent: true,
            });
            break;
          default:
            material = new THREE.MeshStandardMaterial({ color: color });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -extrusionDepth / 2;
        scene.add(mesh);
      } catch (error) {
        console.warn("Failed to create 3D geometry:", error);
      }
    });

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Cleanup
    return () => {
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      controls.dispose();
    };
  }, [
    isOpen,
    features,
    canvasWidth,
    canvasHeight,
    extrusionDepth,
    materialType,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-4/5 h-4/5 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">3D CAD Viewer</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex-1 flex">
          <div className="flex-1">
            <div
              ref={mountRef}
              className="w-full h-full bg-gray-900 rounded border"
            />
          </div>

          <div className="w-64 ml-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Extrusion Depth: {extrusionDepth}
              </label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={extrusionDepth}
                onChange={(e) => setExtrusionDepth(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Material Type
              </label>
              <select
                value={materialType}
                onChange={(e) =>
                  setMaterialType(
                    e.target.value as "standard" | "metallic" | "glass"
                  )
                }
                className="w-full p-2 bg-gray-700 text-white rounded"
              >
                <option value="standard">Standard</option>
                <option value="metallic">Metallic</option>
                <option value="glass">Glass</option>
              </select>
            </div>

            <div className="text-sm text-gray-400 mt-4">
              <p>• Mouse: Orbit around model</p>
              <p>• Scroll: Zoom in/out</p>
              <p>• {features.length} features rendered</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
