# 🛥️ Yacht CAD Converter

Convert yacht photos into professional CAD drawings with AI-powered feature detection and 3D visualization.

## ✨ Features

- **🖼️ Smart Image Processing** - Upload yacht photos with automatic HEIC/HEIF support
- **🔍 AI Feature Detection** - Automatically identifies hulls, masts, waterlines, and deck edges
- **📐 Scale Calibration** - Manual 2-point calibration system for accurate real-world measurements
- **📏 Unit Conversion** - Built-in feet/inches to millimeter converter for field work
- **📐 CAD Generation** - Exports to DXF, SVG, and JSON formats compatible with FreeCAD
- **🎮 3D Visualization** - Interactive Three.js viewer with 2D/3D modes
- **📱 Mobile Optimized** - Responsive design with touch-friendly scale calibration tools
- **⚙️ Customizable** - Adjustable edge detection, scaling, and output parameters

## 🚀 Quick Start

```bash
npm install
npm run dev
```

### Basic Usage

1. Upload a yacht photo (JPG, PNG, WebP, HEIC)
2. Process image to detect yacht features
3. Download CAD files or view in 3D

### Scale Calibration (Recommended)

1. Click **"Scale Calibration"** to enter scale mode
2. Use the **Unit Converter** to convert feet/inches to mm (e.g., 5 ft = 1524 mm)
3. Enter the known distance in the input field
4. Click **two points** on your image that match the known distance
5. Scale automatically calculated and applied to all measurements

> 💡 **Tip**: Use dock cleats, railings, or other known yacht hardware for accurate scaling

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **3D Graphics**: Three.js
- **Image Processing**: Canvas API + Edge Detection
- **File Support**: HEIC conversion with heic2any

## 📖 Documentation

See [DOCS.md](./DOCS.md) for detailed technical documentation.

## 🌐 Demo

Visit the [live demo](https://chrisforti.github.io/image-cad-converter/) to try it out!
