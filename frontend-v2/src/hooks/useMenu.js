import { useState, useEffect, useCallback } from 'react';
import { fetchMenu, reportMissing, unreportMissing } from '../utils/api';

// Store user's reported items in session (persists across panel switches but not page reload)
const userReportedItems = new Set();

/**
 * Hook for fetching and managing menu data
 */
export function useMenu(location, { showSuccess, showUndo }) {
    const [data, setData] = useState({ items: [], meal: 'closed', isOpen: false });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadMenu = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await fetchMenu(location);
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [location]);

    // Initial load
    useEffect(() => {
        loadMenu();
    }, [loadMenu]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(loadMenu, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [loadMenu]);

    // Report item as missing (with optimistic update)
    const reportItem = useCallback(async (itemId) => {
        // Mark as user-reported
        userReportedItems.add(itemId);

        // Optimistic update
        setData(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.item_id === itemId
                    ? { ...item, missing_reports: (item.missing_reports || 0) + 1 }
                    : item
            )
        }));

        // Show toast
        showSuccess?.('Reported as missing');

        try {
            await reportMissing(itemId);
        } catch (err) {
            // Revert on error
            userReportedItems.delete(itemId);
            setData(prev => ({
                ...prev,
                items: prev.items.map(item =>
                    item.item_id === itemId
                        ? { ...item, missing_reports: Math.max(0, (item.missing_reports || 1) - 1) }
                        : item
                )
            }));
            throw err;
        }
    }, [showSuccess]);

    // Unreport item (calls API to decrement)
    const unreportItem = useCallback(async (itemId) => {
        // Remove from user-reported
        userReportedItems.delete(itemId);

        // Optimistic update (decrement count)
        setData(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.item_id === itemId
                    ? { ...item, missing_reports: Math.max(0, (item.missing_reports || 1) - 1) }
                    : item
            )
        }));

        // Show toast
        showUndo?.('Report removed');

        try {
            await unreportMissing(itemId);
        } catch (err) {
            // Revert on error
            userReportedItems.add(itemId);
            setData(prev => ({
                ...prev,
                items: prev.items.map(item =>
                    item.item_id === itemId
                        ? { ...item, missing_reports: (item.missing_reports || 0) + 1 }
                        : item
                )
            }));
            throw err;
        }
    }, [showUndo]);

    // Check if user reported an item
    const isUserReported = useCallback((itemId) => {
        return userReportedItems.has(itemId);
    }, []);

    // Group items by station
    const groupedItems = data.items.reduce((acc, item) => {
        const station = item.station?.trim() || 'Other';
        if (!acc[station]) acc[station] = [];
        acc[station].push(item);
        return acc;
    }, {});

    return {
        items: data.items,
        groupedItems,
        meal: data.meal,
        isOpen: data.isOpen,
        loading,
        error,
        refetch: loadMenu,
        reportItem,
        unreportItem,
        isUserReported,
    };
}
