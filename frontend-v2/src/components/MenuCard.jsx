import { useMenu } from '../hooks/useMenu';
import { getMealTimeInfo, getNextOpenTime } from '../utils/api';
import MenuItem from './MenuItem';
import './MenuCard.css';

/**
 * Menu card for Pavilion or DC
 */

const OFFICIAL_URLS = {
    pav: 'https://uc-merced-the-pavilion.widget.eagle.bigzpoon.com/menus',
    dc: 'https://uc-merced-the-pavilion.widget.eagle.bigzpoon.com/menus',
};

export default function MenuCard({ location, name, toastHandlers }) {
    const { groupedItems, meal, isOpen, loading, error, refetch, reportItem, unreportItem, isUserReported } = useMenu(location, toastHandlers);
    const timeInfo = getMealTimeInfo(location);
    const nextOpen = !isOpen ? getNextOpenTime(location) : null;

    const stations = Object.keys(groupedItems);
    const hasItems = stations.length > 0;
    const officialUrl = OFFICIAL_URLS[location];

    return (
        <div className={`menu-card ${!isOpen ? 'menu-card--closed' : ''}`}>
            {/* Header */}
            <div className="menu-card__header">
                <h2 className="menu-card__title">{name}</h2>
                <div className="menu-card__status">
                    <span className={`status-badge status-badge--${isOpen ? 'open' : 'closed'}`}>
                        {isOpen ? meal?.replace('_', ' ') : 'Closed'}
                    </span>
                    {officialUrl && (
                        <a
                            href={officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="status-badge status-badge--link"
                            title="View official menu"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            Official
                        </a>
                    )}
                </div>
            </div>

            {/* Time Info */}
            {isOpen && timeInfo.hours[meal] && (
                <div className="menu-card__time">
                    {timeInfo.hours[meal].start} – {timeInfo.hours[meal].end}
                </div>
            )}

            {/* Next opening time when closed */}
            {!isOpen && nextOpen && (
                <div className="menu-card__next-open">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Opens {nextOpen}</span>
                </div>
            )}

            {timeInfo.closedReason && (
                <div className="menu-card__closed-reason">{timeInfo.closedReason}</div>
            )}

            {/* Content */}
            <div className="menu-card__content">
                {loading ? (
                    <div className="menu-card__loading">
                        <div className="skeleton skeleton--text" />
                        <div className="skeleton skeleton--text skeleton--short" />
                        <div className="skeleton skeleton--items">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="skeleton skeleton--item" />
                            ))}
                        </div>
                    </div>
                ) : error ? (
                    <div className="menu-card__error">
                        <p>Failed to load menu</p>
                        <button onClick={refetch} className="retry-btn">Try Again</button>
                    </div>
                ) : hasItems ? (
                    <div className="menu-card__stations">
                        {stations.map((station) => (
                            <div key={station} className="station">
                                <h3 className="station__name">{station}</h3>
                                <div className="station__items">
                                    {groupedItems[station].map((item) => (
                                        <MenuItem
                                            key={item.item_id}
                                            item={item}
                                            onReport={reportItem}
                                            onUnreport={unreportItem}
                                            userReported={isUserReported(item.item_id)}
                                            disabled={!isOpen}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="menu-card__empty">
                        <p>No menu items available</p>
                        <a
                            href="https://uc-merced-the-pavilion.widget.eagle.bigzpoon.com/menus"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="external-link"
                        >
                            View official menu
                        </a>
                    </div>
                )}
            </div>

            {/* Tap to report hint - only when open */}
            {isOpen && hasItems && (
                <div className="menu-card__hint">
                    <span>Tap item to report missing • Tap again to undo</span>
                </div>
            )}

            {/* Closed overlay */}
            {!isOpen && <div className="menu-card__overlay" />}
        </div>
    );
}
