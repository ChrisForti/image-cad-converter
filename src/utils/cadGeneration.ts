import {
  YachtFeature,
  ProcessingSettings,
  CADOutput,
  ReferencePoint,
} from "../types/index.js";

// Simple DXF generator for line drawings
export const generateDXF = (
  features: YachtFeature[],
  scale: number = 1
): string => {
  const lines: string[] = [];
  
  // DXF header
  lines.push("0", "SECTION", "2", "ENTITIES");

  // Convert features to simple lines
  features.forEach((feature) => {
    if (feature.points.length >= 2) {
      for (let i = 0; i < feature.points.length - 1; i++) {
        const p1 = feature.points[i];
        const p2 = feature.points[i + 1];
        
        // Create a line entity
        lines.push(
          "0", "LINE",
          "8", feature.type.toUpperCase(),
          "10", (p1.x / scale).toFixed(3),
          "20", (p1.y / scale).toFixed(3),
          "11", (p2.x / scale).toFixed(3),
          "21", (p2.y / scale).toFixed(3)
        );
      }
    }
  });

  // DXF footer
  lines.push("0", "ENDSEC", "0", "EOF");
  
  return lines.join("\n");
};

export const generateSVG = (
  features: YachtFeature[],
  scale: number,
  canvasWidth: number,
  canvasHeight: number
): string => {
  const lines: string[] = [];
  
  lines.push(`<svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">`);
  lines.push('<g stroke="black" stroke-width="1" fill="none">');

  features.forEach((feature) => {
    if (feature.points.length >= 2) {
      for (let i = 0; i < feature.points.length - 1; i++) {
        const p1 = feature.points[i];
        const p2 = feature.points[i + 1];
        lines.push(`<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" />`);
      }
    }
  });

  lines.push('</g>');
  lines.push('</svg>');
  
  return lines.join('\n');
};

export const generateJSON = (
  features: YachtFeature[],
  scale: number,
  referencePoints: ReferencePoint[],
  canvasWidth: number,
  canvasHeight: number,
  originalImage?: HTMLImageElement
): string => {
  const output: CADOutput = {
    metadata: {
      generator: "Image to CAD Converter",
      scale: scale,
      units: "pixels",
      timestamp: new Date().toISOString(),
      imageInfo: {
        width: canvasWidth,
        height: canvasHeight,
        originalDimensions: originalImage
          ? {
              width: originalImage.naturalWidth,
              height: originalImage.naturalHeight,
            }
          : undefined,
      },
    },
    features: features.map((feature) => ({
      ...feature,
      points: feature.points.map((p) => ({
        x: parseFloat((p.x / scale).toFixed(3)),
        y: parseFloat((p.y / scale).toFixed(3)),
      })),
    })),
    referencePoints: referencePoints.map((p) => ({
      x: parseFloat((p.x / scale).toFixed(3)),
      y: parseFloat((p.y / scale).toFixed(3)),
      id: p.id,
    })),
  };

  return JSON.stringify(output, null, 2);
};

export const generateCADOutput = (
  features: YachtFeature[],
  format: ProcessingSettings["outputFormat"],
  scale: number,
  referencePoints: ReferencePoint[],
  canvasWidth: number,
  canvasHeight: number,
  originalImage?: HTMLImageElement
): string => {
  switch (format) {
    case "dxf":
      return generateDXF(features, scale);
    case "svg":
      return generateSVG(features, scale, canvasWidth, canvasHeight);
    case "json":
      return generateJSON(
        features,
        scale,
        referencePoints,
        canvasWidth,
        canvasHeight,
        originalImage
      );
    default:
      return "SCALE CALIBRATION";
  }
};
