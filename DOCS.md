# 📚 Technical Documentation

Comprehensive guide to the Yacht CAD Converter architecture, tools, and implementation details.

## 🏗️ Architecture Overview

The Yacht CAD Converter is a modern web application built with React and TypeScript that transforms yacht photographs into professional CAD drawings through computer vision and 3D rendering.

### Core Components

```
src/
├── components/
│   ├── ImageToCAD.tsx        # Main application component
│   ├── ThreeJSViewer.tsx     # 3D visualization component
│   └── ui/                   # Reusable UI components
├── hooks/
│   ├── useImageUpload.ts     # File upload and HEIC conversion
│   ├── useCADOutput.ts       # CAD generation and export
│   └── useTheme.tsx          # Theme management
├── utils/
│   ├── imageProcessing.ts    # Edge detection algorithms
│   └── cadGeneration.ts      # CAD file format generation
└── types/
    └── index.ts              # TypeScript definitions
```

## 🔧 Technology Stack

### Frontend Framework

- **React 19** - Modern React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast development server and build tool
- **Tailwind CSS 4** - Utility-first styling

### 3D Graphics & Visualization

- **Three.js** - WebGL-based 3D rendering engine
- **@types/three** - TypeScript definitions for Three.js

### Image Processing

- **Canvas API** - Browser-native image manipulation
- **heic2any** - HEIC/HEIF to JPEG conversion for iOS photos
- **Custom Edge Detection** - Canny and Sobel algorithms

### Build & Development Tools

- **ESLint** - Code linting with React-specific rules
- **PostCSS** - CSS processing and optimization
- **gh-pages** - Automated deployment to GitHub Pages

## 🖼️ Image Processing Pipeline

### 1. File Upload & Validation

```typescript
// File type validation with HEIC support
const isStandardImage = file.type.startsWith("image/");
const isHEIC =
  file.name.toLowerCase().endsWith(".heic") ||
  file.name.toLowerCase().endsWith(".heif");
```

### 2. HEIC Conversion

```typescript
// Automatic conversion for iOS photos
const convertedBlob = await heic2any({
  blob: file,
  toType: "image/jpeg",
  quality: 0.9,
});
```

### 3. Edge Detection Algorithms

#### Canny Edge Detection

- Gaussian blur for noise reduction
- Gradient calculation using Sobel operators
- Non-maximum suppression
- Double thresholding with hysteresis

#### Sobel Edge Detection

- Horizontal and vertical gradient detection
- Magnitude calculation: `√(Gx² + Gy²)`
- Direction calculation: `arctan(Gy/Gx)`

### 4. Feature Classification

```typescript
// Yacht-specific feature categorization
const featureTypes = [
  "hull_profile", // Main boat outline
  "waterline", // Water level indicators
  "mast", // Vertical structures
  "deck_edge", // Deck boundaries
  "cabin", // Superstructure
  "keel", // Underwater elements
];
```

### 5. Intelligent Filtering

- Minimum line length: 15 pixels (reduces noise)
- Minimum point count: 3 points per feature
- Length threshold: 20 pixels for final features
- Confidence scoring based on geometric properties

## 🎮 3D Visualization System

### Three.js Scene Setup

```typescript
// Scene initialization
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// Camera configuration
const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);

// Lighting setup
const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
```

### Dual View Modes

#### 2D Mode

- Orthographic-style top-down view
- Flat line representations at y=0
- Blueprint-style technical drawings
- Color-coded feature types

#### 3D Mode

- Perspective camera with orbit controls
- Volumetric geometry generation:
  - **Hull Profiles**: Extruded tube geometry with CatmullRom curves
  - **Masts**: Cylindrical geometry with calculated height
  - **Waterlines**: Flat lines at water level (y=-1)
  - **Deck Edges**: Elevated lines at deck level (y=0.5)

### Interactive Controls

- **Mouse Orbit**: Drag to rotate around model
- **Zoom**: Mouse wheel for camera distance
- **Mode Toggle**: Seamless 2D/3D switching

## 📐 CAD File Generation

### DXF Format (AutoCAD Compatible)

```dxf
0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
```

Key features:

- AutoCAD 2000 format (AC1015)
- Proper entity structure with subclasses
- Unique handle generation
- Millimeter units ($INSUNITS=4)
- Layer-based organization

### SVG Format (Scalable Vector Graphics)

- XML-based vector format
- ViewBox scaling for responsiveness
- Stroke-based line rendering
- CSS-compatible styling

### JSON Format (Custom Data)

- Complete feature metadata
- Confidence scores
- Processing parameters
- Reconstruction data

## 🎨 User Interface Design

### Design System

- **Color Palette**: Blue gradient backgrounds with glassmorphism
- **Typography**: System fonts with semantic sizing
- **Spacing**: Consistent 4px grid system
- **Animations**: Smooth transitions with CSS transforms

### Responsive Layout

```css
/* Mobile-first approach */
.container {
  @apply px-4 lg:px-6; /* Responsive padding */
  @apply grid grid-cols-1 md:grid-cols-2; /* Responsive grid */
}
```

### Accessibility Features

- High contrast text colors
- Keyboard navigation support
- Screen reader compatible
- Focus indicators
- ARIA labels and descriptions

## ⚡ Performance Optimizations

### Image Processing

- Canvas-based processing (GPU accelerated)
- Configurable quality settings
- Progressive feature detection
- Memory management for large images

### 3D Rendering

- Efficient geometry generation
- Instanced rendering for repeated elements
- Level-of-detail (LOD) considerations
- Proper cleanup and disposal

### Bundle Optimization

```typescript
// Code splitting for Three.js
const ThreeJSViewer = lazy(() => import("./ThreeJSViewer"));

// Tree shaking for unused Tailwind classes
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  // ...
};
```

## 🔄 State Management

### React Hooks Architecture

```typescript
// Custom hooks for separation of concerns
const { cadOutput, downloadCAD } = useCADOutput();
const { handleFileUpload, isUploading } = useImageUpload();
const { theme, toggleTheme } = useTheme();
```

### Component State Flow

1. **File Upload** → `useImageUpload` → Image processing
2. **Feature Detection** → Local state → CAD generation
3. **CAD Output** → `useCADOutput` → File download/clipboard
4. **3D Visualization** → `ThreeJSViewer` → Scene rendering

## 🧪 Development Workflow

### Local Development

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

### Git Workflow

- **Feature branches**: `feature/feature-name`
- **Conventional commits**: `feat:`, `fix:`, `docs:`
- **Pull requests**: Required for main branch

### Deployment

- **GitHub Pages**: Automated deployment on push to main
- **Vite build**: Optimized production bundles
- **Asset optimization**: Image compression and minification

## 🔒 Security Considerations

### File Upload Security

- File type validation
- Size limits (10MB max)
- Client-side processing only
- No server-side storage

### Content Security Policy

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; img-src 'self' data: blob:;"
/>
```

## 🚀 Future Enhancements

### Planned Features

- **AI-Enhanced Detection**: Machine learning models for better accuracy
- **Batch Processing**: Multiple image support
- **Cloud Storage**: Optional cloud backup for projects
- **Collaboration**: Real-time sharing and comments
- **Mobile App**: Native iOS/Android applications

### Performance Improvements

- **Web Workers**: Background image processing
- **WebAssembly**: High-performance edge detection
- **Service Workers**: Offline capability
- **Progressive Web App**: Installable application

## 📊 Analytics & Monitoring

### Performance Metrics

- Image processing time
- Feature detection accuracy
- 3D rendering performance
- User interaction patterns

### Error Tracking

- Client-side error monitoring
- Performance bottleneck identification
- User experience optimization

## 🤝 Contributing

### Development Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Create feature branch
5. Submit pull request

### Code Standards

- TypeScript strict mode
- ESLint configuration compliance
- Component documentation
- Unit test coverage (planned)

## 📞 Support

For technical issues or questions:

- GitHub Issues: Bug reports and feature requests
- Documentation: This file and inline code comments
- Community: Discussions and sharing

---

Built with ❤️ for the yachting community
