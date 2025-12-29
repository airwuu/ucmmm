# Contributing to ucmmm

Thank you for your interest in contributing to ucmmm! This guide will help you get started.

## Project Structure

```
ucmmm/
├── frontend-v1/    # Legacy Next.js frontend (maintenance mode, please ignore)
├── frontend-v2/    # Active Vite + React frontend (accepting contributions)
└── README.md
```

> **Note:** Active development is focused on `frontend-v2`. The `frontend-v1` directory contains the legacy frontend and is preserved for reference purposes. The migration from `frontend-v1` to `frontend-v2` could still have some lost features. Please report any missing features to the GitHub issue tracker.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

1. **Fork the repository** on GitHub 

2. Open your favorite IDE and use the terminal for the following steps

3. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ucmmm.git
   cd ucmmm
   ```

4. **Install dependencies** for frontend-v2 after changing into the correct directory
   ```bash
   cd frontend-v2
   npm install
   ```

5. **Start the development server** 
   ```bash
   npm run dev
   ```

6. **Open** http://localhost:3000 in your browser (or whatever port the dev server is running on, the terminal will tell you)

## How to Contribute

### Reporting Bugs

1. Search [existing issues](https://github.com/airwuu/ucmmm/issues) to avoid duplicates
2. Try and create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Browser/device information

### Suggesting Features

2. Open a new issue describing:
   - The problem you're trying to solve
   - Your proposed solution
   - Any alternatives you've considered

### Submitting Code

1. Create a branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. Make your changes following our [code style](#code-style)

3. Test your changes locally

4. Commit with clear, descriptive messages:
   ```bash
   git commit -m "feat: add allergen filter to menu items"
   git commit -m "fix: correct food truck schedule display"
   ```

5. Push to your fork and open a Pull Request

### Pull Request Guidelines

- Keep PRs focused on a single change
- Include screenshots for UI changes
- Link related issues using `Fixes #123` or `Closes #123`
- Ensure the build passes before requesting review please

## Code Style

- Use meaningful variable and function names
- Keep components small and focused
- Use CSS modules or component-scoped CSS (`.ComponentName.css`)
- Add comments for complex logic

## Project Resources

- [Frontend v2 Documentation](frontend-v2/README.md)
- [Issue Tracker](https://github.com/airwuu/ucmmm/issues)

## Questions?

Feel free to open an issue if you have questions or need help getting started!
