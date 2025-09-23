import { useState } from "react";
import {
  Download,
  FileText,
  Image,
  Settings,
  Layers,
  Grid,
  Ruler,
} from "lucide-react";
import { CADOutput } from "../../types/index.js";
import {
  exportToDXF,
  exportToEnhancedSVG,
  downloadDXF,
  downloadSVG,
  DXFExportOptions,
  SVGExportOptions,
} from "../../utils/cadExport.js";

interface CADExportPanelProps {
  cadOutput: CADOutput | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CADExportPanel({
  cadOutput,
  isOpen,
  onClose,
}: CADExportPanelProps) {
  const [exportFormat, setExportFormat] = useState<"dxf" | "svg">("dxf");
  const [isExporting, setIsExporting] = useState(false);

  // DXF Export Options
  const [dxfOptions, setDxfOptions] = useState<DXFExportOptions>({
    scale: 1.0,
    units: "mm",
    layersByFeatureType: true,
    includeMetadata: true,
  });

  // SVG Export Options
  const [svgOptions, setSvgOptions] = useState<SVGExportOptions>({
    scale: 2.0,
    strokeWidth: 1.5,
    includeGrid: true,
    includeDimensions: true,
    colorByFeatureType: true,
  });

  const handleExport = async () => {
    if (!cadOutput) return;

    setIsExporting(true);

    try {
      if (exportFormat === "dxf") {
        const dxfContent = exportToDXF(cadOutput, dxfOptions);
        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/[:.]/g, "-");
        downloadDXF(dxfContent, `cad-export-${timestamp}.dxf`);
      } else if (exportFormat === "svg") {
        const svgContent = exportToEnhancedSVG(cadOutput, svgOptions);
        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/[:.]/g, "-");
        downloadSVG(svgContent, `cad-export-${timestamp}.svg`);
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Export CAD File</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setExportFormat("dxf")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  exportFormat === "dxf"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="font-medium">DXF</div>
                <div className="text-sm text-gray-500">AutoCAD Compatible</div>
              </button>

              <button
                onClick={() => setExportFormat("svg")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  exportFormat === "svg"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Image className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="font-medium">SVG</div>
                <div className="text-sm text-gray-500">Vector Graphics</div>
              </button>
            </div>
          </div>

          {/* DXF Options */}
          {exportFormat === "dxf" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium">DXF Export Options</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scale Factor
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    value={dxfOptions.scale}
                    onChange={(e) =>
                      setDxfOptions((prev) => ({
                        ...prev,
                        scale: parseFloat(e.target.value) || 1.0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Units
                  </label>
                  <select
                    value={dxfOptions.units}
                    onChange={(e) =>
                      setDxfOptions((prev) => ({
                        ...prev,
                        units: e.target.value as
                          | "mm"
                          | "inches"
                          | "feet"
                          | "meters",
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="mm">Millimeters</option>
                    <option value="inches">Inches</option>
                    <option value="feet">Feet</option>
                    <option value="meters">Meters</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={dxfOptions.layersByFeatureType}
                    onChange={(e) =>
                      setDxfOptions((prev) => ({
                        ...prev,
                        layersByFeatureType: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Layers className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">
                    Separate layers by feature type
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={dxfOptions.includeMetadata}
                    onChange={(e) =>
                      setDxfOptions((prev) => ({
                        ...prev,
                        includeMetadata: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">Include metadata as text</span>
                </label>
              </div>
            </div>
          )}

          {/* SVG Options */}
          {exportFormat === "svg" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium">SVG Export Options</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scale Factor
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={svgOptions.scale}
                    onChange={(e) =>
                      setSvgOptions((prev) => ({
                        ...prev,
                        scale: parseFloat(e.target.value) || 2.0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stroke Width
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="5"
                    value={svgOptions.strokeWidth}
                    onChange={(e) =>
                      setSvgOptions((prev) => ({
                        ...prev,
                        strokeWidth: parseFloat(e.target.value) || 1.5,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={svgOptions.includeGrid}
                    onChange={(e) =>
                      setSvgOptions((prev) => ({
                        ...prev,
                        includeGrid: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Grid className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">Include background grid</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={svgOptions.includeDimensions}
                    onChange={(e) =>
                      setSvgOptions((prev) => ({
                        ...prev,
                        includeDimensions: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Ruler className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">Include dimensions</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={svgOptions.colorByFeatureType}
                    onChange={(e) =>
                      setSvgOptions((prev) => ({
                        ...prev,
                        colorByFeatureType: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Layers className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">Color by feature type</span>
                </label>
              </div>
            </div>
          )}

          {/* Export Summary */}
          {cadOutput && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Export Summary</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Features: {cadOutput.features.length}</div>
                <div>Reference Points: {cadOutput.referencePoints.length}</div>
                <div>Original Scale: {cadOutput.metadata.scale}</div>
                <div>
                  Image Size: {cadOutput.metadata.imageInfo.width} ×{" "}
                  {cadOutput.metadata.imageInfo.height}px
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleExport}
            disabled={!cadOutput || isExporting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
