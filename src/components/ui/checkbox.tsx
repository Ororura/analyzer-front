import * as React from "react";
import { cn } from "@/lib/utils/helpers";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate = false, ...props }, forwardedRef) => {
    const localRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLInputElement);
    React.useEffect(() => {
      if (localRef.current) localRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
      <input
        ref={localRef}
        type="checkbox"
        className={cn("h-4 w-4 rounded border-input accent-primary", className)}
        {...props}
      />
    );
  },
);
Checkbox.displayName = "Checkbox";
