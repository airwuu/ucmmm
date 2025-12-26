import './InfoModal.css';

export default function InfoModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="info-modal-backdrop" onClick={handleBackdropClick}>
            <div className="info-modal animate-scale-in">
                <div className="info-modal__header">
                    <h2>About ucmmm</h2>
                    <button className="info-modal__close" onClick={onClose} aria-label="Close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="info-modal__content">
                    {/* How it works */}
                    <section className="info-section">
                        <h3>How It Works</h3>
                        <ul className="info-list">
                            <li>↔️ <strong>Swipe</strong> to view current menus for Pavilion and Dining Center</li>
                            <li>👆 <strong>Tap items</strong> to report when they run out</li>
                            <li>🔴 Items turn <strong>orange/red</strong> when multiple students report them missing</li>
                        </ul>
                    </section>

                    {/* Add to homescreen */}
                    <section className="info-section">
                        <h3>Add to Home Screen</h3>
                        <p className="info-text">Install this app for quick access:</p>
                        <div className="homescreen-steps">
                            <div className="homescreen-step">
                                <div className="step-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                                        <polyline points="16 6 12 2 8 6" />
                                        <line x1="12" y1="2" x2="12" y2="15" />
                                    </svg>
                                </div>
                                <span>Tap <strong>Share</strong></span>
                            </div>
                            <div className="step-arrow">→</div>
                            <div className="homescreen-step">
                                <div className="step-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <line x1="12" y1="8" x2="12" y2="16" />
                                        <line x1="8" y1="12" x2="16" y2="12" />
                                    </svg>
                                </div>
                                <span><strong>Add to Home Screen</strong></span>
                            </div>
                        </div>
                    </section>

                    {/* GitHub */}
                    <section className="info-section">
                        <h3>Open Source</h3>
                        <p className="info-text">This app is built by UC Merced students.</p>
                        <a
                            href="https://github.com/airwuu/ucmmm"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="github-link"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            View on GitHub
                        </a>
                    </section>
                </div>
            </div>
        </div>
    );
}
