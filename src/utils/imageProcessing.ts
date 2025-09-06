import { ProcessingSettings, YachtFeature } from "../types/index.js";

// Simple line extraction from edge detection
export const extractLinesFromEdges = (
  imageData: ImageData,
  minLineLength: number = 10
): YachtFeature[] => {
  const { data, width, height } = imageData;
  const features: YachtFeature[] = [];
  const visited = new Set<string>();

  // Find edge pixels and trace lines
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const key = `${x},${y}`;
      
      // If this is an edge pixel and we haven't visited it
      if (data[idx] > 128 && !visited.has(key)) {
        const linePoints = traceLine(data, width, height, x, y, visited);
        
        if (linePoints.length >= minLineLength) {
          features.push({
            type: "hull_profile", // Use existing type for general lines
            points: linePoints,
            confidence: 0.8
          });
        }
      }
    }
  }

  return features;
};

// Simple line tracing algorithm
function traceLine(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  visited: Set<string>
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const stack = [{ x: startX, y: startY }];

  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const idx = (y * width + x) * 4;
    if (data[idx] > 128) {
      points.push({ x, y });

      // Check 8-connected neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          
          const nx = x + dx;
          const ny = y + dy;
          const nkey = `${nx},${ny}`;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited.has(nkey)) {
            const nidx = (ny * width + nx) * 4;
            if (data[nidx] > 128) {
              stack.push({ x: nx, y: ny });
            }
          }
        }
      }
    }
  }

  return points;
}

export const applySobelEdgeDetection = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number
): ImageData => {
  const output = new ImageData(width, height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // Get surrounding pixels
      const tl = data[((y - 1) * width + (x - 1)) * 4];
      const tm = data[((y - 1) * width + x) * 4];
      const tr = data[((y - 1) * width + (x + 1)) * 4];
      const ml = data[(y * width + (x - 1)) * 4];
      const mr = data[(y * width + (x + 1)) * 4];
      const bl = data[((y + 1) * width + (x - 1)) * 4];
      const bm = data[((y + 1) * width + x) * 4];
      const br = data[((y + 1) * width + (x + 1)) * 4];

      // Sobel operators
      const gx = tr + 2 * mr + br - (tl + 2 * ml + bl);
      const gy = bl + 2 * bm + br - (tl + 2 * tm + tr);
      const magnitude = Math.sqrt(gx * gx + gy * gy);

      const edge = magnitude > threshold ? 255 : 0;
      output.data[idx] = edge;
      output.data[idx + 1] = edge;
      output.data[idx + 2] = edge;
      output.data[idx + 3] = 255;
    }
  }

  return output;
};

export const applyLaplacianEdgeDetection = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number
): ImageData => {
  const output = new ImageData(width, height);

  // Laplacian kernel
  const kernel = [
    [0, -1, 0],
    [-1, 4, -1],
    [0, -1, 0],
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelIdx = ((y + ky) * width + (x + kx)) * 4;
          sum += data[pixelIdx] * kernel[ky + 1][kx + 1];
        }
      }

      const edge = Math.abs(sum) > threshold ? 255 : 0;
      output.data[idx] = edge;
      output.data[idx + 1] = edge;
      output.data[idx + 2] = edge;
      output.data[idx + 3] = 255;
    }
  }

  return output;
};

export const applyEdgeDetection = (
  imageData: ImageData,
  method: ProcessingSettings["edgeMethod"],
  threshold: number
): ImageData => {
  const data = new Uint8ClampedArray(imageData.data);
  const width = imageData.width;
  const height = imageData.height;

  // Convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = data[i + 1] = data[i + 2] = gray;
  }

  // Apply edge detection based on method
  switch (method) {
    case "canny":
    case "sobel":
      return applySobelEdgeDetection(data, width, height, threshold);
    case "laplacian":
      return applyLaplacianEdgeDetection(data, width, height, threshold);
    default:
      return imageData;
  }
};

export const generateCADOutput = (settings: ProcessingSettings): string => {
  return `; SCALE CALIBRATION
; Scale: 1:${settings.scale}
; Drawing generated from image processing
; 
; CAD Format: ${settings.outputFormat.toUpperCase()}
; Edge Detection Method: ${settings.edgeMethod}
; Threshold: ${settings.threshold}

SCALE CALIBRATION`;
};
