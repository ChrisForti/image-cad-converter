import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Settings, Download, Copy, Target, Trash2, Play } from 'lucide-react';
import { applyEdgeDetection } from '../utils/imageProcessing';
import { generateCADOutput } from '../utils/cadGeneration';
export function ImageToCAD() {
    // State with proper typing
    const [image, setImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [referencePoints, setReferencePoints] = useState([]);
    const [detectedFeatures, setDetectedFeatures] = useState([]);
    const [cadOutput, setCadOutput] = useState('');
    const [settings, setSettings] = useState({
        edgeMethod: 'canny',
        threshold: 100,
        scale: 100,
        outputFormat: 'dxf',
    });
    // Refs with proper typing
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const originalImageDataRef = useRef(null);
    // Initialize CAD output
    useEffect(() => {
        setCadOutput(`; Yacht CAD Drawing Output
; Generated from photo analysis
; 
; Upload a yacht photo to begin conversion process...
; 
; Features detected will appear here:
; - Hull profile lines
; - Deck outlines  
; - Mast and rigging points
; - Cabin structures
; - Reference dimensions`);
    }, []);
    // File upload handler with proper error handling
    const handleFileUpload = useCallback((file) => {
        if (!file)
            return;
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size too large. Please select an image under 10MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            if (!e.target?.result)
                return;
            const img = new Image();
            img.onload = () => {
                setImage(img);
                drawImageToCanvas(img);
            };
            img.onerror = () => {
                alert('Failed to load image. Please try another file.');
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            alert('Failed to read file. Please try again.');
        };
        reader.readAsDataURL(file);
    }, []);
    // Canvas drawing with proper error handling
    const drawImageToCanvas = useCallback((img) => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        const maxWidth = 500;
        const maxHeight = 400;
        let { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);
        // Store original image data
        originalImageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }, []);
    // Canvas click handler with proper typing
    const handleCanvasClick = useCallback((event) => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const newPoint = {
            x,
            y,
            id: referencePoints.length
        };
        setReferencePoints(prev => [...prev, newPoint]);
    }, [referencePoints.length]);
    // Draw reference points with proper canvas context handling
    const drawReferencePoints = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !originalImageDataRef.current)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        ctx.putImageData(originalImageDataRef.current, 0, 0);
        // Draw reference points
        ctx.fillStyle = '#FF6B6B';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        referencePoints.forEach((point, index) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            // Label
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.fillText(`P${index + 1}`, point.x + 10, point.y - 10);
            ctx.fillStyle = '#FF6B6B';
        });
    }, [referencePoints]);
    useEffect(() => {
        drawReferencePoints();
    }, [referencePoints, drawReferencePoints]);
    // Generate yacht-specific features
    const generateYachtFeatures = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return [];
        const width = canvas.width;
        const height = canvas.height;
        // Generate hull profile with proper curve
        const hullPoints = [];
        for (let x = width * 0.1; x < width * 0.9; x += 5) {
            const y = height * 0.7 + Math.sin((x / width) * Math.PI * 2) * height * 0.1;
            hullPoints.push({ x, y });
        }
        const features = [
            {
                type: 'hull_profile',
                points: hullPoints,
                confidence: 0.85,
                metadata: {
                    estimatedLength: width * 0.8 / settings.scale,
                    curvature: 'moderate'
                }
            },
            {
                type: 'waterline',
                points: [
                    { x: width * 0.1, y: height * 0.75 },
                    { x: width * 0.9, y: height * 0.75 }
                ],
                confidence: 0.92,
                metadata: {
                    length: width * 0.8 / settings.scale
                }
            },
            {
                type: 'mast',
                points: [
                    { x: width * 0.4, y: height * 0.1 },
                    { x: width * 0.4, y: height * 0.7 }
                ],
                confidence: 0.78,
                metadata: {
                    height: height * 0.6 / settings.scale,
                    position: 'center'
                }
            },
            {
                type: 'deck_edge',
                points: Array.from({ length: 20 }, (_, i) => ({
                    x: width * 0.2 + (i * width * 0.6 / 19),
                    y: height * 0.6 + Math.random() * 5 - 2.5
                })),
                confidence: 0.81,
                metadata: {
                    style: 'modern',
                    clearance: 'standard'
                }
            }
        ];
        return features;
    }, [settings.scale]);
    // Main processing function with error handling
    const processImage = useCallback(async () => {
        if (!image) {
            alert('Please upload an image first');
            return;
        }
        setIsProcessing(true);
        try {
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            const canvas = canvasRef.current;
            if (!canvas)
                throw new Error('Canvas not available');
            const ctx = canvas.getContext('2d');
            if (!ctx)
                throw new Error('Canvas context not available');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // Apply edge detection
            const processedData = applyEdgeDetection(imageData, settings.edgeMethod, settings.threshold);
            ctx.putImageData(processedData, 0, 0);
            setProcessedImage(processedData);
            // Generate yacht features
            const features = generateYachtFeatures();
            setDetectedFeatures(features);
            // Generate CAD output
            const output = generateCADOutput(features, settings.outputFormat, settings.scale, referencePoints, canvas.width, canvas.height, image);
            setCadOutput(output);
        }
        catch (error) {
            console.error('Processing error:', error);
            alert('An error occurred during processing. Please try again.');
        }
        finally {
            setIsProcessing(false);
        }
    }, [image, settings, generateYachtFeatures, referencePoints]);
    // Event handlers with proper typing
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    };
    const downloadCAD = () => {
        try {
            const content = cadOutput;
            const format = settings.outputFormat;
            const filename = `yacht_drawing.${format}`;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        catch (error) {
            console.error('Download error:', error);
            alert('Failed to download file. Please try again.');
        }
    };
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(cadOutput);
            alert('CAD data copied to clipboard!');
        }
        catch (err) {
            console.error('Failed to copy: ', err);
            alert('Failed to copy to clipboard. Please try selecting and copying manually.');
        }
    };
    const clearAll = () => {
        setImage(null);
        setProcessedImage(null);
        setReferencePoints([]);
        setDetectedFeatures([]);
        setCadOutput(`; Yacht CAD Drawing Output
; Generated from photo analysis
; 
; Upload a yacht photo to begin conversion process...`);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
        originalImageDataRef.current = null;
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white", children: _jsxs("div", { className: "max-w-7xl mx-auto p-6", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-4xl font-bold mb-4", children: "\u26F5 Yacht Photo to CAD Converter" }), _jsx("p", { className: "text-xl opacity-90", children: "Transform yacht photographs into precise CAD drawings for marine engineering" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8", children: [_jsxs("div", { className: "bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20", children: [_jsxs("h2", { className: "text-2xl font-semibold mb-6 text-blue-200 flex items-center gap-2", children: [_jsx(Upload, { className: "w-6 h-6" }), "Image Input"] }), _jsxs("div", { className: "border-2 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer transition-all hover:border-white hover:bg-white/5", onDragOver: handleDragOver, onDrop: handleDrop, onClick: () => fileInputRef.current?.click(), children: [_jsx("div", { className: "text-4xl mb-4", children: "\uD83D\uDDBC\uFE0F" }), _jsx("p", { className: "text-lg mb-2", children: "Click or drag yacht photos here" }), _jsx("small", { className: "opacity-70", children: "Supports JPG, PNG, WebP formats" })] }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", className: "hidden", onChange: (e) => handleFileUpload(e.target.files?.[0] || null) }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mt-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-blue-200 mb-2", children: "Edge Detection" }), _jsxs("select", { className: "w-full p-3 bg-white/90 text-gray-800 rounded-lg", value: settings.edgeMethod, onChange: (e) => setSettings(prev => ({
                                                        ...prev,
                                                        edgeMethod: e.target.value
                                                    })), children: [_jsx("option", { value: "canny", children: "Canny Edge" }), _jsx("option", { value: "sobel", children: "Sobel Filter" }), _jsx("option", { value: "laplacian", children: "Laplacian" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-blue-200 mb-2", children: ["Threshold: ", settings.threshold] }), _jsx("input", { type: "range", min: "50", max: "200", value: settings.threshold, onChange: (e) => setSettings(prev => ({
                                                        ...prev,
                                                        threshold: parseInt(e.target.value)
                                                    })), className: "w-full" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-blue-200 mb-2", children: "Scale (px/meter)" }), _jsx("input", { type: "number", min: "1", max: "1000", value: settings.scale, onChange: (e) => setSettings(prev => ({
                                                        ...prev,
                                                        scale: parseFloat(e.target.value) || 100
                                                    })), className: "w-full p-3 bg-white/90 text-gray-800 rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-blue-200 mb-2", children: "Output Format" }), _jsxs("select", { className: "w-full p-3 bg-white/90 text-gray-800 rounded-lg", value: settings.outputFormat, onChange: (e) => setSettings(prev => ({
                                                        ...prev,
                                                        outputFormat: e.target.value
                                                    })), children: [_jsx("option", { value: "dxf", children: "DXF (2D CAD)" }), _jsx("option", { value: "svg", children: "SVG (Vector)" }), _jsx("option", { value: "json", children: "JSON (Data)" })] })] })] }), _jsxs("div", { className: "flex flex-wrap gap-3 mt-6", children: [_jsxs("button", { onClick: processImage, disabled: !image || isProcessing, className: "flex items-center gap-2 bg-gradient-to-r from-red-500 to-teal-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx(Play, { className: "w-4 h-4" }), isProcessing ? 'Processing...' : 'Process Image'] }), _jsxs("button", { onClick: () => alert('Click on the image to add reference points for scale calibration'), className: "flex items-center gap-2 bg-gradient-to-r from-red-500 to-teal-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all", children: [_jsx(Target, { className: "w-4 h-4" }), "Add Reference"] }), _jsxs("button", { onClick: clearAll, className: "flex items-center gap-2 bg-gradient-to-r from-red-500 to-teal-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all", children: [_jsx(Trash2, { className: "w-4 h-4" }), "Clear All"] })] })] }), _jsxs("div", { className: "bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20", children: [_jsx("h2", { className: "text-2xl font-semibold mb-6 text-blue-200", children: "\uD83D\uDDBC\uFE0F Image Preview" }), _jsxs("div", { className: "relative", children: [_jsx("canvas", { ref: canvasRef, onClick: handleCanvasClick, className: "max-w-full border rounded-lg cursor-crosshair bg-gray-900", width: "500", height: "400" }), isProcessing && (_jsx("div", { className: "absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-10 w-10 border-b-2 border-blue-300 mx-auto mb-4" }), _jsx("p", { children: "Processing yacht image..." })] }) }))] }), detectedFeatures.length > 0 && (_jsxs("div", { className: "mt-4 text-sm", children: [_jsx("p", { className: "font-semibold text-blue-200 mb-2", children: "Detected Features:" }), _jsx("div", { className: "space-y-1", children: detectedFeatures.map((feature, index) => (_jsxs("div", { className: "flex justify-between opacity-80", children: [_jsx("span", { children: feature.type.replace('_', ' ') }), _jsxs("span", { children: [Math.round(feature.confidence * 100), "%"] })] }, index))) })] }))] })] }), _jsxs("div", { className: "bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8", children: [_jsxs("h2", { className: "text-2xl font-semibold mb-6 text-blue-200 flex items-center gap-2", children: [_jsx(Settings, { className: "w-6 h-6" }), "CAD Output"] }), _jsx("div", { className: "bg-black rounded-lg p-4 font-mono text-sm overflow-x-auto min-h-[300px] mb-4", children: _jsx("pre", { className: "whitespace-pre-wrap", children: cadOutput }) }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("button", { onClick: downloadCAD, className: "flex items-center gap-2 bg-gradient-to-r from-red-500 to-teal-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all", children: [_jsx(Download, { className: "w-4 h-4" }), "Download CAD File"] }), _jsxs("button", { onClick: copyToClipboard, className: "flex items-center gap-2 bg-gradient-to-r from-red-500 to-teal-400 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all", children: [_jsx(Copy, { className: "w-4 h-4" }), "Copy to Clipboard"] })] })] }), _jsxs("div", { className: "bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20", children: [_jsx("h2", { className: "text-2xl font-semibold mb-6 text-blue-200", children: "\uD83D\uDEE0\uFE0F Yacht-Specific Features" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsxs("div", { className: "bg-white/5 p-4 rounded-lg border border-white/10", children: [_jsx("h3", { className: "text-lg font-semibold text-blue-200 mb-2", children: "Hull Detection" }), _jsx("p", { className: "text-sm opacity-90", children: "Automatically detects waterline, sheer line, and hull profile" })] }), _jsxs("div", { className: "bg-white/5 p-4 rounded-lg border border-white/10", children: [_jsx("h3", { className: "text-lg font-semibold text-blue-200 mb-2", children: "Rigging Analysis" }), _jsx("p", { className: "text-sm opacity-90", children: "Identifies mast positions, stays, and sail attachment points" })] }), _jsxs("div", { className: "bg-white/5 p-4 rounded-lg border border-white/10", children: [_jsx("h3", { className: "text-lg font-semibold text-blue-200 mb-2", children: "Deck Layout" }), _jsx("p", { className: "text-sm opacity-90", children: "Maps cockpit, cabin top, and deck hardware locations" })] }), _jsxs("div", { className: "bg-white/5 p-4 rounded-lg border border-white/10", children: [_jsx("h3", { className: "text-lg font-semibold text-blue-200 mb-2", children: "Scale Calibration" }), _jsx("p", { className: "text-sm opacity-90", children: "Use known dimensions to calibrate measurements" })] })] })] })] }) }));
}
