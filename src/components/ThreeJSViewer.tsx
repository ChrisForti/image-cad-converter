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
  const [viewMode, setViewMode] = useState<"2D" | "3D">("3D");
  const [extrusionDepth, setExtrusionDepth] = useState<number>(2);
  const [materialType, setMaterialType] = useState<
    "standard" | "metallic" | "glass"
  >("standard");

  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    // Camera setup - different for 2D vs 3D
    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);

    if (viewMode === "2D") {
      // Top-down view for 2D mode
      camera.position.set(0, 20, 0.1);
      camera.lookAt(0, 0, 0);
    } else {
      // 3D perspective view
      camera.position.set(15, 10, 15);
      camera.lookAt(0, 0, 0);
    }

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

    // Create geometry based on view mode
    const scale = 0.02;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    features.forEach((feature, index) => {
      const points = feature.points;
      if (points.length < 2) return;

      if (viewMode === "2D") {
        // 2D mode: flat lines at y=0
        create2DLines(points, scene, scale, centerX, centerY, feature, index);
      } else {
        // 3D mode: extrude geometry
        if (points.length < 3) return; // Need at least 3 points for 3D shapes
        create3DGeometry(
          points,
          scene,
          scale,
          centerX,
          centerY,
          feature,
          index
        );
      }
    });

    // Helper function for 2D line rendering
    function create2DLines(
      points: { x: number; y: number }[],
      scene: THREE.Scene,
      scale: number,
      centerX: number,
      centerY: number,
      feature: any,
      index: number
    ) {
      const geometry = new THREE.BufferGeometry();
      const vertices: number[] = [];

      // Create line segments
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        vertices.push(
          (p1.x - centerX) * scale,
          0,
          (p1.y - centerY) * scale,
          (p2.x - centerX) * scale,
          0,
          (p2.y - centerY) * scale
        );
      }

      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
      );

      // Color based on feature type
      let color = 0xffffff;
      switch (feature.type) {
        case "hull_profile":
          color = 0x4a90e2;
          break;
        case "waterline":
          color = 0x00bfff;
          break;
        case "mast":
          color = 0xcccccc;
          break;
        case "deck_edge":
          color = 0xffa500;
          break;
        default:
          color = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57][index % 5];
      }

      const material = new THREE.LineBasicMaterial({
        color: color,
        linewidth: feature.type === "hull_profile" ? 3 : 2,
      });
      const line = new THREE.LineSegments(geometry, material);
      scene.add(line);
    }

    // Helper function for 3D geometry creation
    function create3DGeometry(
      points: { x: number; y: number }[],
      scene: THREE.Scene,
      scale: number,
      centerX: number,
      centerY: number,
      feature: any,
      index: number
    ) {
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

        // Create material based on type and feature
        let material: THREE.Material;
        let color;

        // Color based on feature type
        switch (feature.type) {
          case "hull_profile":
            color = 0x4a90e2;
            break;
          case "waterline":
            color = 0x00bfff;
            break;
          case "mast":
            color = 0xcccccc;
            break;
          case "deck_edge":
            color = 0xffa500;
            break;
          default:
            color = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57][
              index % 5
            ];
        }

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
    }

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
    viewMode,
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
            {/* View Mode Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                View Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("2D")}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                    viewMode === "2D"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  2D View
                </button>
                <button
                  onClick={() => setViewMode("3D")}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                    viewMode === "3D"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  3D View
                </button>
              </div>
            </div>

            {/* 3D Controls - only show in 3D mode */}
            {viewMode === "3D" && (
              <>
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
                    onChange={(e) =>
                      setExtrusionDepth(parseFloat(e.target.value))
                    }
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
              </>
            )}

            {/* Info Section */}
            <div className="text-sm text-gray-400 mt-4">
              <p>
                • Mouse:{" "}
                {viewMode === "2D" ? "Pan and rotate" : "Orbit around model"}
              </p>
              <p>• Scroll: Zoom in/out</p>
              <p>• Mode: {viewMode} view active</p>
              <p>• {features.length} features rendered</p>
              {viewMode === "3D" && <p>• Extrusion depth: {extrusionDepth}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
