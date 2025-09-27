import React from "react";
import { Target, X } from "lucide-react";

interface BackgroundRemovalState {
  enabled: boolean;
  method: "auto" | "manual" | "ai";
  threshold: number;
  excludeColors: string[];
  tolerance: number;
  isSelecting: boolean;
  maskData: ImageData | null;
  selectedAreas: Set<string>;
  previewMode: boolean;
  selectionMode: "fine" | "medium" | "coarse";
  isActive: boolean;
}

interface ImageToolsModalProps {
  backgroundRemoval: BackgroundRemovalState;
  setBackgroundRemoval: React.Dispatch<
    React.SetStateAction<BackgroundRemovalState>
  >;
  applySelection: () => void;
  clearSelection: () => void;
  resetBackgroundRemoval: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageToolsModal: React.FC<ImageToolsModalProps> = ({
  backgroundRemoval,
  setBackgroundRemoval,
  applySelection,
  clearSelection,
  resetBackgroundRemoval,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-lg border border-white/20 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-medium text-white flex items-center gap-2">
            <Target className="w-6 h-6" />
            Image Tools
            {backgroundRemoval.enabled && (
              <span className="text-sm text-purple-400 ml-2">✓ Active</span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Background Removal Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={backgroundRemoval.enabled}
                onChange={(e) =>
                  setBackgroundRemoval((prev) => ({
                    ...prev,
                    enabled: e.target.checked,
                  }))
                }
                className="w-5 h-5 text-purple-500 rounded focus:ring-purple-400"
              />
              <span className="text-white">Remove marine backgrounds</span>
            </label>
          </div>

          {/* Background Removal Controls */}
          {backgroundRemoval.enabled && (
            <>
              {/* Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Removal Method
                </label>
                <select
                  value={backgroundRemoval.method}
                  onChange={(e) =>
                    setBackgroundRemoval((prev) => ({
                      ...prev,
                      method: e.target.value as "auto" | "manual" | "ai",
                    }))
                  }
                  className="w-full p-3 bg-white/90 text-gray-800 rounded-lg"
                >
                  <option value="manual">Magic Wand</option>
                  <option value="ai">AI Assistant</option>
                  <option value="auto">Auto Detect</option>
                </select>

                {/* Method Instructions */}
                <div className="mt-2 text-sm text-gray-400">
                  {backgroundRemoval.method === "manual" && (
                    <p>
                      💡 Click Magic Wand, then click areas to remove. Works
                      great for complex backgrounds.
                    </p>
                  )}
                  {backgroundRemoval.method === "ai" && (
                    <p>
                      AI-powered background removal. One-click solution using
                      advanced machine learning. Perfect for complex yacht
                      shapes.
                    </p>
                  )}
                  {backgroundRemoval.method === "auto" && (
                    <p>
                      💡 AI-powered detection for installed marine parts and
                      equipment.
                    </p>
                  )}
                </div>
              </div>

              {/* Manual Selection Tools */}
              {backgroundRemoval.method === "manual" && (
                <>
                  {/* Tolerance Slider */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Selection Tolerance: {backgroundRemoval.tolerance}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={backgroundRemoval.tolerance}
                      onChange={(e) =>
                        setBackgroundRemoval((prev) => ({
                          ...prev,
                          tolerance: parseInt(e.target.value),
                        }))
                      }
                      className="w-full h-2"
                    />
                  </div>

                  {/* Magic Wand Button */}
                  <button
                    onClick={() =>
                      setBackgroundRemoval((prev) => ({
                        ...prev,
                        isSelecting: !prev.isSelecting,
                      }))
                    }
                    className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      backgroundRemoval.isSelecting
                        ? "bg-purple-500 text-white shadow-lg"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    🎯{" "}
                    {backgroundRemoval.isSelecting
                      ? "Click Image to Select"
                      : "Magic Wand"}
                  </button>

                  {/* Selection Count */}
                  {backgroundRemoval.selectedAreas.size > 0 && (
                    <div className="text-center py-2 bg-blue-500/20 text-blue-300 rounded-lg">
                      {backgroundRemoval.selectedAreas.size} pixels selected
                    </div>
                  )}

                  {/* Apply/Clear Buttons */}
                  {backgroundRemoval.selectedAreas.size > 0 && (
                    <div className="flex gap-3">
                      <button
                        onClick={applySelection}
                        className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all"
                      >
                        ✓ Apply Removal
                      </button>
                      <button
                        onClick={clearSelection}
                        className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-all"
                      >
                        ↻ Clear Selection
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Reset Button */}
              <button
                onClick={resetBackgroundRemoval}
                className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all"
              >
                Reset to Original
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
