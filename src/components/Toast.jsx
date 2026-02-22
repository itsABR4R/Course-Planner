/**
 * src/components/Toast.jsx
 * Animated toast notification for conflict/success messages.
 */
import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

const icons = {
    error: <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />,
    success: <CheckCircle size={18} className="text-green-400 flex-shrink-0" />,
    warning: <Info size={18} className="text-amber-400 flex-shrink-0" />,
};

const styles = {
    error: 'border-red-500/40 bg-red-950/60',
    success: 'border-green-500/40 bg-green-950/60',
    warning: 'border-amber-500/40 bg-amber-950/60',
};

export default function Toast({ toast, onDismiss }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (toast) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [toast]);

    if (!toast) return null;

    return (
        <div
            className={`
        fixed bottom-6 right-6 z-50 max-w-sm w-full
        animate-slide-in
        glass border rounded-xl px-4 py-3
        flex items-start gap-3 shadow-2xl
        ${styles[toast.type] || styles.error}
      `}
        >
            {icons[toast.type] || icons.error}
            <p className="text-sm text-slate-200 flex-1 leading-snug">{toast.message}</p>
            <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-white transition-colors flex-shrink-0 mt-0.5"
                aria-label="Dismiss"
            >
                <X size={15} />
            </button>
        </div>
    );
}
