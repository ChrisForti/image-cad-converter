import { ProcessingSettings } from "../types/index.js";

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
