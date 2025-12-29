# ucmmm frontend v2

The active frontend for ucmmm, built with Vite and React. There is also a legacy frontend in the `frontend-v1` directory that you can reference and even run to see the original design.

These documents should help you get started with the codebase. I apologize for the mess, but there is a lot of AI generated comments in most files *in addition* to this document that should help contextualize what is happening. 

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

**UI/UX Design:**
- Contains three panels: Pavilion, Dining Center, and Food Trucks
- Users can swipe left/right to navigate between panels
- Tab buttons at the top provide quick navigation
- Dot indicators at the bottom show current position
- Smooth CSS transitions with cubic-bezier easing


**Key features:**
- Auto-selects the appropriate panel on load (if Pavilion is closed but DC is open, starts on DC)
- Touch gesture detection with configurable threshold (60px default) This hopefully prevents accidental swiping, but more feedback is welcome.
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

**Necessary Features:**
- Shows current meal period and hours (ex: "Breakfast: 7:30 AM - 10:30 AM")
- Groups menu items by station
- Displays "Closed" overlay when location is not serving and disables reporting menu items
- Shows next opening time when closed in relative time
- Easy hyperlink to official menu site for users to cross reference

**Menu item reporting (crowdsourcing):**

The objective is to make reporting as easy as possible, so people are more inclined to do so:
- Tap any menu item to report it as missing/unavailable
- Tap again to undo the report
- Reports are sent to the backend via API calls
- Toast notifications provide feedback. Also, note that we haven't implemented a rate limiter yet, so this UI clutter technically limits the rate of spam reporting. It's hard to spam reports when your whole screen is full of notifications.

---

### FoodTrucks

Displays the weekly food truck schedule and has OCR capabilities.

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
2. Fetches schedule image from UC Merced dining website. This is done via a proxy server on the backend to avoid CORS issues. 
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

## Backend Context

The backend API is a Cloudflare worker and is built with Hono.js. It provides the following endpoints:

- `GET /api/menu` – Fetch menu data for a specific location
- `GET /api/foodtrucks` – Fetch food truck schedule
- `POST /api/report` – Submit menu item report
- `GET /api/cache` – Fetch cached data
- `POST /api/cache` – Submit new cache data

As an interface to interact with the api, the `utils/api.js` file should help you reverse engineer the api and how it is used. 

This backend api is stored on a separate public Github repository called ucmmmdb, but still needs to be polished and moved over to this monorepo. Feel free to fork it and start your own CF worker + D1 database if you would like to try changing anything on the backend, it should take about 30 minutes.  

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on how to contribute.
