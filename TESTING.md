# Testing Strategy for Image to CAD Converter 🛥️

## Overview

This document outlines comprehensive testing strategies for the scale calibration feature and overall application functionality, focusing on field engineering requirements.

## Scale Calibration Testing

### 1. Manual Testing Protocol

#### Test Setup Requirements

- **Reference Objects**: Use known-dimension objects for calibration
  - Standard ruler (300mm)
  - Credit card (85.6 × 53.98 mm)
  - US penny (19.05mm diameter)
  - Yacht dock cleat (standard 6", 8", 10", 12")
  - Marina dock boards (typically 6" wide)

#### Test Cases

##### TC001: Basic Scale Calibration

**Objective**: Verify basic scale calibration functionality
**Steps**:

1. Upload image containing ruler or known reference object
2. Click "Set Scale" button
3. Click two points on known distance (e.g., 0-100mm on ruler)
4. Enter known distance: 0.1 meters
5. Click "Calculate"
   **Expected**:

- Scale points appear as teal circles with "S1", "S2" labels
- Dashed line connects points
- Green success message: "Scale calibrated!"
- Pixels per millimeter value calculated

##### TC002: Scale Accuracy Validation

**Objective**: Verify measurement accuracy after calibration
**Steps**:

1. Complete TC001 calibration
2. Measure another known object in same image
3. Convert pixel distance to real-world units using `pixelsPerMM`
   **Expected**:

- Measurement accuracy within ±2% for objects in same focal plane
- Larger tolerance (±5-10%) for objects at different distances

##### TC003: Scale Mode UI Behavior

**Objective**: Test scale mode interface
**Steps**:

1. Click "Set Scale" - button should turn orange, show "Exit Scale Mode"
2. Blue instruction panel appears: "Click two points..."
3. Click first point - counter shows "Points: 1/2"
4. Click second point - counter shows "Points: 2/2"
5. Attempt third click - should be ignored
   **Expected**: UI clearly indicates scale mode state

##### TC004: Scale Validation Edge Cases

**Objective**: Test error handling and edge cases
**Test Scenarios**:

- **No Distance**: Set scale points but leave distance field empty
- **Zero Distance**: Enter 0 in distance field
- **Negative Distance**: Enter negative value
- **Same Point**: Click same pixel location twice
- **Very Small Distance**: 1mm calibration distance
- **Very Large Distance**: 100m calibration distance

### 2. Automated Testing

#### Unit Tests

```typescript
// Scale calculation accuracy
describe("Scale Calibration", () => {
  test("calculates correct pixels per millimeter", () => {
    const point1 = { x: 100, y: 100 };
    const point2 = { x: 200, y: 100 };
    const knownDistance = 0.1; // 100mm in meters
    const pixelDistance = 100; // pixels
    const expectedPxPerMM = 1.0;

    expect(calculatePixelsPerMM(point1, point2, knownDistance)).toBeCloseTo(
      expectedPxPerMM,
      2
    );
  });

  test("handles diagonal measurements", () => {
    const point1 = { x: 0, y: 0 };
    const point2 = { x: 300, y: 400 };
    const pixelDistance = 500; // 3-4-5 triangle
    const knownDistance = 0.5; // 500mm
    const expectedPxPerMM = 1.0;

    expect(calculatePixelsPerMM(point1, point2, knownDistance)).toBeCloseTo(
      expectedPxPerMM,
      2
    );
  });
});
```

#### Integration Tests

```typescript
// Canvas interaction testing
describe("Scale Mode Canvas Interaction", () => {
  test("allows exactly 2 scale points", () => {
    // Simulate canvas clicks in scale mode
    // Verify only 2 points are stored
    // Verify third click is ignored
  });

  test("draws scale visualization correctly", () => {
    // Verify teal circles appear
    // Verify dashed line connects points
    // Verify labels "S1", "S2"
  });
});
```

### 3. Field Testing Protocol

#### Real-World Scenarios

##### Marine Environment Testing

**Test Locations**:

- Marina dock (controlled environment)
- Boat deck (moving platform)
- Shipyard (varying lighting)
- Anchor windlass room (confined space)

**Test Objects**:

- Winch drums (known diameters)
- Deck hardware (cleats, fairleads)
- Hatch openings (standard sizes)
- Stanchion spacing (typical 6-8 feet)

##### Environmental Challenges

**Lighting Conditions**:

- Direct sunlight (high contrast shadows)
- Overcast (even lighting)
- Below deck (artificial lighting)
- Mixed lighting (porthole + cabin lights)

**Camera Stability**:

- Handheld (typical use case)
- Phone mounted on tripod (best case)
- Moving boat (challenging case)

## Image Processing Testing

### 1. Format Compatibility Testing

#### HEIC Conversion Testing

**Test Matrix**:

- iOS devices: iPhone 11, 12, 13, 14, 15 Pro
- Image sizes: Various resolutions
- Conversion performance: Time and memory usage
- Quality retention: Compare HEIC vs converted output

#### Edge Detection Accuracy

**Test Images**:

- High contrast objects (black text on white background)
- Low contrast objects (gray on slightly different gray)
- Complex backgrounds (marina with multiple boats)
- Rusty/weathered marine hardware

### 2. Performance Testing

#### Memory Usage

- Monitor heap usage during image processing
- Test with large images (>10MB)
- Verify memory cleanup after processing

#### Processing Speed

- Measure processing time for different image sizes
- Test edge detection performance across algorithms
- Canvas rendering performance with many reference points

## User Experience Testing

### 1. Mobile Device Testing

**Test Devices**:

- iPhone (Safari)
- Android (Chrome)
- iPad (larger canvas area)

**Interaction Testing**:

- Touch accuracy for point placement
- Pinch-to-zoom compatibility
- Screen rotation handling

### 2. Accessibility Testing

- Keyboard navigation
- Screen reader compatibility
- Color contrast for scale visualization
- Touch target sizes (minimum 44px)

### 3. Workflow Testing

#### Typical Engineering Workflow

1. **Site Survey**: Take photos of equipment/spaces
2. **Scale Setting**: Use known reference for calibration
3. **Measurement**: Mark key dimensions
4. **CAD Export**: Generate technical drawings
5. **Field Verification**: Check drawings against reality

## Error Handling Testing

### 1. Network Conditions

- Offline usage (PWA capabilities)
- Slow connections
- Connection drops during processing

### 2. Browser Compatibility

- Chrome (primary target)
- Safari (iOS compatibility)
- Firefox (alternative)
- Edge (enterprise environments)

### 3. Resource Constraints

- Low memory devices
- Older processors
- Limited storage

## Test Data Management

### 1. Test Image Library

**Categories**:

- **Calibration Standards**: Rulers, known objects
- **Marine Equipment**: Winches, cleats, hardware
- **Yacht Interiors**: Cabins, galleys, engine rooms
- **Challenging Scenarios**: Poor lighting, complex backgrounds

### 2. Expected Results Database

- Store known measurements for test objects
- Maintain accuracy baselines
- Track regression test results

## Continuous Testing Strategy

### 1. Automated Test Suite

- Run on every commit
- Performance regression detection
- Cross-browser testing matrix

### 2. Field Testing Schedule

- Monthly real-world testing
- User feedback collection
- Accuracy validation updates

### 3. Performance Monitoring

- Real user monitoring (RUM)
- Error tracking and reporting
- Usage analytics for feature adoption

## Success Criteria

### Functional Requirements

- ✅ Scale calibration accuracy: ±2% for same focal plane
- ✅ UI responsiveness: <100ms for interactions
- ✅ Image processing: <5 seconds for typical yacht photos
- ✅ Cross-device compatibility: iOS, Android, desktop

### User Experience Goals

- ✅ Engineer can calibrate scale in <30 seconds
- ✅ Intuitive workflow requiring minimal training
- ✅ Clear visual feedback for all calibration states
- ✅ Reliable performance in typical marine environments

---

## Testing Checklist

- [ ] **Scale Calibration Core**

  - [ ] Basic two-point calibration
  - [ ] Distance input validation
  - [ ] Calculation accuracy
  - [ ] UI state management

- [ ] **Canvas Interaction**

  - [ ] Point placement accuracy
  - [ ] Scale mode visualization
  - [ ] Mixed reference/scale points

- [ ] **Real-World Accuracy**

  - [ ] Various reference objects
  - [ ] Different image orientations
  - [ ] Multiple focal planes

- [ ] **Error Scenarios**

  - [ ] Invalid inputs
  - [ ] Edge cases
  - [ ] Network issues
  - [ ] Resource constraints

- [ ] **Field Validation**
  - [ ] Marina environment
  - [ ] Various lighting
  - [ ] Mobile device usage
  - [ ] Engineer workflow

This comprehensive testing strategy ensures the scale calibration feature meets the rigorous demands of field engineering while maintaining the user-friendly experience of the yacht CAD converter.
