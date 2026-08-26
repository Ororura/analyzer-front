import * as React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { title?: string; description?: React.ReactNode; variant?: 'default' | 'destructive' | 'success'; action?: React.ReactNode; onClose?: () => void }>(
  ({ className, title, description, variant, action, onClose, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all
          ${variant === 'default' ? 'border bg-background text-foreground' : variant === 'destructive' ? 'destructive group border-destructive bg-destructive text-destructive-foreground' : variant === 'success' ? 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400' : ''}
          ${className || ''}`}
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
        
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }
);
Toast.displayName = 'Toast';

const ToastViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
      {...props}
    />
  )
);
ToastViewport.displayName = 'ToastViewport';

export { Toast, ToastViewport };
