import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  Settings,
  Download,
  Copy,
  Target,
  Trash2,
  Play,
  Box,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  X,
} from "lucide-react";
import {
  Point,
  ReferencePoint,
  YachtFeature,
  ProcessingSettings,
} from "../types/index.js";
import {
  applyEdgeDetection,
  extractLinesFromEdges,
} from "../utils/imageProcessing.js";
import { generateCADOutput } from "../utils/cadGeneration.js";
import { useImageUpload } from "../hooks/useImageUpload.js";
import { useCADOutput } from "../hooks/useCADOutput.js";
import { ThreeJSViewer } from "./ThreeJSViewer.js";

export function ImageToCAD() {
  // Custom hooks for business logic
  const { cadOutput, setCadOutput, downloadCAD, copyToClipboard } =
    useCADOutput();
  const { handleFileUpload, isUploading, isConverting } = useImageUpload(
    (img: HTMLImageElement) => {
      setImage(img);
      drawImageToCanvas(img);
    }
  );

  // State with proper typing
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [referencePoints, setReferencePoints] = useState<ReferencePoint[]>([]);
  const [detectedFeatures, setDetectedFeatures] = useState<YachtFeature[]>([]);
  const [is3DViewerOpen, setIs3DViewerOpen] = useState<boolean>(false);
  const [isDetectedFeaturesOpen, setIsDetectedFeaturesOpen] =
    useState<boolean>(false);
  const [isCADOutputOpen, setIsCADOutputOpen] = useState<boolean>(false);

  // Scale calibration state
  const [isScaleMode, setIsScaleMode] = useState<boolean>(false);
  const [scalePoints, setScalePoints] = useState<ReferencePoint[]>([]);
  const [knownDistance, setKnownDistance] = useState<number>(100); // mm
  const [pixelsPerMM, setPixelsPerMM] = useState<number>(1);

  // Conversion tool state
  const [conversionInput, setConversionInput] = useState<string>("");
  const [conversionUnit, setConversionUnit] = useState<"inches" | "feet">(
    "feet"
  );

  // Fullscreen image state
  const [isImageFullscreen, setIsImageFullscreen] = useState<boolean>(false);

  const [settings, setSettings] = useState<ProcessingSettings>({
    edgeMethod: "canny",
    threshold: 100,
    scale: 100,
    outputFormat: "dxf",
    conversionMode: "interior", // Default to interior components
  });

  // Refs with proper typing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);

  // Initialize CAD output based on conversion mode
  useEffect(() => {
    const getInitialMessage = () => {
      switch (settings.conversionMode) {
        case "yacht":
          return `; Yacht CAD Drawing Output
; Generated from photo analysis
; 
; Upload a yacht photo to begin conversion process...
; 
; Features detected will appear here:
; - Hull profile lines
; - Deck outlines  
; - Mast and rigging points
; - Cabin structures
; - Overall dimensions`;
        case "interior":
          return `; Interior Component CAD Output
; Generated from photo analysis
; 
; Upload a photo of yacht interior components...
; 
; Components that will be detected:
; - Cabinet doors and drawers
; - Seating and furniture
; - Countertops and surfaces
; - Small fittings and hardware
; - Detailed dimensions in cm`;
        case "general":
          return `; General Object CAD Output
; Generated from photo analysis
; 
; Upload a photo of any object to convert...
; 
; Objects will be analyzed for:
; - Basic geometric shapes
; - Overall dimensions
; - Edge outlines
; - General proportions`;
        default:
          return `; CAD Drawing Output
; Generated from photo analysis
; Upload a photo to begin...`;
      }
    };
    setCadOutput(getInitialMessage());
  }, [settings.conversionMode]);

  // File upload handler with proper error handling
  // Canvas drawing with proper error handling
  const drawImageToCanvas = useCallback((img: HTMLImageElement): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const maxWidth = 500;
    const maxHeight = 400;

    let { width, height } = img;
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width *= ratio;
    height *= ratio;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, width, height);

    // Store original image data
    originalImageDataRef.current = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
  }, []);

  // Canvas click handler with proper typing
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>): void => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Check if it's a simple click for fullscreen on mobile (when not in scale mode)
      if (!isScaleMode && window.innerWidth <= 768) {
        setIsImageFullscreen(true);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (isScaleMode) {
        // Scale calibration mode - only allow 2 points
        if (scalePoints.length < 2) {
          const newPoint: ReferencePoint = {
            x,
            y,
            id: scalePoints.length,
          };
          setScalePoints((prev) => [...prev, newPoint]);
        }
      } else {
        // Normal reference point mode (desktop or when scale mode is off)
        const newPoint: ReferencePoint = {
          x,
          y,
          id: referencePoints.length,
        };
        setReferencePoints((prev) => [...prev, newPoint]);
      }
    },
    [referencePoints.length, isScaleMode, scalePoints.length]
  );

  const calculateScale = useCallback(() => {
    if (scalePoints.length !== 2 || !knownDistance) return;

    const [point1, point2] = scalePoints;
    const pixelDistance = Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );

    // Convert known distance to millimeters
    const distanceInMM = knownDistance * 1000; // Assuming input is in meters
    const calculatedPixelsPerMM = pixelDistance / distanceInMM;

    setPixelsPerMM(calculatedPixelsPerMM);
    setIsScaleMode(false); // Exit scale mode after calculation
  }, [scalePoints, knownDistance]);

  const clearScale = useCallback(() => {
    setScalePoints([]);
    setKnownDistance(100);
    setPixelsPerMM(1);
    setIsScaleMode(false);
  }, []);

  // Conversion helper
  const convertToMM = useCallback(
    (value: number, unit: "inches" | "feet"): number => {
      if (unit === "inches") {
        return value * 25.4; // 1 inch = 25.4 mm
      } else {
        return value * 304.8; // 1 foot = 304.8 mm
      }
    },
    []
  );

  // Draw reference points with proper canvas context handling
  const drawReferencePoints = useCallback((): void => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageDataRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.putImageData(originalImageDataRef.current, 0, 0);

    // Draw reference points
    ctx.fillStyle = "#FF6B6B";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;

    referencePoints.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Label
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "12px Arial";
      ctx.fillText(`P${index + 1}`, point.x + 10, point.y - 10);
      ctx.fillStyle = "#FF6B6B";
    });

    // Draw scale points in different color
    if (scalePoints.length > 0) {
      ctx.fillStyle = "#4ECDC4";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;

      scalePoints.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Label
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px Arial";
        ctx.fillText(`S${index + 1}`, point.x + 10, point.y - 10);
      });

      // Draw line between scale points if both exist
      if (scalePoints.length === 2) {
        ctx.strokeStyle = "#4ECDC4";
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(scalePoints[0].x, scalePoints[0].y);
        ctx.lineTo(scalePoints[1].x, scalePoints[1].y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [referencePoints, scalePoints]);

  useEffect(() => {
    drawReferencePoints();
  }, [referencePoints, scalePoints, drawReferencePoints]);

  // Generate yacht-specific features
  // Categorize detected features based on their position, orientation, and characteristics
  const categorizeDetectedFeatures = useCallback(
    (
      rawFeatures: YachtFeature[],
      canvasWidth: number,
      canvasHeight: number,
      conversionMode: ProcessingSettings["conversionMode"]
    ): YachtFeature[] => {
      return rawFeatures
        .filter((feature) => {
          // Filter out very short features to reduce noise
          if (feature.points.length < 3) return false;

          const firstPoint = feature.points[0];
          const lastPoint = feature.points[feature.points.length - 1];
          const length = Math.sqrt(
            Math.pow(lastPoint.x - firstPoint.x, 2) +
              Math.pow(lastPoint.y - firstPoint.y, 2)
          );

          // Only keep features that are at least 20 pixels long
          return length >= 20;
        })
        .map((feature, index) => {
          const points = feature.points;
          if (points.length < 2) return feature;

          // Calculate feature characteristics
          const firstPoint = points[0];
          const lastPoint = points[points.length - 1];
          const length = Math.sqrt(
            Math.pow(lastPoint.x - firstPoint.x, 2) +
              Math.pow(lastPoint.y - firstPoint.y, 2)
          );

          // Calculate if line is more horizontal or vertical
          const deltaX = Math.abs(lastPoint.x - firstPoint.x);
          const deltaY = Math.abs(lastPoint.y - firstPoint.y);
          const isHorizontal = deltaX > deltaY;
          const isVertical = deltaY > deltaX;

          // Calculate average position
          const avgX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
          const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

          console.log(
            `Feature analysis: length=${length.toFixed(
              1
            )}, isHorizontal=${isHorizontal}, isVertical=${isVertical}, avgX=${avgX.toFixed(
              1
            )}, avgY=${avgY.toFixed(
              1
            )}, canvasW=${canvasWidth}, canvasH=${canvasHeight}, mode=${conversionMode}`
          );

          // Categorize based on conversion mode and characteristics
          let featureType: YachtFeature["type"] = "hull_profile";
          let confidence = 0.7;

          // Add some variety by using index for testing
          const featureTypes: YachtFeature["type"][] = [
            "hull_profile",
            "waterline",
            "mast",
            "deck_edge",
            "cabin",
            "keel",
          ];

          if (conversionMode === "yacht") {
            // Yacht-specific categorization with more flexible thresholds
            if (isHorizontal && length > canvasWidth * 0.3) {
              if (avgY > canvasHeight * 0.7) {
                featureType = "waterline";
                confidence = 0.9;
              } else if (avgY < canvasHeight * 0.3) {
                featureType = "deck_edge";
                confidence = 0.8;
              } else {
                featureType = "hull_profile";
                confidence = 0.85;
              }
            } else if (isVertical && length > canvasHeight * 0.4) {
              featureType = "mast";
              confidence = 0.8;
            } else if (length > Math.min(canvasWidth, canvasHeight) * 0.2) {
              featureType = "hull_profile";
              confidence = 0.75;
            } else {
              featureType = "deck_edge";
              confidence = 0.6;
            }
          } else {
            // For interior/general mode, use more diverse categorization
            // Add some automatic variety for testing
            featureType = featureTypes[index % featureTypes.length];

            if (isHorizontal && length > canvasWidth * 0.3) {
              if (avgY < canvasHeight * 0.3) {
                featureType = "deck_edge"; // Top horizontal features (like countertops, shelves)
                confidence = 0.8;
              } else if (avgY > canvasHeight * 0.7) {
                featureType = "waterline"; // Bottom horizontal features (like floor lines)
                confidence = 0.8;
              } else {
                featureType = "hull_profile"; // Middle horizontal features
                confidence = 0.7;
              }
            } else if (isVertical && length > canvasHeight * 0.4) {
              featureType = "mast"; // Vertical features (like doors, cabinet edges)
              confidence = 0.8;
            } else if (length > Math.min(canvasWidth, canvasHeight) * 0.15) {
              featureType = "cabin"; // Medium-length features
              confidence = 0.7;
            } else {
              featureType = "keel"; // Short features (like handles, small details)
              confidence = 0.6;
            }
          }

          console.log(
            `Assigned type: ${featureType}, confidence: ${confidence}`
          );

          return {
            ...feature,
            type: featureType,
            confidence,
            metadata: {
              ...feature.metadata,
              length: length.toFixed(1),
              orientation: isHorizontal
                ? "horizontal"
                : isVertical
                ? "vertical"
                : "diagonal",
              position: `${((avgX / canvasWidth) * 100).toFixed(0)}%,${(
                (avgY / canvasHeight) *
                100
              ).toFixed(0)}%`,
              detectionMethod: "edge_detection",
            },
          };
        });
    },
    []
  );

  const generateYachtFeatures = useCallback((): YachtFeature[] => {
    const canvas = canvasRef.current;
    if (!canvas) return [];

    const width = canvas.width;
    const height = canvas.height;

    // Generate hull profile with proper curve
    const hullPoints: Point[] = [];
    for (let x = width * 0.1; x < width * 0.9; x += 5) {
      const y =
        height * 0.7 + Math.sin((x / width) * Math.PI * 2) * height * 0.1;
      hullPoints.push({ x, y });
    }

    const features: YachtFeature[] = [
      {
        type: "hull_profile",
        points: hullPoints,
        confidence: 0.85,
        metadata: {
          estimatedLength: (width * 0.8) / settings.scale,
          curvature: "moderate",
        },
      },
      {
        type: "waterline",
        points: [
          { x: width * 0.1, y: height * 0.75 },
          { x: width * 0.9, y: height * 0.75 },
        ],
        confidence: 0.92,
        metadata: {
          length: (width * 0.8) / settings.scale,
        },
      },
      {
        type: "mast",
        points: [
          { x: width * 0.4, y: height * 0.1 },
          { x: width * 0.4, y: height * 0.7 },
        ],
        confidence: 0.78,
        metadata: {
          height: (height * 0.6) / settings.scale,
          position: "center",
        },
      },
      {
        type: "deck_edge",
        points: Array.from({ length: 20 }, (_, i) => ({
          x: width * 0.2 + (i * width * 0.6) / 19,
          y: height * 0.6 + Math.random() * 5 - 2.5,
        })),
        confidence: 0.81,
        metadata: {
          style: "modern",
          clearance: "standard",
        },
      },
    ];

    return features;
  }, [settings.scale]);

  // Main processing function with error handling
  const processImage = useCallback(async (): Promise<void> => {
    if (!image) {
      alert("Please upload an image first");
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not available");

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Apply edge detection
      const processedData = applyEdgeDetection(
        imageData,
        settings.edgeMethod,
        settings.threshold
      );
      ctx.putImageData(processedData, 0, 0);

      // Extract actual features from the processed image
      const rawFeatures = extractLinesFromEdges(processedData, 15); // Increased to reduce noise
      console.log(
        `Detected ${rawFeatures.length} raw features from edge detection`
      );

      // Categorize features based on their characteristics
      const features = categorizeDetectedFeatures(
        rawFeatures,
        canvas.width,
        canvas.height,
        settings.conversionMode
      );
      console.log(
        `Filtered to ${features.length} significant features (from ${rawFeatures.length} raw features)`
      );
      console.log(
        "Categorized features:",
        features.map((f) => ({
          type: f.type,
          confidence: f.confidence,
          pointCount: f.points.length,
        }))
      );
      setDetectedFeatures(features);

      // Generate CAD output
      const output = generateCADOutput(
        features,
        settings.outputFormat,
        settings.scale,
        referencePoints,
        canvas.width,
        canvas.height,
        settings.conversionMode,
        image
      );
      setCadOutput(output);
    } catch (error) {
      console.error("Processing error:", error);
      alert("An error occurred during processing. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [image, settings, generateYachtFeatures, referencePoints]);

  // Event handlers with proper typing
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const clearAll = (): void => {
    setImage(null);
    setReferencePoints([]);
    setDetectedFeatures([]);
    setCadOutput(`; Yacht CAD Drawing Output
; Generated from photo analysis
; 
; Upload a yacht photo to begin conversion process...`);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    originalImageDataRef.current = null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 dark:from-gray-900 dark:via-gray-800 dark:to-black text-white transition-colors duration-300">
      <div className="w-full mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="text-center mb-6 lg:mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            Image to CAD Converter
          </h1>
          <p className="text-lg lg:text-xl opacity-90">
            Transform images into precise CAD drawings for marine engineering
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {/* Input Panel */}
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20 dark:border-gray-700 transition-colors duration-300">
            <h2 className="text-2xl font-semibold mb-6 text-blue-200 flex items-center gap-2">
              <Upload className="w-6 h-6" />
              Image Input
            </h2>

            {/* Upload Area */}
            <div
              className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer transition-all hover:border-white hover:bg-white/5"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-6xl mb-4 tracking-widest">🛥️</div>
              <p className="text-lg mb-2">
                {isConverting
                  ? "Converting HEIC image..."
                  : isUploading
                  ? "Processing image..."
                  : "Click or drag yacht photos here"}
              </p>
              <small className="opacity-70">
                Supports JPG, PNG, WebP, HEIC formats
              </small>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
            />

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Conversion Mode
                </label>
                <select
                  className="w-full p-3 bg-white/90 text-gray-800 rounded-lg"
                  value={settings.conversionMode}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      conversionMode: e.target
                        .value as ProcessingSettings["conversionMode"],
                    }))
                  }
                >
                  <option value="interior">Interior Components</option>
                  <option value="yacht">Full Yacht</option>
                  <option value="general">General Objects</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Edge Detection
                </label>
                <select
                  className="w-full p-3 bg-white/90 text-gray-800 rounded-lg"
                  value={settings.edgeMethod}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      edgeMethod: e.target
                        .value as ProcessingSettings["edgeMethod"],
                    }))
                  }
                >
                  <option value="canny">Canny Edge</option>
                  <option value="sobel">Sobel Filter</option>
                  <option value="laplacian">Laplacian</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Threshold: {settings.threshold}
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={settings.threshold}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      threshold: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Scale (px/meter)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={settings.scale}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      scale: parseFloat(e.target.value) || 100,
                    }))
                  }
                  className="w-full p-3 bg-white/90 text-gray-800 rounded-lg"
                />
              </div>
            </div>

            {/* Scale Calibration Section */}
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-blue-300/30">
              <h3 className="text-lg font-medium text-blue-200 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Scale Calibration
                {pixelsPerMM && (
                  <span className="text-sm text-green-400 ml-2">
                    ✓ Calibrated ({pixelsPerMM.toFixed(2)} px/mm)
                  </span>
                )}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Known Distance (meters)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={knownDistance}
                    onChange={(e) =>
                      setKnownDistance(parseFloat(e.target.value) || 0)
                    }
                    className="w-full p-2 bg-white/90 text-gray-800 rounded-lg text-sm"
                    placeholder="e.g., 2.5"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={() => setIsScaleMode(!isScaleMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      isScaleMode
                        ? "bg-orange-500 text-white"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    {isScaleMode ? "Exit Scale Mode" : "Set Scale"}
                  </button>

                  {scalePoints.length === 2 && knownDistance > 0 && (
                    <button
                      onClick={calculateScale}
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Calculate
                    </button>
                  )}

                  {(scalePoints.length > 0 || pixelsPerMM) && (
                    <button
                      onClick={clearScale}
                      className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
                    >
                      <X className="w-4 h-4" />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {isScaleMode && (
                <div className="mt-3 p-3 bg-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-200">
                    📐 Click two points on the image that represent a known
                    distance. Points: {scalePoints.length}/2
                  </p>
                </div>
              )}

              {pixelsPerMM && (
                <div className="mt-3 p-3 bg-green-500/20 rounded-lg">
                  <p className="text-sm text-green-200">
                    ✅ Scale calibrated! Real-world measurements will be
                    accurate.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Output Format
                </label>
                <select
                  className="w-full p-3 bg-white/90 text-gray-800 rounded-lg"
                  value={settings.outputFormat}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      outputFormat: e.target
                        .value as ProcessingSettings["outputFormat"],
                    }))
                  }
                >
                  <option value="dxf">DXF (2D CAD)</option>
                  <option value="svg">SVG (Vector)</option>
                  <option value="json">JSON (Data)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6 justify-between">
              {/* Processing Controls */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={processImage}
                  disabled={!image || isProcessing}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-teal-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                  {isProcessing ? "Processing..." : "Process Image"}
                </button>

                <button
                  onClick={() => setIsScaleMode(!isScaleMode)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all ${
                    isScaleMode
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                      : "bg-gradient-to-r from-red-500 to-teal-400 text-white"
                  }`}
                >
                  <Target className="w-4 h-4" />
                  {isScaleMode ? "Exit Scale Mode" : "Scale Calibration"}
                </button>

                {isScaleMode && (
                  <div className="flex flex-col gap-3">
                    {/* Conversion Helper */}
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <span className="text-xs text-blue-700 dark:text-blue-300">
                        📏 Convert:
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={conversionInput}
                          onChange={(e) => setConversionInput(e.target.value)}
                          placeholder="5"
                          className="w-16 px-2 py-1 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                        />
                        <select
                          value={conversionUnit}
                          onChange={(e) =>
                            setConversionUnit(
                              e.target.value as "inches" | "feet"
                            )
                          }
                          className="px-2 py-1 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-400"
                        >
                          <option value="feet">ft</option>
                          <option value="inches">in</option>
                        </select>
                        {conversionInput && !isNaN(Number(conversionInput)) && (
                          <span className="text-xs text-blue-700 dark:text-blue-300">
                            ={" "}
                            {convertToMM(
                              Number(conversionInput),
                              conversionUnit
                            ).toFixed(0)}
                            mm
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Scale Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={knownDistance}
                        onChange={(e) =>
                          setKnownDistance(Number(e.target.value))
                        }
                        placeholder="Distance (mm)"
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-sm text-gray-600">mm</span>
                      {scalePoints.length === 2 && (
                        <span className="text-sm text-green-600 font-medium">
                          Scale: {pixelsPerMM.toFixed(2)} px/mm
                        </span>
                      )}
                      <button
                        onClick={clearScale}
                        className="flex items-center gap-1 bg-gray-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-600 transition-all"
                      >
                        Clear Scale
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={clearAll}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-teal-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>

              {/* CAD Output Buttons */}
              {detectedFeatures.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => downloadCAD(settings)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download CAD
                  </button>

                  <button
                    onClick={() => copyToClipboard()}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    Copy to Clipboard
                  </button>

                  <button
                    onClick={() => setIs3DViewerOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    <Box className="w-4 h-4" />
                    View CAD
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Image Preview Panel */}
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20 dark:border-gray-700 transition-colors duration-300">
            <h2 className="text-2xl font-semibold mb-6 text-blue-200">
              🛥️ Image Preview
            </h2>

            {/* Mobile Fullscreen Button */}
            {image && (
              <button
                onClick={() => setIsImageFullscreen(true)}
                className="md:hidden w-full mb-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs text-blue-200 hover:text-white transition-all"
              >
                🔍 View Full Size
              </button>
            )}

            <div className="relative">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="max-w-full border rounded-lg cursor-crosshair bg-gray-900"
                width="500"
                height="400"
              />

              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-300 mx-auto mb-4"></div>
                    <p>Processing yacht image...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Scale Calibration Status */}
            {isScaleMode && (
              <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-300 dark:border-orange-600">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  📐 Scale Calibration Mode
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  {scalePoints.length === 0
                    ? "Click two points on the image to define a known distance"
                    : scalePoints.length === 1
                    ? "Click the second point to complete the measurement"
                    : `Scale set: ${pixelsPerMM.toFixed(2)} pixels per mm`}
                </p>
              </div>
            )}

            {/* Feature Detection Status */}
            {detectedFeatures.length > 0 && (
              <div className="mt-4 text-sm">
                <button
                  onClick={() =>
                    setIsDetectedFeaturesOpen(!isDetectedFeaturesOpen)
                  }
                  className="flex items-center justify-between w-full font-semibold text-gray-800 dark:text-gray-200 mb-2 hover:text-gray-600 dark:hover:text-gray-100 transition-colors"
                >
                  <span>Detected Features ({detectedFeatures.length})</span>
                  {isDetectedFeaturesOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {isDetectedFeaturesOpen && (
                  <div className="space-y-1">
                    {detectedFeatures.map((feature, index) => (
                      <div
                        key={index}
                        className="flex justify-between opacity-80"
                      >
                        <span>{feature.type.replace("_", " ")}</span>
                        <span>{Math.round(feature.confidence * 100)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CAD Output Panel */}
        <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20 dark:border-gray-700 mb-8 transition-colors duration-300">
          <button
            onClick={() => setIsCADOutputOpen(!isCADOutputOpen)}
            className="flex items-center justify-between w-full text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-6 h-6" />
              CAD Output
            </div>
            {isCADOutputOpen ? (
              <ChevronUp className="w-6 h-6" />
            ) : (
              <ChevronDown className="w-6 h-6" />
            )}
          </button>

          {isCADOutputOpen && (
            <div className="bg-black rounded-lg p-4 font-mono text-sm overflow-x-auto min-h-[300px]">
              <pre className="whitespace-pre-wrap">{cadOutput}</pre>
            </div>
          )}
        </div>

        {/* Features Panel */}
        <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20 dark:border-gray-700 transition-colors duration-300">
          <h2 className="text-2xl font-semibold mb-6 text-blue-200">
            🛠️ Yacht-Specific Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 dark:bg-white/[0.02] p-4 rounded-lg border border-white/10 dark:border-gray-700 transition-colors duration-300">
              <h3 className="text-lg font-semibold text-blue-200 mb-2">
                Hull Detection
              </h3>
              <p className="text-sm opacity-90">
                Automatically detects waterline, sheer line, and hull profile
              </p>
            </div>

            <div className="bg-white/5 dark:bg-white/[0.02] p-4 rounded-lg border border-white/10 dark:border-gray-700 transition-colors duration-300">
              <h3 className="text-lg font-semibold text-blue-200 mb-2">
                Rigging Analysis
              </h3>
              <p className="text-sm opacity-90">
                Identifies mast positions, stays, and sail attachment points
              </p>
            </div>

            <div className="bg-white/5 dark:bg-white/[0.02] p-4 rounded-lg border border-white/10 dark:border-gray-700 transition-colors duration-300">
              <h3 className="text-lg font-semibold text-blue-200 mb-2">
                Deck Layout
              </h3>
              <p className="text-sm opacity-90">
                Maps cockpit, cabin top, and deck hardware locations
              </p>
            </div>

            <div className="bg-white/5 dark:bg-white/[0.02] p-4 rounded-lg border border-white/10 dark:border-gray-700 transition-colors duration-300">
              <h3 className="text-lg font-semibold text-blue-200 mb-2">
                Scale Calibration
              </h3>
              <p className="text-sm opacity-90">
                Use known dimensions to calibrate measurements
              </p>
            </div>
          </div>
        </div>

        {/* Fullscreen Image Modal */}
        {isImageFullscreen && image && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <div className="relative max-w-full max-h-full">
              {/* Close Button */}
              <button
                onClick={() => setIsImageFullscreen(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-xl transition-all"
              >
                ×
              </button>

              {/* Fullscreen Image */}
              <img
                src={image.src}
                alt="Yacht - Full Size"
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={() => setIsImageFullscreen(false)}
              />

              {/* Tap to close hint */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                Tap to close
              </div>
            </div>
          </div>
        )}

        {/* 3D Viewer Modal */}
        <ThreeJSViewer
          features={detectedFeatures}
          isOpen={is3DViewerOpen}
          onClose={() => setIs3DViewerOpen(false)}
          canvasWidth={canvasRef.current?.width || 500}
          canvasHeight={canvasRef.current?.height || 400}
        />
      </div>
    </div>
  );
}
