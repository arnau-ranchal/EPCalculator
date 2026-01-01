# EPCalculator v2 Frontend

Modern web interface for the EPCalculator error probability analysis tool.

## 🚀 Features

### Core Functionality
- **Error Probability Calculations**: Real-time computation using Gallager's bounds
- **Interactive Plotting**: Line plots and contour plots with Observable Plot
- **Parameter Validation**: Real-time input validation with helpful error messages
- **Responsive Design**: Mobile-first design that works on all devices

### Advanced Features
- **Plot Export**: Export plots as SVG, PNG, CSV, or JSON
- **Performance Caching**: Intelligent caching with LRU eviction
- **Debounced Inputs**: Smooth user experience with optimized input handling
- **Multiple Modulation Types**: Support for PAM, PSK, and QAM
- **Professional Styling**: UPF brand colors and modern design

## 🛠 Technical Stack

- **Framework**: Svelte 4 for reactive UI components
- **Plotting**: Observable Plot + D3 for interactive visualizations
- **Build Tool**: Vite 5 for fast development and optimized builds
- **Styling**: CSS3 with custom properties and modern layouts
- **API Integration**: Fetch API with intelligent error handling

## 📁 Architecture

```
src/frontend/
├── components/
│   ├── layout/           # Header, Footer, MainLayout
│   ├── simulation/       # Parameter forms, results display
│   └── plotting/         # Plot containers, controls, export
├── stores/              # Svelte reactive stores
│   ├── simulation.js    # Simulation parameters and validation
│   └── plotting.js      # Plot state and management
├── utils/               # Utility functions
│   ├── api.js          # API wrappers and error handling
│   └── cache.js        # Performance optimization utilities
├── styles/              # Global styles and themes
└── main.js             # Application entry point
```

## 🎨 Design System

### Colors
- **Primary**: `#C8102E` (UPF Red)
- **Secondary**: `#000000` (Black)
- **Background**: `#FFFFFF` (White)
- **Simulation**: `#FCF2F4` (Light Red Tint)
- **Plotting**: `#F0F0F0` (Light Gray)

### Typography
- **Font**: Inter (Google Fonts)
- **Sizes**: Responsive scale from 0.85em to 2.2rem
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 800 (extrabold)

### Layout
- **Max Width**: 1200px content container
- **Breakpoints**: 768px (mobile), 1100px (tablet)
- **Spacing**: CSS custom properties with consistent scale

## 🔄 State Management

### Simulation Store (`simulation.js`)
- Parameter values and validation state
- Loading states and error handling
- Advanced parameters toggle

### Plotting Store (`plotting.js`)
- Plot parameters and configuration
- Active plots array with metadata
- Scale and legend management

## ⚡ Performance Features

### Caching System
- **LRU Cache**: Automatic eviction of oldest entries
- **TTL Support**: 5-10 minute cache lifetime
- **Smart Keys**: Parameter-based cache keys

### Input Optimization
- **Debounced Updates**: 300ms delay for number inputs
- **Immediate Feedback**: Instant updates for select inputs
- **Validation**: Real-time parameter validation

### Bundle Optimization
- **Code Splitting**: Vendor, plotting, and utility chunks
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Efficient font and image loading

## 📊 Plot Features

### Line Plots
- Linear, log-X, log-Y, and log-log scales
- Customizable colors and line styles
- Interactive hover and selection
- Professional styling with grid lines

### Contour Plots
- 2D parameter space visualization
- Color-coded Z-axis values
- Interactive legends
- Export-ready formatting

### Export Capabilities
- **SVG**: Vector graphics with embedded metadata
- **PNG**: High-resolution raster images (2x scale)
- **CSV**: Raw data for external analysis
- **JSON**: Complete plot data and metadata

## 🔧 Development

### Local Development
```bash
npm run dev:frontend  # Start Vite dev server on :3000
npm run dev:backend   # Start API server on :8000
npm run dev          # Start both servers concurrently
```

### Build Production
```bash
npm run build:frontend  # Build optimized frontend bundle
npm run build          # Build complete application
```

### API Integration
The frontend communicates with the backend through:
- `/api/compute` - Main computation endpoint
- `/api/plot` - Line plot data generation
- `/api/plot_contour` - Contour plot data generation
- `/api/health` - Server health check

## 🌟 User Experience

### Loading States
- Animated spinners for computations
- Professional loading screen with UPF branding
- Progress indicators for long-running operations

### Error Handling
- Graceful API error display
- Input validation with helpful messages
- Fallback states for missing data

### Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly labels
- High contrast color ratios

## 📱 Responsive Design

### Mobile (≤768px)
- Single column layout
- Touch-friendly controls
- Optimized spacing and typography

### Tablet (768px-1100px)
- Adaptive grid layouts
- Balanced content distribution
- Touch and mouse support

### Desktop (≥1100px)
- Two-column layout with side-by-side panels
- Advanced plot controls
- Full feature set

## 🚀 Production Ready

The frontend is production-ready with:
- Optimized bundle sizes (vendor chunking)
- Error boundaries and fallback states
- Performance monitoring and caching
- Professional UPF branding
- Cross-browser compatibility
- Mobile-responsive design

Built with modern web standards and best practices for the EPCalculator v2 project at Universitat Pompeu Fabra.