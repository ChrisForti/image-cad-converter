import { useState, useCallback } from 'react';
import { ProcessingSettings } from '../types/index.js';

const getInitialCADMessage = (conversionMode: ProcessingSettings['conversionMode']): string => {
  switch (conversionMode) {
    case "yacht":
      return `; Yacht CAD Drawing Output
; Generated from photo analysis
; 
; Upload a yacht photo to begin conversion process...
; 
; Features detected will appear here:
; - Hull profile lines
; - Deck outlines  
; - Mast and rigging points
; - Cabin structures
; - Overall dimensions`;
    case "interior":
      return `; Interior Component CAD Output
; Generated from photo analysis
; 
; Upload a photo of yacht interior components...
; 
; Components that will be detected:
; - Cabinet doors and drawers
; - Seating and furniture
; - Countertops and surfaces
; - Small fittings and hardware
; - Detailed dimensions in cm`;
    case "general":
      return `; General Object CAD Output
; Generated from photo analysis
; 
; Upload a photo of any object to convert...
; 
; Objects will be analyzed for:
; - Basic geometric shapes
; - Overall dimensions
; - Edge outlines
; - General proportions`;
    default:
      return `; CAD Drawing Output
; Generated from photo analysis
; Upload a photo to begin...`;
  }
};

export function useCADOutput() {
  const [cadOutput, setCadOutput] = useState<string>(() => 
    getInitialCADMessage('interior')
  );

  const updateOutputForMode = useCallback((conversionMode: ProcessingSettings['conversionMode']) => {
    setCadOutput(getInitialCADMessage(conversionMode));
  }, []);

  const downloadCAD = useCallback((settings: ProcessingSettings) => {
    try {
      const content = cadOutput;
      const format = settings.outputFormat;
      const filename = `cad_drawing.${format}`;

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download file. Please try again.");
    }
  }, [cadOutput]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cadOutput);
      alert("CAD data copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy: ", err);
      alert("Failed to copy to clipboard. Please try selecting and copying manually.");
    }
  }, [cadOutput]);

  return {
    cadOutput,
    setCadOutput,
    updateOutputForMode,
    downloadCAD,
    copyToClipboard
  };
}
