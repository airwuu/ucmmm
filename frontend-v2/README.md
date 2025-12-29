# ucmmm frontend v2

The active frontend for ucmmm, built with Vite and React.

## Tech Stack

- **React 18** – UI framework
- **Vite** – Build tool and dev server
- **Tesseract.js** – Client-side OCR for food truck schedules
- **Vanilla CSS** – Component-scoped styling

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server runs at http://localhost:3000 or whatever port is shown in the terminal

## Project Structure

```
frontend-v2/
├── public/              # Static assets (just images and icons)
├── src/
│   ├── components/      # React components with co-located CSS
│   │   ├── Header.jsx
│   │   ├── MenuCard.jsx
│   │   ├── FoodTrucks.jsx
│   │   ├── ThemeSelector.jsx
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   │   ├── useTheme.js
│   │   └── useMediaQuery.js
│   ├── styles/          # Global styles/variables. Themes are defined here
│   │   └── index.css
│   ├── utils/           # Helper functions. Client side OCR is here
│   ├── App.jsx          
│   └── main.jsx         # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## Key Features

| Component | Description |
|-----------|-------------|
| `MenuCard` | Displays dining hall menu items |
| `FoodTrucks` | Food truck schedule with OCR capabilities |
| `ThemeSelector` | Theme customization (colors, dark mode) |
| `SwipeablePanel` | Mobile-friendly swipeable interface |

## Component Guide

### Responsive Layout (Desktop vs Mobile)

The app automatically adapts based on screen width using the `useMediaQuery` hook:

- **Desktop (≥900px)**: Uses `DesktopLayout` which displays all three panels (Pavilion, Dining Center, Food Trucks) side-by-side in a row
- **Mobile (<900px)**: Uses `SwipeablePanel` which shows one panel at a time with swipe navigation

The layout switch happens in `App.jsx`:
```jsx
{isDesktop ? (
    <DesktopLayout />
) : (
    <SwipeablePanel>...</SwipeablePanel>
)}
```

---

### SwipeablePanel

A touch-friendly navigation component for mobile users.

**How it works:**
- Contains three panels: Pavilion, Dining Center, and Food Trucks
- Users can swipe left/right to navigate between panels
- Tab buttons at the top provide quick navigation
- Dot indicators at the bottom show current position
- Auto-selects the appropriate panel on load (if Pavilion is closed but DC is open, starts on DC)

**Key features:**
- Touch gesture detection with configurable threshold (60px default)
- Smooth CSS transitions with cubic-bezier easing
- Visual drag feedback while swiping

---

### ThemeSelector

A modal dialog for choosing the app's visual theme.

**Available themes:**
- `og` (Original) – Classic dark theme from v1
- `catgold` – UC Merced gold accent
- `light` – Classic light mode
- `midnight` – Deep blue tones
- `sunset` – Warm orange colors
- `forest` – Nature greens
- `lavender` – Soft purple
- `ocean` – Cool cyan
- `custom` – User-defined colors

**Custom theme:**
Users can create their own theme by adjusting 6 color values:
- Background, Elevated, Card, Text, Accent, Secondary

**Persistence:**
- Theme preference saved to cookies (30 days)
- Custom colors also saved to cookies
- Respects system preference (light/dark) if no saved preference

---

### MenuCard

Displays the menu for a dining location (Pavilion or Dining Center).

**Features:**
- Shows current meal period and hours
- Groups menu items by station
- Displays "Closed" overlay when location is not serving
- Shows next opening time when closed
- Links to official menu site

**Menu item reporting (crowdsourcing):**
- Tap any menu item to report it as missing/unavailable
- Tap again to undo the report
- Reports are sent to the backend and contribute to crowd-sourced data
- Toast notifications confirm actions with undo option

---

### FoodTrucks

Displays the weekly food truck schedule with OCR capabilities.

**Data flow:**
1. First tries to fetch cached data from backend
2. If no cache, user can click "Reload" to run client-side OCR
3. OCR processes the official schedule image using Tesseract.js + OpenCV
4. Parsed results are submitted to backend cache for future users

**UI elements:**
- Week selector dropdown (when multiple weeks available)
- Day selector tabs (Mon-Fri)
- Source indicator badge (Cached/OCR/Live)
- Reload button to manually trigger OCR

**OCR process:**
1. Preloads OpenCV.js in background on component mount
2. Fetches schedule image from UC Merced dining website
3. Preprocesses image with OpenCV for better accuracy
4. Runs Tesseract.js OCR to extract text
5. Parses tabular data into structured format
6. Submits results to backend cache

---

### Toast System

Non-intrusive notifications for user feedback.

- `showSuccess(message)` – Green success toast
- `showUndo(message, undoFn)` – Toast with undo button
- Auto-dismiss after 3 seconds
- Managed by `useToast` hook in `App.jsx`

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run preview` | Preview production build locally |

## Styling

This project uses vanilla CSS with:
- CSS custom properties (variables) for theming in `src/styles/index.css`
- Component-scoped CSS files (e.g., `MenuCard.jsx` + `MenuCard.css`)
- Mobile-first responsive design

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on how to contribute.
