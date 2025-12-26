import { useState, useCallback } from 'react';

let toastId = 0;

/**
 * Hook for managing toast notifications
 */
export function useToast() {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 2500) => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type, duration }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showSuccess = useCallback((message) => addToast(message, 'success'), [addToast]);
    const showUndo = useCallback((message) => addToast(message, 'undo'), [addToast]);
    const showInfo = useCallback((message) => addToast(message, 'info'), [addToast]);

    return {
        toasts,
        addToast,
        removeToast,
        showSuccess,
        showUndo,
        showInfo,
    };
}
