import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}

const iconMap = {
    success: CheckCircle,
    error: AlertTriangle,
    info: Info,
};

const colorMap = {
    success: 'border-green-500/30 bg-green-500/10 text-green-400',
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
};

const Toast: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    const Icon = iconMap[toast.type];

    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 5000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-xl ${colorMap[toast.type]} animate-slide-in`}>
            <Icon size={18} />
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button onClick={() => onDismiss(toast.id)} className="hover:opacity-70 transition-opacity">
                <X size={16} />
            </button>
        </div>
    );
};

// Toast container hook
export const useToast = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((type: ToastMessage['type'], message: string) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        setToasts((prev) => [...prev, { id, type, message }]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const ToastContainer: React.FC = () => (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
            ))}
        </div>
    );

    return { addToast, ToastContainer };
};

export default Toast;
