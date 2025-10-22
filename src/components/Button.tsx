import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  className = '',
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 dark:bg-blue-700';
      case 'secondary':
        return 'bg-gray-600 dark:bg-gray-700';
      case 'outline':
        return 'border border-gray-300 dark:border-gray-600 bg-transparent';
      default:
        return 'bg-blue-600 dark:bg-blue-700';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'py-2 px-4';
      case 'medium':
        return 'py-3 px-6';
      case 'large':
        return 'py-4 px-8';
      default:
        return 'py-3 px-6';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline':
        return 'text-gray-700 dark:text-gray-300';
      default:
        return 'text-white';
    }
  };

  return (
    <TouchableOpacity
      className={`rounded-lg ${getVariantClasses()} ${getSizeClasses()} ${className}`}
      {...props}
    >
      <Text className={`text-center font-medium ${getTextColor()}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default Button;

