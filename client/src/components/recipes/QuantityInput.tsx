import React, { useState, useEffect } from 'react';

interface QuantityInputProps {
    value: string | number;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    autoFocus?: boolean;
}

export const QuantityInput = ({ 
    value, 
    onChange, 
    placeholder, 
    className, 
    disabled,
    required,
    autoFocus
}: QuantityInputProps) => {
    const [displayValue, setDisplayValue] = useState(value?.toString() || '');

    useEffect(() => {
        setDisplayValue(value?.toString() || '');
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const allowedControls = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];

        if (allowedControls.includes(e.key) || e.ctrlKey || e.metaKey) return;
        if (/^[0-9]$/.test(e.key)) return;

        // ALLOW SPACES for mixed numbers!
        if (e.key === ' ' && !displayValue.includes(' ') && displayValue.length > 0) return;

        const hasSeparator = displayValue.includes('.') || displayValue.includes('/');
        if ((e.key === '.' || e.key === '/') && !hasSeparator && displayValue.length > 0) return;

        e.preventDefault();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;

        // Updated Regex: Allows an optional space inside the string
        if (val === '' || /^[0-9]*\s?[0-9]*[./]?[0-9]*$/.test(val)) {
            setDisplayValue(val);
            onChange(val);
        }
    };

    return (
        <input
            type="text"
            inputMode="decimal"
            value={displayValue}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            placeholder={placeholder}
            className={className}
            disabled={disabled}
            required={required}
            autoComplete="off"
            autoFocus={autoFocus}
        />
    );
};
