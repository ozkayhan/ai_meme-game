import React from 'react';

const Button = ({ children, onClick, className = "", disabled = false, variant = "primary" }) => {
    const baseStyle = "w-64 py-3 rounded-lg font-bold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
        green: "bg-green-500 hover:bg-green-600 text-white",
        blue: "bg-blue-500 hover:bg-blue-600 text-white",
        red: "bg-red-500 hover:bg-red-600 text-white",
        outline: "border-2 border-indigo-600 text-indigo-400 hover:bg-indigo-600/10"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyle} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;
