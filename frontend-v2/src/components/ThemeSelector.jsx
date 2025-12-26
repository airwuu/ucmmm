import { useState } from 'react';
import { useTheme, THEMES } from '../hooks/useTheme';
import './ThemeSelector.css';

export default function ThemeSelector({ isOpen, onClose }) {
    const { theme, setTheme, customColors, setCustomColors } = useTheme();
    const [showCustom, setShowCustom] = useState(theme === 'custom');

    if (!isOpen) return null;

    const handleSelect = (themeId) => {
        if (themeId === 'custom') {
            setShowCustom(true);
            setTheme('custom');
        } else {
            setShowCustom(false);
            setTheme(themeId);
            onClose();
        }
    };

    const handleColorChange = (key, value) => {
        setCustomColors({ [key]: value });
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
                    <h2>{showCustom ? 'Custom Colors' : 'Choose Theme'}</h2>
                    <button className="theme-selector__close" onClick={onClose} aria-label="Close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {showCustom ? (
                    <div className="custom-colors">
                        <button
                            className="custom-colors__back"
                            onClick={() => setShowCustom(false)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                            Back to themes
                        </button>

                        <div className="custom-colors__grid">
                            <div className="color-picker">
                                <label htmlFor="bg-color">Background</label>
                                <div className="color-picker__input">
                                    <input
                                        type="color"
                                        id="bg-color"
                                        value={customColors.background}
                                        onChange={(e) => handleColorChange('background', e.target.value)}
                                    />
                                    <span>{customColors.background}</span>
                                </div>
                            </div>

                            <div className="color-picker">
                                <label htmlFor="fg-color">Foreground</label>
                                <div className="color-picker__input">
                                    <input
                                        type="color"
                                        id="fg-color"
                                        value={customColors.foreground}
                                        onChange={(e) => handleColorChange('foreground', e.target.value)}
                                    />
                                    <span>{customColors.foreground}</span>
                                </div>
                            </div>

                            <div className="color-picker">
                                <label htmlFor="text-color">Text</label>
                                <div className="color-picker__input">
                                    <input
                                        type="color"
                                        id="text-color"
                                        value={customColors.text}
                                        onChange={(e) => handleColorChange('text', e.target.value)}
                                    />
                                    <span>{customColors.text}</span>
                                </div>
                            </div>

                            <div className="color-picker">
                                <label htmlFor="accent-color">Accent</label>
                                <div className="color-picker__input">
                                    <input
                                        type="color"
                                        id="accent-color"
                                        value={customColors.accent}
                                        onChange={(e) => handleColorChange('accent', e.target.value)}
                                    />
                                    <span>{customColors.accent}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            className="custom-colors__done"
                            onClick={onClose}
                        >
                            Done
                        </button>
                    </div>
                ) : (
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
                )}
            </div>
        </div>
    );
}
