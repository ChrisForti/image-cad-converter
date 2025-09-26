export interface Point {
  x: number;
  y: number;
}

export interface ReferencePoint extends Point {
  id: number;
}

export interface YachtFeature {
  type: "hull_profile" | "waterline" | "mast" | "deck_edge" | "cabin" | "keel";
  points: Point[];
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface ProcessingSettings {
  edgeMethod: "canny" | "sobel" | "laplacian";
  threshold: number;
  scale: number;
  outputFormat: "dxf" | "svg" | "json";
  conversionMode: "yacht" | "interior" | "general";
}

export interface CADMetadata {
  generator: string;
  scale: number;
  units: string;
  timestamp: string;
  imageInfo: {
    width: number;
    height: number;
    originalDimensions?: {
      width: number;
      height: number;
    };
  };
}

export interface CADOutput {
  metadata: CADMetadata;
  features: YachtFeature[];
  referencePoints: ReferencePoint[];
}

export type EdgeDetectionMethod = (
  imageData: ImageData,
  threshold: number
) => ImageData;

export interface BackgroundRemovalState {
  enabled: boolean;
  method: "auto" | "manual" | "color";
  threshold: number;
  excludeColors: string[];
  tolerance: number;
  isSelecting: boolean;
  maskData: ImageData | null;
  selectedAreas: Set<string>;
  previewMode: boolean;
}
