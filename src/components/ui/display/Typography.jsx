import React from 'react';
import { TOKENS } from '../../../theme/constants';

export const H1 = ({ children, className = "" }) => <h1 className={`${TOKENS.text.h1} ${className}`}>{children}</h1>;
export const H2 = ({ children, className = "" }) => <h2 className={`${TOKENS.text.h2} ${className}`}>{children}</h2>;
export const H3 = ({ children, className = "" }) => <h3 className={`${TOKENS.text.h3} ${className}`}>{children}</h3>;
export const TextLabel = ({ children, className = "" }) => <span className={`${TOKENS.text.label} ${className}`}>{children}</span>;
export const PriceText = ({ value, className = "" }) => (
    <span className={`${TOKENS.text.price} ${className}`}>
        ${Number(value || 0).toLocaleString()}
    </span>
);