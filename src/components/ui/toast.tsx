import * as React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title?: string;
    description?: React.ReactNode;
    variant?: 'default' | 'destructive' | 'success';
    action?: React.ReactNode;
    onClose?: () => void;
  }
>(({ className, title, description, variant, action, onClose, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role={variant === 'destructive' ? 'alert' : 'status'}
      className={`app-toast app-toast-${variant ?? 'default'} ${className ?? ''}`}
      {...props}
    >
      {variant === 'default' && <Info className="h-5 w-5" />}
      {variant === 'destructive' && <AlertCircle className="h-5 w-5" />}
      {variant === 'success' && <CheckCircle className="h-5 w-5" />}

      <div className="grid gap-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>

      {action}

      <button type="button" aria-label="Закрыть уведомление" onClick={onClose} className="toast-close">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
});
Toast.displayName = 'Toast';

const ToastViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`toast-viewport ${className ?? ''}`} aria-label="Уведомления" {...props} />
  ),
);
ToastViewport.displayName = 'ToastViewport';

export { Toast, ToastViewport };
