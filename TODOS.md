**You'll Still Need To:**

- Clean up the CAD file (remove noise, perfect lines)
- Add design intent (constraints, relationships)
- ✅ **COMPLETED**: Create 3D geometry from 2D profiles
  - ✅ Simple extrusion system working (lines → tubes, shapes → extrusions)
  - ✅ Three material types: Standard, Metallic, Glass
  - ✅ Depth control slider (0.5-5.0 units)
  - ✅ 2D/3D view toggle
  - ✅ Automatic feature type detection
  - ✅ Built with "Radical Simplicity" principle - minimal, working code
- Add manufacturing details (tolerances, finishes)

**Current Development Tasks:**

**Focus Priority:**

1. **Core 3D rendering** - Get basic extrusion and visualization working
2. **Standard CAD features** - Constraints, measurements, basic modeling
3. **Marine-specific stuff** - Way down the road

**Why marine features are premature:**

- **Complexity explosion** - Hull surfaces, hydrostatics, etc. are PhD-level problems
- **Niche market** - Limits broader usability
- **Foundation first** - Need solid 3D core before specialized features
- **Time sink** - Could spend months on marine calcs that few users need

- **Image Controls Responsiveness**: The new ImageModificationPanel and ImageToolsModal components still need responsiveness work, but the overall structure looks good. Areas needing attention:

  - Mobile layout optimization for the collapsible panel
  - Touch target sizing on smaller screens
  - Better modal positioning and sizing on various devices
  - Improved fullscreen canvas scaling

- **Improve Magic Wand Functionality**: The current magic wand tool needs better responsiveness and selection accuracy. Consider:
  - Better flood-fill algorithm with edge awareness
  - Multi-level selection (fine/medium/coarse)
  - Undo/redo functionality for individual selections
  - Better visual feedback during selection process
  - Keyboard shortcuts for common actions (Ctrl+Z for undo, Space to toggle mode)

**Background removal strategies**

1. AI-Powered Background Removal
   We could integrate a client-side background removal tool:

Options:

- @imgly/background-removal - Browser-based AI model (~2MB)
- MediaPipe Selfie Segmentation - Google's solution
- TensorFlow.js with DeepLab - More control but larger
  **Pros:** Very accurate, handles complex shapes Cons: Adds bundle size, processing time

2. Interactive Manual Selection
   Add tools for user to define the subject area:

Click-to-Select Areas:

- Magic wand tool (select similar colors)
- Polygon selection tool
- Brush selection/masking
- "Keep" vs "Remove" painting
  **Pros:** User has full control, works with any part Cons: Manual work required

3. Color/Contrast-Based Filtering
   Smart filtering based on the part characteristics:

**Adaptive Filtering:**

- Detect dominant background colors
- Edge-based subject isolation
- Contrast enhancement focusing on main subject
- Color range exclusion tools

4.  Hybrid Approach (Recommended)
    Combine multiple techniques for best results:

    ``
    sh
    // Proposed workflow

1.  AI background removal (rough pass)
1.  User refinement tools (manual cleanup)
1.  Enhanced edge detection on isolated subject
1.  Smart noise filtering
    ``
