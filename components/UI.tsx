import React from 'react';
import { LucideIcon, X } from 'lucide-react';
import { useTheme } from './ThemeContext';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  ...props
}) => {
  const { isDark } = useTheme();
  const baseStyle = "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7B2CBF] focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: `bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white hover:from-[#9D4EDD] hover:to-[#7B2CBF] shadow-lg shadow-purple-900/30 hover:shadow-purple-500/40 active:scale-95 btn-glow`,
    secondary: `border border-[#7B2CBF] text-white bg-transparent hover:bg-[#7B2CBF]/15 hover:shadow-[0_0_18px_rgba(123,44,191,0.4)] active:scale-95`,
    outline: `border ${isDark ? 'border-neutral-700 text-neutral-300 hover:border-purple-500 hover:text-white bg-transparent' : 'border-purple-300 text-[#6b46a0] hover:border-[#7B2CBF] hover:text-[#7B2CBF] bg-transparent'}`,
    ghost: `${isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-[#6b46a0] hover:text-[#1a0033] hover:bg-purple-100'}`,
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-5 py-2.5 text-base gap-2",
    lg: "px-7 py-3.5 text-lg gap-2.5",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

// --- Card ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action }) => {
  const { isDark } = useTheme();
  return (
    <div className={`glass-card rounded-xl p-6 transition-all duration-200 ${isDark ? 'text-white' : 'text-[#1a0033]'} ${className}`}>
      {(title || action) && (
        <div className="flex justify-between items-center mb-4">
          {title && <h3 className="text-xl font-semibold">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  endIcon?: LucideIcon;
  onEndIconClick?: () => void;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', icon: Icon, endIcon: EndIcon, onEndIconClick, ...props }) => {
  const { isDark } = useTheme();
  return (
    <div className="w-full">
      {label && <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-neutral-400' : 'text-[#6b46a0]'}`}>{label}</label>}
      <div className="relative">
        {Icon && (
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-neutral-500' : 'text-purple-400'}`}>
            <Icon size={18} />
          </div>
        )}
        <input
          className={`w-full rounded-lg py-2.5 transition-all duration-200 outline-none border
            ${isDark
              ? 'bg-black/50 border-neutral-800 text-white placeholder-neutral-600 focus:border-[#7B2CBF] focus:ring-1 focus:ring-[#7B2CBF] focus:bg-black/70'
              : 'bg-white border-purple-200 text-[#1a0033] placeholder-purple-300 focus:border-[#7B2CBF] focus:ring-1 focus:ring-[#7B2CBF]'}
            ${error ? 'border-red-500' : ''}
            ${Icon ? 'pl-10' : 'px-4'} ${EndIcon ? 'pr-10' : 'px-4'}
            [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_transparent_inset]
            ${className}`}
          {...props}
        />
        {EndIcon && (
          <button
            type="button"
            onClick={onEndIconClick}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${onEndIconClick ? 'cursor-pointer' : 'pointer-events-none'} ${isDark ? 'text-neutral-500 hover:text-white' : 'text-purple-400 hover:text-[#7B2CBF]'}`}
          >
            <EndIcon size={18} />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};

// --- Badge ---
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral' }) => {
  const styles = {
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    neutral: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}>
      {children}
    </span>
  );
};

// --- Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const { isDark } = useTheme();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className={`relative rounded-2xl w-full max-w-2xl shadow-2xl shadow-purple-900/30 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] border
        ${isDark ? 'bg-[#0D0117] border-purple-900/40' : 'bg-white border-purple-200'}`}>
        {/* Gradient header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#7B2CBF]/20 bg-gradient-to-r from-[#7B2CBF]/10 to-transparent rounded-t-2xl flex-shrink-0">
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#1a0033]'}`}>{title}</h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-[#6b46a0] hover:text-[#1a0033] hover:bg-purple-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
