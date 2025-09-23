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
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number | null>(null);
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
    sceneRef.current = scene;

    // Camera setup - adjust for 2D vs 3D view
    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);

    if (viewMode === "2D") {
      // Top-down orthographic-like view for 2D mode
      camera.position.set(0, 20, 0.1);
      camera.lookAt(0, 0, 0);
    } else {
      // 3D perspective view
      camera.position.set(15, 10, 15);
      camera.lookAt(0, 0, 0);
    }

    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(800, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x1a1a2e, 1);
    rendererRef.current = renderer;

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);

    // Add rim lighting for better definition
    const rimLight = new THREE.DirectionalLight(0x4a90e2, 0.3);
    rimLight.position.set(-20, 10, -10);
    scene.add(rimLight);

    // Add grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Enhanced controls using OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.maxDistance = 100;
    controls.minDistance = 1;
    controlsRef.current = controls;

    // Convert 2D features to 3D
    convertFeaturesToMesh(
      features,
      scene,
      canvasWidth,
      canvasHeight,
      viewMode,
      extrusionDepth,
      materialType
    );

    // Enhanced animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update(); // Required for damping
      renderer.render(scene, camera);
    };

    // Mount renderer
    mountRef.current.appendChild(renderer.domElement);

    animate();

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
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

  const convertFeaturesToMesh = (
    features: YachtFeature[],
    scene: THREE.Scene,
    canvasW: number,
    canvasH: number,
    mode: "2D" | "3D",
    extrusionDepth: number,
    materialType: "standard" | "metallic" | "glass"
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
        // In 3D mode, create volumetric representations with proper extrusion
        switch (feature.type) {
          case "hull_profile":
            createExtrudedProfile(
              points,
              scene,
              scale,
              centerX,
              centerY,
              extrusionDepth,
              0x4a90e2,
              materialType
            );
            break;
          case "waterline":
            createWaterline(points, scene, scale, centerX, centerY);
            break;
          case "mast":
            createMast(points, scene, scale, centerX, centerY);
            break;
          case "deck_edge":
            createExtrudedProfile(
              points,
              scene,
              scale,
              centerX,
              centerY,
              extrusionDepth * 0.2,
              0xffa500,
              materialType
            );
            break;
          default:
            createExtrudedProfile(
              points,
              scene,
              scale,
              centerX,
              centerY,
              extrusionDepth * 0.5,
              [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57][index % 5],
              materialType
            );
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

  const createExtrudedProfile = (
    points: { x: number; y: number }[],
    scene: THREE.Scene,
    scale: number,
    centerX: number,
    centerY: number,
    extrusionDepth: number,
    color: number,
    materialType: "standard" | "metallic" | "glass" = "standard"
  ) => {
    if (points.length < 3) {
      // For lines with less than 3 points, create a simple extruded tube
      const curve = new THREE.CatmullRomCurve3(
        points.map(
          (p) =>
            new THREE.Vector3(
              (p.x - centerX) * scale,
              0,
              (p.y - centerY) * scale
            )
        )
      );

      const tubeGeometry = new THREE.TubeGeometry(curve, 32, 0.1, 8, false);

      // Create material based on materialType
      let material: THREE.Material;
      switch (materialType) {
        case "metallic":
          material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.8,
            roughness: 0.2,
            transparent: true,
            opacity: 0.9,
          });
          break;
        case "glass":
          material = new THREE.MeshPhysicalMaterial({
            color: color,
            transmission: 0.9,
            opacity: 0.3,
            transparent: true,
            roughness: 0.1,
            metalness: 0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
          });
          break;
        default:
          material = new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            shininess: 100,
          });
      }

      const mesh = new THREE.Mesh(tubeGeometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return;
    }

    // For shapes with 3+ points, create proper extruded geometry
    try {
      const shape = new THREE.Shape();

      // Convert points to shape coordinates
      const shapePoints = points.map((p) => ({
        x: (p.x - centerX) * scale,
        y: (p.y - centerY) * scale,
      }));

      // Move to first point
      shape.moveTo(shapePoints[0].x, shapePoints[0].y);

      // Create shape path
      for (let i = 1; i < shapePoints.length; i++) {
        shape.lineTo(shapePoints[i].x, shapePoints[i].y);
      }

      // Close the shape if not already closed
      const firstPoint = shapePoints[0];
      const lastPoint = shapePoints[shapePoints.length - 1];
      const distance = Math.sqrt(
        Math.pow(lastPoint.x - firstPoint.x, 2) +
          Math.pow(lastPoint.y - firstPoint.y, 2)
      );

      if (distance > 0.1) {
        shape.lineTo(firstPoint.x, firstPoint.y);
      }

      // Create extrude geometry
      const extrudeSettings = {
        depth: extrusionDepth,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 2,
        bevelSize: 0.1,
        bevelThickness: 0.1,
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.computeBoundingBox();

      // Center the geometry
      const center = new THREE.Vector3();
      geometry.boundingBox!.getCenter(center);
      geometry.translate(0, 0, -extrusionDepth / 2);

      // Create material based on materialType
      let material: THREE.Material;
      switch (materialType) {
        case "metallic":
          material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.8,
            roughness: 0.2,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
          });
          break;
        case "glass":
          material = new THREE.MeshPhysicalMaterial({
            color: color,
            transmission: 0.9,
            opacity: 0.3,
            transparent: true,
            roughness: 0.1,
            metalness: 0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            side: THREE.DoubleSide,
          });
          break;
        default:
          material = new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 0.85,
            shininess: 100,
            side: THREE.DoubleSide,
          });
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      // Add wireframe overlay for better definition
      const wireframeGeometry = new THREE.WireframeGeometry(geometry);
      const wireframeMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(1.5),
        transparent: true,
        opacity: 0.3,
      });
      const wireframe = new THREE.LineSegments(
        wireframeGeometry,
        wireframeMaterial
      );
      scene.add(wireframe);
    } catch (error) {
      console.warn(
        "Failed to create extruded geometry, falling back to line:",
        error
      );
      // Fallback to simple line if extrusion fails
      const geometry = new THREE.BufferGeometry();
      const vertices = [];

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
      const lineMaterial = new THREE.LineBasicMaterial({ color: color });
      const line = new THREE.LineSegments(geometry, lineMaterial);
      scene.add(line);
    }
  };

  const createHullProfile = (
    points: { x: number; y: number }[],
    scene: THREE.Scene,
    scale: number,
    centerX: number,
    centerY: number,
    materialType: "standard" | "metallic" | "glass" = "standard"
  ) => {
    // Use the new extrusion method for hull profiles
    createExtrudedProfile(
      points,
      scene,
      scale,
      centerX,
      centerY,
      3,
      0x4a90e2,
      materialType
    );
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
    index: number,
    extrusionDepth: number = 0.5,
    materialType: "standard" | "metallic" | "glass" = "standard"
  ) => {
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57];
    const color = colors[index % colors.length];

    // Use the new extrusion method for generic lines
    createExtrudedProfile(
      points,
      scene,
      scale,
      centerX,
      centerY,
      extrusionDepth,
      color,
      materialType
    );
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

            {/* 3D Controls - Only show in 3D mode */}
            {viewMode === "3D" && (
              <div className="flex items-center gap-4">
                {/* Extrusion Depth Control */}
                <div className="flex items-center gap-2 bg-black bg-opacity-30 px-3 py-1 rounded-lg">
                  <label className="text-white text-sm">Depth:</label>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={extrusionDepth}
                    onChange={(e) =>
                      setExtrusionDepth(parseFloat(e.target.value))
                    }
                    className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-white text-sm min-w-[2rem]">
                    {extrusionDepth}
                  </span>
                </div>

                {/* Material Type Selector */}
                <div className="flex items-center gap-2 bg-black bg-opacity-30 px-3 py-1 rounded-lg">
                  <label className="text-white text-sm">Material:</label>
                  <select
                    value={materialType}
                    onChange={(e) =>
                      setMaterialType(
                        e.target.value as "standard" | "metallic" | "glass"
                      )
                    }
                    className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:border-blue-400 focus:outline-none"
                  >
                    <option value="standard">Standard</option>
                    <option value="metallic">Metallic</option>
                    <option value="glass">Glass</option>
                  </select>
                </div>
              </div>
            )}

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
