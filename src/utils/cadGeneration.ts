import {
  YachtFeature,
  ProcessingSettings,
  CADOutput,
  ReferencePoint,
} from "../types/index.js";

export const generateDXF = (
  features: YachtFeature[],
  scale: number
): string => {
  let dxf = `0
SECTION
2
ENTITIES
`;

  features.forEach((feature, index) => {
    if (feature.type === "hull_profile" || feature.type === "deck_edge") {
      dxf += `0
POLYLINE
8
${feature.type.toUpperCase()}
62
${index + 1}
70
0
`;
      feature.points.forEach((point) => {
        const worldX = point.x / scale;
        const worldY = point.y / scale;
        dxf += `0
VERTEX
8
${feature.type.toUpperCase()}
10
${worldX.toFixed(3)}
20
${worldY.toFixed(3)}
`;
      });
      dxf += `0
SEQEND
`;
    } else if (feature.points.length >= 2) {
      const p1 = feature.points[0];
      const p2 = feature.points[feature.points.length - 1];
      dxf += `0
LINE
8
${feature.type.toUpperCase()}
62
${index + 1}
10
${(p1.x / scale).toFixed(3)}
20
${(p1.y / scale).toFixed(3)}
11
${(p2.x / scale).toFixed(3)}
21
${(p2.y / scale).toFixed(3)}
`;
    }
  });

  dxf += `0
ENDSEC
0
EOF`;

  return dxf;
};

export const generateSVG = (
  features: YachtFeature[],
  scale: number,
  canvasWidth: number,
  canvasHeight: number
): string => {
  let svg = `<svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .hull_profile { stroke: #2c5aa0; stroke-width: 2; fill: none; }
      .waterline { stroke: #4a90e2; stroke-width: 3; }
      .mast { stroke: #8b4513; stroke-width: 4; }
      .deck_edge { stroke: #d2b48c; stroke-width: 2; fill: none; }
      .cabin { stroke: #8fbc8f; stroke-width: 2; fill: none; }
      .keel { stroke: #2f4f4f; stroke-width: 3; }
    </style>
  </defs>
`;

  features.forEach((feature) => {
    if (feature.type === "hull_profile" || feature.type === "deck_edge") {
      if (feature.points.length > 0) {
        let path = `M ${feature.points[0].x} ${feature.points[0].y}`;
        for (let i = 1; i < feature.points.length; i++) {
          path += ` L ${feature.points[i].x} ${feature.points[i].y}`;
        }
        svg += `  <path d="${path}" class="${feature.type}" />\n`;
      }
    } else if (feature.points.length >= 2) {
      const p1 = feature.points[0];
      const p2 = feature.points[feature.points.length - 1];
      svg += `  <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" class="${feature.type}" />\n`;
    }
  });

  svg += "</svg>";
  return svg;
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
      generator: "Yacht Photo to CAD Converter v2.0",
      scale: scale,
      units: "meters",
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
      return "";
  }
};
