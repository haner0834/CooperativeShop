import React from "react";

export interface SegmentOption<T extends string> {
  label: React.ReactNode;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps<T>) => {
  return (
    <div className={`flex space-x-1 p-1 bg-base-300 rounded-xl ${className}`}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={
              isActive
                ? "btn flex-1 bg-base-100"
                : "flex-1 text-sm px-4 hover:text-base-content/70 transition-colors"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
