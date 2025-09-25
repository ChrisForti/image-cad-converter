# Simple 3D Geometry from 2D Profiles

## Overview

The image-cad-converter creates simple 3D models from 2D CAD profiles using a minimalist approach that prioritizes functionality over complexity.

## Features

### 🔧 **Basic 3D Creation**

**Simple Extrusion** - Convert 2D shapes into 3D by extending along the Z-axis

- Lines become tubes using TubeGeometry
- Closed shapes become solid extrusions using ExtrudeGeometry
- Consistent depth control via slider

### 🎨 **Three Material Types**

- **Standard** - Basic material for general use
- **Metallic** - Shiny metallic appearance
- **Glass** - Semi-transparent glass effect

### ⚙️ **Simple Controls**

- **Extrusion Depth**: Adjustable from 0.5 to 5 units
- **Material Selection**: Choose from 3 material types
- **View Mode**: Toggle between 2D flat view and 3D extruded view

## Technical Implementation

### Radical Simplicity Architecture

The system uses minimal code with maximum functionality:

```typescript
// Single function handles all 3D creation
createSimple3D(
  points,
  scene,
  scale,
  centerX,
  centerY,
  color,
  materialType,
  depth
);

// Line detection: < 3 points = TubeGeometry
// Shape detection: 3+ points = ExtrudeGeometry
```

### Key Functions

**createSimple3D()** - Main geometry creator

- Automatically detects lines vs shapes
- Uses appropriate Three.js geometry type
- Handles material creation and positioning

**createMaterial()** - Material factory

- Three material types with distinct properties
- Standard, Metallic, and Glass variants

**create2DLine()** - Fallback for 2D mode

- Flat line rendering for blueprint view

## Usage

1. Upload an image with CAD features
2. Toggle 3D mode to see extruded geometry
3. Adjust depth with the slider (0.5-5.0)
4. Select material type from dropdown
5. View controls: orbit camera around 3D model

## Benefits of Simple Approach

- ✅ **Reliable**: Minimal code means fewer bugs
- ✅ **Fast**: Simple operations render quickly
- ✅ **Understandable**: Code is easy to maintain
- ✅ **Sufficient**: Covers 90% of use cases
- ✅ **Extensible**: Easy to add features when needed

## Feature Detection

The system automatically creates appropriate 3D representations:

- **Hull Profiles**: Blue extruded shapes for boat hulls
- **Deck Edges**: Orange extruded outlines
- **Masts**: Gray cylindrical geometry
- **General Features**: Multi-colored extrusions

## Future Enhancements (If Needed)

Only add complexity when there's a clear user need:

- Custom extrusion paths (if users request curved extrusions)
- Additional materials (if current three aren't sufficient)
- Export formats (if users want to save 3D models)
  - Select "Revolve" operation
  - Set revolution angle to 360°
  - Choose "Metallic" material

3. **Complex Curved Parts**:
   - Select "Sweep" operation
   - System creates curved path from profile points
   - Ideal for rails and curved structural elements

## Technical Notes

- All geometry operations work with closed and open profiles
- Minimum of 2 points required for any 3D operation
- Automatic shape closing for extrusion operations
- Real-time parameter updates trigger geometry regeneration
- Professional CAD-grade beveling and edge treatment

This enhanced 3D geometry system transforms the image-cad-converter from a simple 2D line extractor into a professional 3D CAD preview tool, bridging the gap between image analysis and mechanical design.
