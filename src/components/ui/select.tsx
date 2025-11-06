"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

interface SelectValueProps {}

const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 });
  
  React.useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          // Use viewport coordinates for fixed positioning
          setPosition({
            top: rect.bottom,
            left: rect.left,
            width: rect.width,
          });
        }
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);
  
  // Separate children into trigger and content
  let triggerChild: React.ReactElement | null = null;
  let contentChild: React.ReactElement | null = null;
  
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const childType = child.type as any;
      if (childType?.displayName === "SelectTrigger" || 
          (childType?.render && childType?.$$typeof)) {
        triggerChild = child as React.ReactElement;
      } else {
        contentChild = child as React.ReactElement;
      }
    }
  });
  
  // Helper function to recursively enhance SelectValue components with value prop
  const enhanceSelectValue = (children: React.ReactNode, value: string): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        // Check if it's SelectValue by checking the function name or displayName
        const childType = child.type as any;
        const isSelectValue = childType?.displayName === "SelectValue" || 
                              childType?.name === "SelectValue" ||
                              (typeof childType === 'function' && childType.name === 'SelectValue');
        
        if (isSelectValue) {
          return React.cloneElement(child as React.ReactElement<any>, {
            value: value,
          });
        }
        
        // Recursively check children
        if (child.props.children) {
          return React.cloneElement(child as React.ReactElement<any>, {
            children: enhanceSelectValue(child.props.children, value),
          });
        }
      }
      return child;
    });
  };
  
  return (
    <div className="relative">
      {triggerChild && React.cloneElement(triggerChild, {
        value,
        onValueChange,
        isOpen,
        setIsOpen,
        ref: triggerRef,
        children: enhanceSelectValue(triggerChild.props.children, value),
      })}
      {contentChild && React.cloneElement(contentChild, {
        value,
        onValueChange,
        isOpen,
        setIsOpen,
        position,
      })}
    </div>
  );
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps & any>(({ 
  className = "", 
  children, 
  isOpen, 
  setIsOpen 
}, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={() => setIsOpen(!isOpen)}
    className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </button>
));
SelectTrigger.displayName = "SelectTrigger";

const SelectContent: React.FC<SelectContentProps & any> = ({ 
  children, 
  isOpen, 
  setIsOpen, 
  onValueChange,
  className = "",
  position
}) => {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  React.useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.select-content-portal') && !target.closest('button')) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, setIsOpen]);
  
  if (!isOpen || !mounted) return null;
  
  // Default styles with high z-index, can be overridden by className
  const defaultClasses = "fixed z-[99999] mt-1 max-h-96 overflow-auto rounded-md border border-slate-600 bg-slate-700 shadow-2xl select-content-portal";
  const combinedClasses = className ? `${defaultClasses} ${className}` : defaultClasses;
  
  const content = (
    <div 
      className={combinedClasses}
      style={{
        top: `${position?.top || 0}px`,
        left: `${position?.left || 0}px`,
        width: `${position?.width || 200}px`,
      }}
    >
      <div className="p-1">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onValueChange,
              setIsOpen,
            });
          }
          return child;
        })}
      </div>
    </div>
  );
  
  return createPortal(content, document.body);
};

const SelectItem: React.FC<SelectItemProps & any> = ({ 
  value, 
  children, 
  onValueChange, 
  setIsOpen,
  className = ""
}) => (
  <button
    type="button"
    onClick={() => {
      onValueChange(value);
      setIsOpen(false);
    }}
    className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm text-white outline-none hover:bg-slate-600 focus:bg-slate-600 ${className}`}
  >
    {children}
  </button>
);

const SelectValue: React.FC<SelectValueProps & any> = ({ value, children, placeholder }) => {
  // If children are provided, render them (they should contain the label)
  if (children) {
    return <span>{children}</span>;
  }
  
  // If placeholder is provided and no value, show placeholder
  if (!value && placeholder) {
    return <span className="text-white/60">{placeholder}</span>;
  }
  
  // Fallback: try to display the value
  return <span>{value || placeholder || 'Select...'}</span>;
};
SelectValue.displayName = "SelectValue";

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
};