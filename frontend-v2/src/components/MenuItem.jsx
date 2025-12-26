import { useState } from 'react';
import './MenuItem.css';

/**
 * Individual menu item with toggle reporting
 * - First tap: report as missing
 * - Second tap: undo report
 */
export default function MenuItem({ item, onReport, onUnreport, userReported = false, disabled = false }) {
    const [processing, setProcessing] = useState(false);

    const reports = item.missing_reports || 0;

    // Determine status based on reports
    const getStatus = () => {
        if (reports >= 3) return 'out';
        if (reports >= 1) return 'low';
        return 'available';
    };

    const status = getStatus();

    const handleTap = async () => {
        if (processing || disabled) return;

        setProcessing(true);
        try {
            if (userReported) {
                await onUnreport(item.item_id);
            } else {
                await onReport(item.item_id);
            }
        } catch (err) {
            console.error('Action failed:', err);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <button
            className={`menu-item menu-item--${status} ${disabled ? 'menu-item--disabled' : ''}`}
            onClick={handleTap}
            disabled={processing || disabled}
            aria-label={`${item.name}${reports > 0 ? `, ${reports} missing reports` : ''}`}
        >
            <span className="menu-item__name">{item.name}</span>
            {reports > 0 && (
                <span className="menu-item__badge" aria-hidden="true">
                    {reports}
                </span>
            )}
        </button>
    );
}
