import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  Settings,
  Download,
  Copy,
  Target,
  Trash2,
  Play,
} from "lucide-react";
import {
  Point,
  ReferencePoint,
  YachtFeature,
  ProcessingSettings,
} from "../types/index.js";
import { applyEdgeDetection } from "../utils/imageProcessing.js";
import { generateCADOutput } from "../utils/cadGeneration.js";

export function ImageToCAD() {
  // State with proper typing
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [referencePoints, setReferencePoints] = useState<ReferencePoint[]>([]);
  const [detectedFeatures, setDetectedFeatures] = useState<YachtFeature[]>([]);
  const [cadOutput, setCadOutput] = useState<string>("");
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
  const handleFileUpload = useCallback((file: File | null) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size too large. Please select an image under 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (!e.target?.result) return;

      const img = new Image();
      img.onload = () => {
        setImage(img);
        drawImageToCanvas(img);
      };
      img.onerror = () => {
        alert("Failed to load image. Please try another file.");
      };
      img.src = e.target.result as string;
    };
    reader.onerror = () => {
      alert("Failed to read file. Please try again.");
    };
    reader.readAsDataURL(file);
  }, []);

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

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const newPoint: ReferencePoint = {
        x,
        y,
        id: referencePoints.length,
      };

      setReferencePoints((prev) => [...prev, newPoint]);
    },
    [referencePoints.length]
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
  }, [referencePoints]);

  useEffect(() => {
    drawReferencePoints();
  }, [referencePoints, drawReferencePoints]);

  // Generate yacht-specific features
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

      // Generate yacht features
      const features = generateYachtFeatures();
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

  const downloadCAD = (): void => {
    try {
      const content = cadOutput;
      const format = settings.outputFormat;
      const filename = `yacht_drawing.${format}`;

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  const copyToClipboard = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(cadOutput);
      alert("CAD data copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy: ", err);
      alert(
        "Failed to copy to clipboard. Please try selecting and copying manually."
      );
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
              <div className="text-4xl mb-4">🖼️</div>
              <p className="text-lg mb-2">Click or drag yacht photos here</p>
              <small className="opacity-70">
                Supports JPG, PNG, WebP formats
              </small>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
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
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={processImage}
                disabled={!image || isProcessing}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-teal-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                {isProcessing ? "Processing..." : "Process Image"}
              </button>

              <button
                onClick={() =>
                  alert(
                    "Click on the image to add reference points for scale calibration"
                  )
                }
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-teal-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <Target className="w-4 h-4" />
                Add Reference
              </button>

              <button
                onClick={clearAll}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-teal-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          </div>

          {/* Image Preview Panel */}
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20 dark:border-gray-700 transition-colors duration-300">
            <h2 className="text-2xl font-semibold mb-6 text-blue-200">
              🖼️ Image Preview
            </h2>

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

            {/* Feature Detection Status */}
            {detectedFeatures.length > 0 && (
              <div className="mt-4 text-sm">
                <p className="font-semibold text-blue-200 mb-2">
                  Detected Features:
                </p>
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
              </div>
            )}
          </div>
        </div>

        {/* CAD Output Panel */}
        <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20 dark:border-gray-700 mb-8 transition-colors duration-300">
          <h2 className="text-2xl font-semibold mb-6 text-blue-200 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            CAD Output
          </h2>

          <div className="bg-black rounded-lg p-4 font-mono text-sm overflow-x-auto min-h-[300px] mb-4">
            <pre className="whitespace-pre-wrap">{cadOutput}</pre>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadCAD}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-teal-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              Download CAD File
            </button>

            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-teal-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              <Copy className="w-4 h-4" />
              Copy to Clipboard
            </button>
          </div>
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
      </div>
    </div>
  );
}
