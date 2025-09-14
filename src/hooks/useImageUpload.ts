import { useState, useCallback } from "react";
import heic2any from "heic2any";

export function useImageUpload(onImageLoad: (img: HTMLImageElement) => void) {
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const handleFileUpload = useCallback(
    async (file: File | null) => {
      if (!file) return;

      // Validate file type - support standard images and HEIC
      const isStandardImage = file.type.startsWith("image/");
      const isHEIC =
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif") ||
        file.type === "image/heic" ||
        file.type === "image/heif";

      if (!isStandardImage && !isHEIC) {
        alert("Please select a valid image file (including HEIC/HEIF formats)");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size too large. Please select an image under 10MB");
        return;
      }

      setIsUploading(true);

      try {
        let processedFile = file;

        // Convert HEIC to JPEG if needed
        if (isHEIC) {
          setIsConverting(true);
          console.log("Converting HEIC image to JPEG...");
          const convertedBlob = (await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.9,
          })) as Blob;

          // Create a new File object from the converted blob
          processedFile = new File(
            [convertedBlob],
            file.name.replace(/\.(heic|heif)$/i, ".jpg"),
            {
              type: "image/jpeg",
            }
          );
          setIsConverting(false);
        }

        const reader = new FileReader();

        const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
          reader.onload = (e: ProgressEvent<FileReader>) => {
            if (!e.target?.result) {
              reject(new Error("Failed to read file"));
              return;
            }

            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = e.target.result as string;
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
        });

        reader.readAsDataURL(processedFile);
        const img = await loadPromise;
        onImageLoad(img);
      } catch (error) {
        console.error("Upload error:", error);
        if (error instanceof Error && error.message.includes("heic")) {
          alert(
            "Failed to convert HEIC image. Please try converting to JPEG first or use a different image."
          );
        } else {
          alert(
            error instanceof Error ? error.message : "Failed to upload image"
          );
        }
      } finally {
        setIsConverting(false);
        setIsUploading(false);
      }
    },
    [onImageLoad]
  );

  return {
    handleFileUpload,
    isUploading: isUploading || isConverting,
    isConverting,
  };
}
