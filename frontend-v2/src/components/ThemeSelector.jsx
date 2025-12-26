import { useTheme, THEMES } from '../hooks/useTheme';
import './ThemeSelector.css';

export default function ThemeSelector({ isOpen, onClose }) {
    const { theme, setTheme } = useTheme();

    if (!isOpen) return null;

    const handleSelect = (themeId) => {
        setTheme(themeId);
        onClose();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="theme-selector-backdrop" onClick={handleBackdropClick}>
            <div className="theme-selector animate-scale-in">
                <div className="theme-selector__header">
                    <h2>Choose Theme</h2>
                    <button className="theme-selector__close" onClick={onClose} aria-label="Close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="theme-selector__grid">
                    {THEMES.map((t) => (
                        <button
                            key={t.id}
                            className={`theme-option ${theme === t.id ? 'theme-option--active' : ''}`}
                            onClick={() => handleSelect(t.id)}
                            data-theme-preview={t.id}
                        >
                            <div className="theme-option__preview">
                                <div className="theme-option__color" />
                            </div>
                            <div className="theme-option__info">
                                <span className="theme-option__name">{t.name}</span>
                                <span className="theme-option__desc">{t.description}</span>
                            </div>
                            {theme === t.id && (
                                <span className="theme-option__check">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
