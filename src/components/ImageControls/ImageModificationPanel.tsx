import React, { useState } from "react";
import { Target, Sparkles, Loader2 } from "lucide-react";

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

interface ImageModificationPanelProps {
  backgroundRemoval: BackgroundRemovalState;
  setBackgroundRemoval: React.Dispatch<
    React.SetStateAction<BackgroundRemovalState>
  >;
  applySelection: () => void;
  clearSelection: () => void;
  resetBackgroundRemoval: () => void;
  undoSelection?: () => void;
  redoSelection?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onAIBackgroundRemoval?: (canvas: HTMLCanvasElement) => Promise<void>;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export const ImageModificationPanel: React.FC<ImageModificationPanelProps> = ({
  backgroundRemoval,
  setBackgroundRemoval,
  applySelection,
  clearSelection,
  resetBackgroundRemoval,
  undoSelection,
  redoSelection,
  canUndo = false,
  canRedo = false,
  onAIBackgroundRemoval,
  isVisible,
  onToggleVisibility,
}) => {
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        className="w-full px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-300/30 rounded-lg text-sm text-purple-200 hover:text-white transition-all flex items-center gap-2"
      >
        <Target className="w-4 h-4" />
        Show Image Tools
      </button>
    );
  }

  return (
    <div className="bg-white/5 rounded-lg border border-purple-300/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-blue-200 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Image Tools
          {backgroundRemoval.enabled && (
            <span className="text-sm text-purple-400 ml-2">✓ Active</span>
          )}
        </h3>
        <button
          onClick={onToggleVisibility}
          className="text-gray-400 hover:text-white text-xl"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        {/* Background Removal Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={backgroundRemoval.enabled}
              onChange={(e) =>
                setBackgroundRemoval((prev) => ({
                  ...prev,
                  enabled: e.target.checked,
                }))
              }
              className="w-4 h-4 text-purple-500 rounded focus:ring-purple-400"
            />
            <span className="text-sm text-blue-200">
              Remove marine backgrounds
            </span>
          </label>
        </div>

        {/* Background Removal Controls */}
        {backgroundRemoval.enabled && (
          <>
            {/* Method Selection */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
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
                className="w-full p-2 bg-white/90 text-gray-800 rounded-lg text-sm"
              >
                <option value="manual">Magic Wand</option>
                <option value="ai">AI Assistant</option>
                <option value="auto">Auto Detect</option>
              </select>

              {/* Method Instructions */}
              <div className="mt-2 text-xs text-blue-300">
                {backgroundRemoval.method === "manual" && (
                  <p>
                    💡 Click Magic Wand, then click areas to remove. Works great
                    for complex backgrounds.
                  </p>
                )}
                {backgroundRemoval.method === "ai" && (
                  <p>
                    AI-powered background removal. One-click solution using
                    advanced machine learning. Perfect for complex yacht shapes.
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
                  <label className="block text-sm font-medium text-blue-200 mb-2">
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
                    className="w-full"
                  />
                </div>

                {/* Magic Wand Button */}
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() =>
                      setBackgroundRemoval((prev) => ({
                        ...prev,
                        isSelecting: !prev.isSelecting,
                      }))
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      backgroundRemoval.isSelecting
                        ? "bg-purple-500 text-white shadow-lg"
                        : "bg-white/10 text-blue-200 hover:bg-white/20"
                    }`}
                  >
                    🎯{" "}
                    {backgroundRemoval.isSelecting
                      ? "Click Image to Select"
                      : "Magic Wand"}
                  </button>

                  {backgroundRemoval.selectedAreas.size > 0 && (
                    <span className="px-3 py-2 bg-blue-500/50 text-white rounded-lg text-sm">
                      {backgroundRemoval.selectedAreas.size} pixels selected
                    </span>
                  )}
                </div>

                {/* Selection Mode & Keyboard Shortcuts */}
                {backgroundRemoval.isSelecting && (
                  <div className="bg-purple-500/20 p-3 rounded-lg border border-purple-300/30">
                    {/* Selection Mode Toggle */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-purple-200">Mode:</span>
                      <div className="flex gap-1">
                        {(["fine", "medium", "coarse"] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() =>
                              setBackgroundRemoval((prev) => ({
                                ...prev,
                                selectionMode: mode,
                              }))
                            }
                            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                              backgroundRemoval.selectionMode === mode
                                ? "bg-purple-500 text-white"
                                : "bg-white/10 text-purple-200 hover:bg-white/20"
                            }`}
                          >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Undo/Redo Buttons */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-purple-200">History:</span>
                      <button
                        onClick={undoSelection}
                        disabled={!canUndo}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          canUndo
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : "bg-gray-600 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        ↶ Undo
                      </button>
                      <button
                        onClick={redoSelection}
                        disabled={!canRedo}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          canRedo
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : "bg-gray-600 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        ↷ Redo
                      </button>
                    </div>

                    {/* Keyboard Shortcuts Help */}
                    <div className="text-xs text-purple-300">
                      <div>
                        ⌨️ Shortcuts: <strong>Ctrl+Z</strong> undo,{" "}
                        <strong>Ctrl+Y</strong> redo, <strong>Space</strong>{" "}
                        toggle mode
                      </div>
                    </div>
                  </div>
                )}

                {/* Apply/Clear Buttons */}
                {backgroundRemoval.selectedAreas.size > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={applySelection}
                      className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      ✓ Apply Removal
                    </button>
                    <button
                      onClick={clearSelection}
                      className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      ↻ Clear Selection
                    </button>
                  </div>
                )}
              </>
            )}

            {/* AI Assistant Tools */}
            {backgroundRemoval.method === "ai" && (
              <>
                {/* AI Processing Button */}
                <div>
                  <button
                    onClick={async () => {
                      if (!onAIBackgroundRemoval) return;
                      setIsAIProcessing(true);
                      try {
                        // We'll need to get the canvas from parent component
                        const canvas = document.querySelector(
                          "canvas"
                        ) as HTMLCanvasElement;
                        if (canvas) {
                          await onAIBackgroundRemoval(canvas);
                        }
                      } catch (error) {
                        console.error("AI background removal failed:", error);
                        // TODO: Add user-friendly error handling
                      } finally {
                        setIsAIProcessing(false);
                      }
                    }}
                    disabled={isAIProcessing}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      isAIProcessing
                        ? "bg-purple-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    } text-white shadow-lg`}
                  >
                    {isAIProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Remove Background with AI
                      </>
                    )}
                  </button>

                  {/* AI Processing Info */}
                  <div className="mt-2 text-xs text-purple-300">
                    <div>⚡ One-click AI removal</div>
                    <div>🎯 Optimized for complex yacht shapes</div>
                    <div className="md:hidden text-yellow-300">
                      📱 May take 10-30s on mobile devices
                    </div>
                    <div className="md:hidden text-orange-300">
                      ⚠️ Large images may timeout - try Manual method for better
                      mobile experience
                    </div>
                    <div className="hidden md:block">
                      🚀 Fast processing (~2-3 seconds)
                    </div>
                    <div>💡 Use Magic Wand for fine-tuning after AI</div>
                  </div>
                </div>
              </>
            )}

            {/* Reset Button */}
            <button
              onClick={resetBackgroundRemoval}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all"
            >
              Reset to Original
            </button>
          </>
        )}
      </div>
    </div>
  );
};
