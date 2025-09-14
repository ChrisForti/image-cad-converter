# 🛥️ Yacht CAD Converter

Convert yacht photos into professional CAD drawings with AI-powered feature detection and 3D visualization.

## ✨ Features

- **🖼️ Smart Image Processing** - Upload yacht photos with automatic HEIC/HEIF support
- **🔍 AI Feature Detection** - Automatically identifies hulls, masts, waterlines, and deck edges
- **📐 CAD Generation** - Exports to DXF, SVG, and JSON formats compatible with FreeCAD
- **🎮 3D Visualization** - Interactive Three.js viewer with 2D/3D modes
- **📱 Modern UI** - Clean, responsive interface with drag-and-drop upload
- **⚙️ Customizable** - Adjustable edge detection, scaling, and output parameters

## 🚀 Quick Start

```bash
npm install
npm run dev
```

1. Upload a yacht photo (JPG, PNG, WebP, HEIC)
2. Process image to detect yacht features
3. Download CAD files or view in 3D

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **3D Graphics**: Three.js
- **Image Processing**: Canvas API + Edge Detection
- **File Support**: HEIC conversion with heic2any

## 📖 Documentation

See [DOCS.md](./DOCS.md) for detailed technical documentation.

## 🌐 Demo

Visit the [live demo](https://chrisforti.github.io/image-cad-converter/) to try it out!
