import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
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
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [viewMode, setViewMode] = useState<"2D" | "3D">("3D");

  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera setup - adjust for 2D vs 3D view
    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);

    if (viewMode === "2D") {
      // Top-down orthographic-like view for 2D mode
      camera.position.set(0, 20, 0.1);
      camera.lookAt(0, 0, 0);
    } else {
      // 3D perspective view
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 0, 0);
    }

    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Convert 2D features to 3D
    convertFeaturesToMesh(features, scene, canvasWidth, canvasHeight, viewMode);

    // Controls (basic mouse orbit)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (event: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y,
      };

      const rotationSpeed = 0.005;
      camera.position.x =
        camera.position.x * Math.cos(deltaMove.x * rotationSpeed) -
        camera.position.z * Math.sin(deltaMove.x * rotationSpeed);
      camera.position.z =
        camera.position.x * Math.sin(deltaMove.x * rotationSpeed) +
        camera.position.z * Math.cos(deltaMove.x * rotationSpeed);

      camera.lookAt(0, 0, 0);
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (event: WheelEvent) => {
      const zoomSpeed = 0.1;
      camera.position.multiplyScalar(1 + event.deltaY * zoomSpeed * 0.01);
      camera.lookAt(0, 0, 0);
    };

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    // Mount renderer
    mountRef.current.appendChild(renderer.domElement);

    // Add event listeners
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("wheel", onWheel);

    animate();

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isOpen, features, canvasWidth, canvasHeight, viewMode]);

  const convertFeaturesToMesh = (
    features: YachtFeature[],
    scene: THREE.Scene,
    canvasW: number,
    canvasH: number,
    mode: "2D" | "3D"
  ) => {
    // Scale factor to convert canvas pixels to 3D world units
    const scale = 0.02; // Adjust this to get good proportions
    const centerX = canvasW / 2;
    const centerY = canvasH / 2;

    features.forEach((feature, index) => {
      const points = feature.points;
      if (points.length < 2) return;

      // Create different representations based on view mode and feature type
      if (mode === "2D") {
        // In 2D mode, render everything as flat lines at y=0
        create2DLine(
          points,
          scene,
          scale,
          centerX,
          centerY,
          feature.type,
          index
        );
      } else {
        // In 3D mode, create volumetric representations
        switch (feature.type) {
          case "hull_profile":
            createHullProfile(points, scene, scale, centerX, centerY);
            break;
          case "waterline":
            createWaterline(points, scene, scale, centerX, centerY);
            break;
          case "mast":
            createMast(points, scene, scale, centerX, centerY);
            break;
          case "deck_edge":
            createDeckEdge(points, scene, scale, centerX, centerY);
            break;
          default:
            createGenericLine(points, scene, scale, centerX, centerY, index);
        }
      }
    });
  };

  const create2DLine = (
    points: { x: number; y: number }[],
    scene: THREE.Scene,
    scale: number,
    centerX: number,
    centerY: number,
    featureType: string,
    index: number
  ) => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    // Color mapping for different feature types in 2D mode
    const colorMap: { [key: string]: number } = {
      hull_profile: 0x4a90e2,
      waterline: 0x00ffff,
      mast: 0xcccccc,
      deck_edge: 0xffa500,
      cabin: 0x90ee90,
      keel: 0xff6b6b,
    };

    const color =
      colorMap[featureType] ||
      [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57][index % 5];

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
    const material = new THREE.LineBasicMaterial({
      color: color,
      linewidth: featureType === "hull_profile" ? 3 : 2,
    });
    const line = new THREE.LineSegments(geometry, material);
    scene.add(line);
  };

  const createHullProfile = (
    points: { x: number; y: number }[],
    scene: THREE.Scene,
    scale: number,
    centerX: number,
    centerY: number
  ) => {
    // Create a 3D hull by extruding the 2D profile
    const curve = new THREE.CatmullRomCurve3(
      points.map(
        (p) =>
          new THREE.Vector3((p.x - centerX) * scale, 0, (p.y - centerY) * scale)
      )
    );

    // Create hull surface
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.5, 8, false);
    const hullMaterial = new THREE.MeshLambertMaterial({
      color: 0x4a90e2,
      transparent: true,
      opacity: 0.8,
    });
    const hullMesh = new THREE.Mesh(tubeGeometry, hullMaterial);
    scene.add(hullMesh);

    // Add wireframe overlay
    const wireframe = new THREE.WireframeGeometry(tubeGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x6bb6ff });
    const wireframeMesh = new THREE.LineSegments(wireframe, wireframeMaterial);
    scene.add(wireframeMesh);
  };

  const createWaterline = (
    points: { x: number; y: number }[],
    scene: THREE.Scene,
    scale: number,
    centerX: number,
    centerY: number
  ) => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      vertices.push(
        (p1.x - centerX) * scale,
        -1,
        (p1.y - centerY) * scale,
        (p2.x - centerX) * scale,
        -1,
        (p2.y - centerY) * scale
      );
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    const material = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: 3,
    });
    const line = new THREE.LineSegments(geometry, material);
    scene.add(line);
  };

  const createMast = (
    points: { x: number; y: number }[],
    scene: THREE.Scene,
    scale: number,
    centerX: number,
    centerY: number
  ) => {
    if (points.length < 2) return;

    const height = Math.abs(points[0].y - points[points.length - 1].y) * scale;
    const geometry = new THREE.CylinderGeometry(0.1, 0.1, height, 8);
    const material = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    const mast = new THREE.Mesh(geometry, material);

    mast.position.set(
      (points[0].x - centerX) * scale,
      height / 2,
      (points[0].y - centerY) * scale
    );

    scene.add(mast);
  };

  const createDeckEdge = (
    points: { x: number; y: number }[],
    scene: THREE.Scene,
    scale: number,
    centerX: number,
    centerY: number
  ) => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      vertices.push(
        (p1.x - centerX) * scale,
        0.5,
        (p1.y - centerY) * scale,
        (p2.x - centerX) * scale,
        0.5,
        (p2.y - centerY) * scale
      );
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    const material = new THREE.LineBasicMaterial({
      color: 0xffa500,
      linewidth: 2,
    });
    const line = new THREE.LineSegments(geometry, material);
    scene.add(line);
  };

  const createGenericLine = (
    points: { x: number; y: number }[],
    scene: THREE.Scene,
    scale: number,
    centerX: number,
    centerY: number,
    index: number
  ) => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57];

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
    const material = new THREE.LineBasicMaterial({
      color: colors[index % colors.length],
    });
    const line = new THREE.LineSegments(geometry, material);
    scene.add(line);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">CAD Viewer</h3>
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode("2D")}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  viewMode === "2D"
                    ? "bg-blue-500 text-white"
                    : "text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-white bg-white dark:bg-gray-600"
                }`}
              >
                2D View
              </button>
              <button
                onClick={() => setViewMode("3D")}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  viewMode === "3D"
                    ? "bg-blue-500 text-white"
                    : "text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-white bg-white dark:bg-gray-600"
                }`}
              >
                3D View
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-white hover:text-red-400 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="relative">
          <div
            ref={mountRef}
            className="w-full h-[600px] border border-gray-600 rounded-lg bg-gray-800"
          />

          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded text-sm">
            <p>
              <strong>Controls:</strong>
            </p>
            <p>
              • Mouse:{" "}
              {viewMode === "2D" ? "Pan and rotate" : "Orbit around model"}
            </p>
            <p>• Scroll: Zoom in/out</p>
            <p>• Mode: {viewMode} view active</p>
            <p>• {features.length} features rendered</p>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-300">
          <p>
            {viewMode === "2D"
              ? "2D top-down view showing CAD features as flat line drawings - perfect for technical blueprints."
              : "3D representation of detected CAD features with volumetric geometry and realistic proportions."}
          </p>
        </div>
      </div>
    </div>
  );
}
