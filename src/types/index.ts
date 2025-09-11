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
