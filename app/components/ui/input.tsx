'use client';

import React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full p-2 border rounded ${className ?? ''}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
