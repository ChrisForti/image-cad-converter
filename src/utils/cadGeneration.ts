import {
  YachtFeature,
  ProcessingSettings,
  CADOutput,
  ReferencePoint,
} from "../types/index.js";

// Estimate component dimensions based on typical furniture/interior proportions
export const estimateComponentDimensions = (
  features: YachtFeature[]
): {
  width: number;
  height: number;
  depth: number;
  type: string;
  confidence: number;
} => {
  if (features.length === 0) {
    return { width: 0, height: 0, depth: 0, type: "unknown", confidence: 0 };
  }

  // Find the feature with the largest span
  let maxSpan = 0;
  let primaryFeature = features[0];

  features.forEach((feature) => {
    if (feature.points.length >= 2) {
      const xs = feature.points.map((p) => p.x);
      const ys = feature.points.map((p) => p.y);
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);
      const span = Math.max(width, height);

      if (span > maxSpan) {
        maxSpan = span;
        primaryFeature = feature;
      }
    }
  });

  // Calculate bounding box
  const xs = primaryFeature.points.map((p) => p.x);
  const ys = primaryFeature.points.map((p) => p.y);
  const pixelWidth = Math.max(...xs) - Math.min(...xs);
  const pixelHeight = Math.max(...ys) - Math.min(...ys);

  // Estimate component type and dimensions based on pixel size and proportions
  const aspectRatio = pixelWidth / pixelHeight;
  let estimatedWidth: number;
  let estimatedHeight: number;
  let estimatedDepth: number;
  let componentType: string;

  if (pixelWidth < 100) {
    // Small components: handles, switches, small fixtures
    estimatedWidth = 0.05; // 5cm
    estimatedHeight = 0.03; // 3cm
    estimatedDepth = 0.02; // 2cm
    componentType = "small_fitting";
  } else if (pixelWidth < 200) {
    // Medium components: cabinet doors, drawers, small furniture
    if (aspectRatio > 1.5) {
      estimatedWidth = 0.4; // 40cm
      estimatedHeight = 0.25; // 25cm
      estimatedDepth = 0.05; // 5cm
      componentType = "cabinet_door";
    } else {
      estimatedWidth = 0.3; // 30cm
      estimatedHeight = 0.3; // 30cm
      estimatedDepth = 0.15; // 15cm
      componentType = "drawer";
    }
  } else if (pixelWidth < 400) {
    // Large components: countertops, seating, tables
    if (aspectRatio > 2) {
      estimatedWidth = 1.2; // 120cm
      estimatedHeight = 0.6; // 60cm
      estimatedDepth = 0.05; // 5cm (countertop)
      componentType = "countertop";
    } else if (aspectRatio < 0.7) {
      estimatedWidth = 0.6; // 60cm
      estimatedHeight = 0.8; // 80cm
      estimatedDepth = 0.6; // 60cm
      componentType = "seating";
    } else {
      estimatedWidth = 0.8; // 80cm
      estimatedHeight = 0.4; // 40cm
      estimatedDepth = 0.6; // 60cm
      componentType = "table";
    }
  } else {
    // Very large components: bulkheads, large furniture
    estimatedWidth = 2.0; // 200cm
    estimatedHeight = 2.0; // 200cm
    estimatedDepth = 0.1; // 10cm
    componentType = "bulkhead";
  }

  const confidence = primaryFeature.confidence || 0.6;

  return {
    width: estimatedWidth,
    height: estimatedHeight,
    depth: estimatedDepth,
    type: componentType,
    confidence,
  };
};

// Estimate yacht dimensions based on typical proportions
export const estimateYachtDimensions = (
  features: YachtFeature[]
): {
  width: number;
  height: number;
  depth: number;
  type: string;
  confidence: number;
} => {
  if (features.length === 0) {
    return { width: 0, height: 0, depth: 0, type: "unknown", confidence: 0 };
  }

  // Find the feature with the largest span (likely the hull)
  let maxSpan = 0;
  let hullFeature = features[0];

  features.forEach((feature) => {
    if (feature.points.length >= 2) {
      const xs = feature.points.map((p) => p.x);
      const ys = feature.points.map((p) => p.y);
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);
      const span = Math.max(width, height);

      if (span > maxSpan) {
        maxSpan = span;
        hullFeature = feature;
      }
    }
  });

  // Estimate based on pixel dimensions and typical yacht proportions
  let estimatedLength: number;
  let estimatedBeam: number;
  if (maxSpan < 300) {
    estimatedLength = 8; // Small yacht estimate
    estimatedBeam = 2.3; // 8m / 3.5
  } else if (maxSpan < 600) {
    estimatedLength = 15; // Medium yacht
    estimatedBeam = 3.75; // 15m / 4
  } else {
    estimatedLength = 25; // Large yacht
    estimatedBeam = 5.5; // 25m / 4.5
  }

  const confidence = hullFeature.confidence || 0.6;

  return {
    width: estimatedLength,
    height: estimatedBeam,
    depth: estimatedLength / 8, // Draft estimate
    type: "yacht",
    confidence,
  };
};

// General object estimation
export const estimateGeneralDimensions = (
  features: YachtFeature[]
): {
  width: number;
  height: number;
  depth: number;
  type: string;
  confidence: number;
} => {
  if (features.length === 0) {
    return { width: 0, height: 0, depth: 0, type: "unknown", confidence: 0 };
  }

  // Find largest feature
  let maxSpan = 0;
  let primaryFeature = features[0];

  features.forEach((feature) => {
    if (feature.points.length >= 2) {
      const xs = feature.points.map((p) => p.x);
      const ys = feature.points.map((p) => p.y);
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);
      const span = Math.max(width, height);

      if (span > maxSpan) {
        maxSpan = span;
        primaryFeature = feature;
      }
    }
  });

  // General size estimation based on pixels
  let estimatedSize: number;
  if (maxSpan < 200) {
    estimatedSize = 0.3; // 30cm - small object
  } else if (maxSpan < 400) {
    estimatedSize = 1.0; // 1m - medium object
  } else {
    estimatedSize = 3.0; // 3m - large object
  }

  const confidence = primaryFeature.confidence || 0.5;

  return {
    width: estimatedSize,
    height: estimatedSize * 0.7,
    depth: estimatedSize * 0.3,
    type: "general_object",
    confidence,
  };
};

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
          "0",
          "LINE",
          "8",
          feature.type.toUpperCase(),
          "10",
          (p1.x / scale).toFixed(3),
          "20",
          (p1.y / scale).toFixed(3),
          "11",
          (p2.x / scale).toFixed(3),
          "21",
          (p2.y / scale).toFixed(3)
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

  lines.push(
    `<svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">`
  );
  lines.push('<g stroke="black" stroke-width="1" fill="none">');

  features.forEach((feature) => {
    if (feature.points.length >= 2) {
      for (let i = 0; i < feature.points.length - 1; i++) {
        const p1 = feature.points[i];
        const p2 = feature.points[i + 1];
        lines.push(
          `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" />`
        );
      }
    }
  });

  lines.push("</g>");
  lines.push("</svg>");

  return lines.join("\n");
};

// DXF with dimension annotations
export const generateDXFWithDimensions = (
  features: YachtFeature[],
  scale: number,
  estimates: {
    width: number;
    height: number;
    depth: number;
    type: string;
    confidence: number;
  }
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
          "0",
          "LINE",
          "8",
          feature.type.toUpperCase(),
          "10",
          (p1.x / scale).toFixed(3),
          "20",
          (p1.y / scale).toFixed(3),
          "11",
          (p2.x / scale).toFixed(3),
          "21",
          (p2.y / scale).toFixed(3)
        );
      }
    }
  });

  // Add dimension text annotations for furniture/components
  lines.push(
    "0",
    "TEXT",
    "8",
    "DIMENSIONS",
    "10",
    "10",
    "20",
    "10",
    "40",
    "2.0",
    "1",
    `${estimates.type.toUpperCase()}: W${(estimates.width * 100).toFixed(
      0
    )}cm x H${(estimates.height * 100).toFixed(0)}cm x D${(
      estimates.depth * 100
    ).toFixed(0)}cm`,
    "0",
    "TEXT",
    "8",
    "DIMENSIONS",
    "10",
    "10",
    "20",
    "15",
    "40",
    "2.0",
    "1",
    `CONFIDENCE: ${(estimates.confidence * 100).toFixed(0)}%`
  );

  // DXF footer
  lines.push("0", "ENDSEC", "0", "EOF");

  return lines.join("\n");
};

// SVG with dimension annotations
export const generateSVGWithDimensions = (
  features: YachtFeature[],
  scale: number,
  canvasWidth: number,
  canvasHeight: number,
  estimates: {
    width: number;
    height: number;
    depth: number;
    type: string;
    confidence: number;
  }
): string => {
  const lines: string[] = [];

  lines.push(
    `<svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">`
  );
  lines.push('<g stroke="black" stroke-width="1" fill="none">');

  // Draw lines
  features.forEach((feature) => {
    if (feature.points.length >= 2) {
      for (let i = 0; i < feature.points.length - 1; i++) {
        const p1 = feature.points[i];
        const p2 = feature.points[i + 1];
        lines.push(
          `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" />`
        );
      }
    }
  });

  lines.push("</g>");

  // Add dimension annotations for furniture/components
  lines.push(
    '<g fill="blue" font-family="Arial" font-size="14" font-weight="bold">'
  );
  lines.push(
    `<text x="10" y="25">TYPE: ${estimates.type.toUpperCase()}</text>`
  );
  lines.push(
    `<text x="10" y="45">WIDTH: ${(estimates.width * 100).toFixed(0)}cm</text>`
  );
  lines.push(
    `<text x="10" y="65">HEIGHT: ${(estimates.height * 100).toFixed(
      0
    )}cm</text>`
  );
  lines.push(
    `<text x="10" y="85">DEPTH: ${(estimates.depth * 100).toFixed(0)}cm</text>`
  );
  lines.push(
    `<text x="10" y="105">CONFIDENCE: ${(estimates.confidence * 100).toFixed(
      0
    )}%</text>`
  );
  lines.push("</g>");

  lines.push("</svg>");

  return lines.join("\n");
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
  conversionMode: ProcessingSettings["conversionMode"] = "interior",
  originalImage?: HTMLImageElement
): string => {
  // Get dimension estimates based on conversion mode
  let estimates: {
    width: number;
    height: number;
    depth: number;
    type: string;
    confidence: number;
  };

  switch (conversionMode) {
    case "yacht":
      estimates = estimateYachtDimensions(features);
      break;
    case "general":
      estimates = estimateGeneralDimensions(features);
      break;
    case "interior":
    default:
      estimates = estimateComponentDimensions(features);
      break;
  }

  switch (format) {
    case "dxf":
      return generateDXFWithDimensions(features, scale, estimates);
    case "svg":
      return generateSVGWithDimensions(
        features,
        scale,
        canvasWidth,
        canvasHeight,
        estimates
      );
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
      const getScaleMessage = () => {
        switch (conversionMode) {
          case "yacht":
            return `SCALE CALIBRATION

YACHT ANALYSIS:
Type: ${estimates.type.toUpperCase()}
Length: ${estimates.width.toFixed(1)}m
Beam: ${estimates.height.toFixed(1)}m
Draft: ${estimates.depth.toFixed(1)}m
Confidence: ${(estimates.confidence * 100).toFixed(0)}%

NOTES:
- Estimates based on typical yacht proportions
- Suitable for full yacht documentation
- Scale: 1:${scale}`;
          case "general":
            return `SCALE CALIBRATION

OBJECT ANALYSIS:
Type: ${estimates.type.toUpperCase()}
Width: ${estimates.width.toFixed(1)}m
Height: ${estimates.height.toFixed(1)}m
Depth: ${estimates.depth.toFixed(1)}m
Confidence: ${(estimates.confidence * 100).toFixed(0)}%

NOTES:
- General object size estimation
- Basic dimensional analysis
- Scale: 1:${scale}`;
          case "interior":
          default:
            return `SCALE CALIBRATION

COMPONENT ANALYSIS:
Type: ${estimates.type.toUpperCase()}
Width: ${(estimates.width * 100).toFixed(0)}cm
Height: ${(estimates.height * 100).toFixed(0)}cm  
Depth: ${(estimates.depth * 100).toFixed(0)}cm
Confidence: ${(estimates.confidence * 100).toFixed(0)}%

NOTES:
- Estimates based on typical furniture/interior proportions
- Suitable for yacht interior components
- Scale: 1:${scale}`;
        }
      };
      return getScaleMessage();
  }
};
