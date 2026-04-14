# CarbFood Detector - Web Demo

React-based web interface for testing the CarbFood Detector API.

## Features

- 📤 Drag-and-drop or click to upload images
- 🎯 Real-time object detection visualization
- ⚙️ Adjustable confidence and IoU thresholds
- 📊 Detection results table with bounding box coordinates
- 🎨 Clean, modern UI with visual feedback

## Prerequisites

- Node.js 18+ or Bun
- Backend API running on `http://localhost:8000`

## Setup

### Install Dependencies

Using npm:
```bash
npm install
```

Using bun (faster):
```bash
bun install
```

## Development

### Run Development Server

Using npm:
```bash
npm run dev
```

Using bun:
```bash
bun run dev
```

The application will be available at `http://localhost:3000`

## Build for Production

### Build

Using npm:
```bash
npm run build
```

Using bun:
```bash
bun run build
```

### Preview Production Build

Using npm:
```bash
npm run preview
```

Using bun:
```bash
bun run preview
```

## How to Use

1. **Start the Backend API**
   ```bash
   cd ../backend
   uvicorn app.main:app --reload
   ```

2. **Start the Web Demo**
   ```bash
   npm run dev
   ```

3. **Upload an Image**
   - Click the upload area or drag and drop an image
   - Supported formats: JPG, PNG, JPEG

4. **Adjust Settings** (Optional)
   - **Confidence Threshold**: Higher values = fewer but more confident detections
   - **IoU Threshold**: Controls overlap filtering in non-maximum suppression

5. **Detect Objects**
   - Click "Detect Objects" button
   - Wait for processing (2-5 seconds on CPU)
   - View results with bounding boxes and detection table

6. **Reset**
   - Click "Reset" to clear results and upload a new image

## Configuration

### API Endpoint

The web app connects to the backend API via proxy configured in `vite.config.ts`:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

To change the backend URL, modify the `target` in `vite.config.ts`.

## Project Structure

```
web/
├── src/
│   ├── components/
│   │   ├── ImageUpload.tsx         # Image upload component
│   │   ├── ImageUpload.css
│   │   ├── ControlPanel.tsx        # Settings and buttons
│   │   ├── ControlPanel.css
│   │   ├── DetectionResults.tsx    # Results display
│   │   └── DetectionResults.css
│   ├── types/
│   │   └── api.ts                  # TypeScript interfaces
│   ├── App.tsx                     # Main application
│   ├── App.css
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
├── public/
├── index.html
├── package.json
├── vite.config.ts                  # Vite configuration
└── tsconfig.json                   # TypeScript configuration
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **CSS3** - Styling with gradients and animations

## Troubleshooting

### Backend Connection Failed

**Error:** Network error or CORS issue

**Solutions:**
1. Ensure backend is running on `http://localhost:8000`
2. Check backend has CORS middleware enabled
3. Verify the proxy configuration in `vite.config.ts`

### No Detections Shown

**Possible causes:**
- Confidence threshold too high - try lowering it to 0.1
- No target objects in the image
- Model not trained for the objects in the image

### Slow Detection

**Causes:**
- Running on CPU (normal: 2-5 seconds)
- Large image size
- Complex scene with many objects

**Solutions:**
- Use GPU-enabled backend for faster inference
- Resize images before upload
- Be patient - CPU inference is slower

## Development Tips

- Hot reload is enabled - changes will reflect immediately
- Use browser DevTools to inspect API calls
- Check Network tab for API response details
- Console logs any errors from the API

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Part of the CarbFood Detector thesis project.
