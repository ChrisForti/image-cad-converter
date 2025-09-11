import { useState, useCallback } from 'react';

export function useImageUpload(onImageLoad: (img: HTMLImageElement) => void) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = useCallback(async (file: File | null) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size too large. Please select an image under 10MB");
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      
      const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
        reader.onload = (e: ProgressEvent<FileReader>) => {
          if (!e.target?.result) {
            reject(new Error('Failed to read file'));
            return;
          }

          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
      });

      reader.readAsDataURL(file);
      const img = await loadPromise;
      onImageLoad(img);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [onImageLoad]);

  return {
    handleFileUpload,
    isUploading
  };
}
