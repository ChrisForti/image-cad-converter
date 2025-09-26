import { YachtFeature, Point, CADOutput } from "../types/index.js";

// DXF Export functionality
export interface DXFExportOptions {
  scale: number;
  units: "mm" | "inches" | "feet" | "meters";
  layersByFeatureType: boolean;
  includeMetadata: boolean;
}

export interface SVGExportOptions {
  scale: number;
  strokeWidth: number;
  includeGrid: boolean;
  includeDimensions: boolean;
  colorByFeatureType: boolean;
}

// DXF file structure builder
class DXFBuilder {
  private content: string[] = [];
  private entityHandle = 100;

  constructor() {
    this.addHeader();
  }

  private addHeader() {
    this.content.push(
      "0",
      "SECTION",
      "2",
      "HEADER",
      "9",
      "$ACADVER",
      "1",
      "AC1015", // AutoCAD 2000 format
      "9",
      "$HANDSEED",
      "5",
      "FFFF",
      "0",
      "ENDSEC"
    );
  }

  addLayer(layerName: string, color: number = 7) {
    if (!this.content.includes("SECTION") || !this.content.includes("TABLES")) {
      this.content.push("0", "SECTION", "2", "TABLES");
    }

    this.content.push(
      "0",
      "LAYER",
      "5",
      this.getNextHandle(),
      "2",
      layerName,
      "70",
      "0",
      "62",
      color.toString(),
      "6",
      "CONTINUOUS"
    );
  }

  addLine(start: Point, end: Point, layer: string = "0") {
    this.content.push(
      "0",
      "LINE",
      "5",
      this.getNextHandle(),
      "8",
      layer,
      "10",
      start.x.toFixed(6),
      "20",
      start.y.toFixed(6),
      "30",
      "0.0",
      "11",
      end.x.toFixed(6),
      "21",
      end.y.toFixed(6),
      "31",
      "0.0"
    );
  }

  addPolyline(points: Point[], layer: string = "0", closed: boolean = false) {
    this.content.push(
      "0",
      "LWPOLYLINE",
      "5",
      this.getNextHandle(),
      "8",
      layer,
      "90",
      points.length.toString(),
      "70",
      closed ? "1" : "0"
    );

    points.forEach((point) => {
      this.content.push("10", point.x.toFixed(6), "20", point.y.toFixed(6));
    });
  }

  addCircle(center: Point, radius: number, layer: string = "0") {
    this.content.push(
      "0",
      "CIRCLE",
      "5",
      this.getNextHandle(),
      "8",
      layer,
      "10",
      center.x.toFixed(6),
      "20",
      center.y.toFixed(6),
      "30",
      "0.0",
      "40",
      radius.toFixed(6)
    );
  }

  addText(
    text: string,
    position: Point,
    height: number = 2.5,
    layer: string = "0"
  ) {
    this.content.push(
      "0",
      "TEXT",
      "5",
      this.getNextHandle(),
      "8",
      layer,
      "10",
      position.x.toFixed(6),
      "20",
      position.y.toFixed(6),
      "30",
      "0.0",
      "40",
      height.toFixed(6),
      "1",
      text
    );
  }

  private getNextHandle(): string {
    return (this.entityHandle++).toString(16).toUpperCase();
  }

  build(): string {
    // Add entities section header
    this.content.push("0", "SECTION", "2", "ENTITIES");

    // Close entities section and file
    this.content.push("0", "ENDSEC", "0", "EOF");

    return this.content.join("\n");
  }
}

// SVG Export functionality
class SVGBuilder {
  private elements: string[] = [];
  private defs: string[] = [];
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  addGrid(spacing: number = 10, strokeWidth: number = 0.5) {
    const lines: string[] = [];

    // Vertical lines
    for (let x = 0; x <= this.width; x += spacing) {
      lines.push(
        `<line x1="${x}" y1="0" x2="${x}" y2="${this.height}" stroke="#e0e0e0" stroke-width="${strokeWidth}" />`
      );
    }

    // Horizontal lines
    for (let y = 0; y <= this.height; y += spacing) {
      lines.push(
        `<line x1="0" y1="${y}" x2="${this.width}" y2="${y}" stroke="#e0e0e0" stroke-width="${strokeWidth}" />`
      );
    }

    this.elements.unshift(...lines);
  }

  addPath(
    points: Point[],
    color: string = "#000",
    strokeWidth: number = 1,
    closed: boolean = false
  ) {
    if (points.length < 2) return;

    let pathData = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

    for (let i = 1; i < points.length; i++) {
      pathData += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
    }

    if (closed) {
      pathData += " Z";
    }

    this.elements.push(
      `<path d="${pathData}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`
    );
  }

  addCircle(
    center: Point,
    radius: number,
    color: string = "#000",
    strokeWidth: number = 1
  ) {
    this.elements.push(
      `<circle cx="${center.x.toFixed(2)}" cy="${center.y.toFixed(
        2
      )}" r="${radius.toFixed(
        2
      )}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />`
    );
  }

  addText(
    text: string,
    position: Point,
    fontSize: number = 12,
    color: string = "#000"
  ) {
    this.elements.push(
      `<text x="${position.x.toFixed(2)}" y="${position.y.toFixed(
        2
      )}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="${color}">${text}</text>`
    );
  }

  addDimension(
    start: Point,
    end: Point,
    offset: number = 20,
    color: string = "#666"
  ) {
    const distance = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    // Calculate perpendicular offset
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const perpAngle = angle + Math.PI / 2;
    const offsetX = Math.cos(perpAngle) * offset;
    const offsetY = Math.sin(perpAngle) * offset;

    const dimStart = { x: start.x + offsetX, y: start.y + offsetY };
    const dimEnd = { x: end.x + offsetX, y: end.y + offsetY };
    const dimMid = { x: midX + offsetX, y: midY + offsetY };

    // Dimension line
    this.addPath([dimStart, dimEnd], color, 1);

    // Extension lines
    this.addPath([start, dimStart], color, 0.5);
    this.addPath([end, dimEnd], color, 0.5);

    // Dimension text
    this.addText(distance.toFixed(1), dimMid, 10, color);
  }

  build(): string {
    const defsSection =
      this.defs.length > 0 ? `<defs>${this.defs.join("\n")}</defs>` : "";

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${
      this.height
    }" viewBox="0 0 ${this.width} ${this.height}">
  ${defsSection}
  ${this.elements.join("\n")}
</svg>`;
  }
}

// Main export functions
export function exportToDXF(
  cadOutput: CADOutput,
  options: DXFExportOptions
): string {
  const dxf = new DXFBuilder();

  // Calculate scaling factor
  const scaleFactor = calculateScaleFactor(
    cadOutput,
    options.scale,
    options.units
  );

  // Add layers if requested
  if (options.layersByFeatureType) {
    const featureTypes = new Set(cadOutput.features.map((f) => f.type));
    const colors = [1, 2, 3, 4, 5, 6]; // Red, Yellow, Green, Cyan, Blue, Magenta

    Array.from(featureTypes).forEach((type, index) => {
      dxf.addLayer(type.toUpperCase(), colors[index % colors.length]);
    });
  }

  // Add features as geometry
  cadOutput.features.forEach((feature) => {
    const scaledPoints = feature.points.map((p) => ({
      x: p.x * scaleFactor,
      y: p.y * scaleFactor,
    }));

    const layerName = options.layersByFeatureType
      ? feature.type.toUpperCase()
      : "0";

    if (feature.type === "hull_profile" || feature.type === "deck_edge") {
      // Use polylines for profiles
      dxf.addPolyline(scaledPoints, layerName, true);
    } else if (feature.type === "mast") {
      // Use circles for masts
      if (scaledPoints.length >= 2) {
        const radius = Math.abs(scaledPoints[1].x - scaledPoints[0].x) / 2;
        dxf.addCircle(scaledPoints[0], radius, layerName);
      }
    } else {
      // Use lines for other features
      for (let i = 0; i < scaledPoints.length - 1; i++) {
        dxf.addLine(scaledPoints[i], scaledPoints[i + 1], layerName);
      }
    }
  });

  // Add metadata as text if requested
  if (options.includeMetadata) {
    const metadata = cadOutput.metadata;
    let yPos = 10;

    dxf.addText(
      `Generated: ${metadata.timestamp}`,
      { x: 10, y: yPos },
      2.5,
      "METADATA"
    );
    yPos += 5;
    dxf.addText(
      `Scale: ${metadata.scale}`,
      { x: 10, y: yPos },
      2.5,
      "METADATA"
    );
    yPos += 5;
    dxf.addText(`Units: ${options.units}`, { x: 10, y: yPos }, 2.5, "METADATA");
  }

  return dxf.build();
}

export function exportToEnhancedSVG(
  cadOutput: CADOutput,
  options: SVGExportOptions
): string {
  // Calculate canvas size
  const bounds = calculateBounds(cadOutput.features);
  const padding = 50;
  const width = (bounds.maxX - bounds.minX) * options.scale + 2 * padding;
  const height = (bounds.maxY - bounds.minY) * options.scale + 2 * padding;

  const svg = new SVGBuilder(width, height);

  // Add grid if requested
  if (options.includeGrid) {
    svg.addGrid(options.scale * 10);
  }

  // Feature type colors
  const featureColors: Record<string, string> = {
    hull_profile: "#2563eb", // Blue
    waterline: "#06b6d4", // Cyan
    mast: "#dc2626", // Red
    deck_edge: "#ea580c", // Orange
    cabin: "#16a34a", // Green
    keel: "#7c3aed", // Purple
  };

  // Add features
  cadOutput.features.forEach((feature) => {
    const scaledPoints = feature.points.map((p) => ({
      x: (p.x - bounds.minX) * options.scale + padding,
      y: (p.y - bounds.minY) * options.scale + padding,
    }));

    const color = options.colorByFeatureType
      ? featureColors[feature.type] || "#000000"
      : "#000000";

    if (feature.type === "mast" && scaledPoints.length >= 2) {
      // Draw masts as circles
      const radius = Math.abs(scaledPoints[1].x - scaledPoints[0].x) / 2;
      svg.addCircle(scaledPoints[0], radius, color, options.strokeWidth);
    } else {
      // Draw as paths
      const closed =
        feature.type === "hull_profile" || feature.type === "deck_edge";
      svg.addPath(scaledPoints, color, options.strokeWidth, closed);
    }

    // Add feature labels
    if (scaledPoints.length > 0) {
      const labelPos = {
        x: scaledPoints[0].x + 5,
        y: scaledPoints[0].y - 5,
      };
      svg.addText(feature.type.replace("_", " "), labelPos, 10, color);
    }
  });

  // Add dimensions if requested
  if (options.includeDimensions) {
    cadOutput.features.forEach((feature) => {
      if (feature.points.length >= 2) {
        const scaledPoints = feature.points.map((p) => ({
          x: (p.x - bounds.minX) * options.scale + padding,
          y: (p.y - bounds.minY) * options.scale + padding,
        }));

        // Add dimension for first segment
        svg.addDimension(scaledPoints[0], scaledPoints[1], 30);
      }
    });
  }

  return svg.build();
}

// Helper functions
function calculateScaleFactor(
  cadOutput: CADOutput,
  targetScale: number,
  units: string
): number {
  const baseScale = cadOutput.metadata.scale;
  const unitMultipliers: Record<string, number> = {
    mm: 1,
    inches: 25.4,
    feet: 304.8,
    meters: 1000,
  };

  return (targetScale / baseScale) * (unitMultipliers[units] || 1);
}

function calculateBounds(features: YachtFeature[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  if (features.length === 0) {
    return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  features.forEach((feature) => {
    feature.points.forEach((point) => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });
  });

  return { minX, maxX, minY, maxY };
}

// File download helpers
export function downloadDXF(
  dxfContent: string,
  filename: string = "cad-export.dxf"
) {
  const blob = new Blob([dxfContent], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadSVG(
  svgContent: string,
  filename: string = "cad-export.svg"
) {
  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
