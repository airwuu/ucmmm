import { useTheme, THEMES } from '../hooks/useTheme';
import './Header.css';

export default function Header({ onThemeClick, onInfoClick }) {
    const { theme } = useTheme();
    const currentTheme = THEMES.find(t => t.id === theme);

    return (
        <header className="header">
            <div className="header-content">
                <div className="header-brand">
                    <img src="/bobcat.png" alt="" className="header-logo" />
                    <div className="header-title">
                        <h1>ucmmm</h1>
                        <span className="header-subtitle text-xs">you see m-m-m</span>
                    </div>
                </div>

                <div className="header-actions">
                    <button
                        className="header-btn"
                        onClick={onInfoClick}
                        aria-label="About this app"
                        title="About"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="10" x2="12" y2="7" />
                            <line x1="12" y1="12" x2="12.01" y2="019" />
                        </svg>
                    </button>

                    <button
                        className="header-btn"
                        onClick={onThemeClick}
                        aria-label="Change theme"
                        title={`Theme: ${currentTheme?.name}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}
