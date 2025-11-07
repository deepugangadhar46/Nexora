import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type MVPTheme = 'modern' | 'minimal' | 'vibrant';

interface ThemeSwitcherProps {
  currentTheme: MVPTheme;
  onThemeChange: (theme: MVPTheme) => void;
  className?: string;
}

const themes = [
  {
    id: 'modern' as MVPTheme,
    name: 'Modern',
    description: 'Sleek gradients and shadows',
    preview: 'bg-gradient-to-br from-blue-500 to-purple-600',
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#ec4899',
    },
  },
  {
    id: 'minimal' as MVPTheme,
    name: 'Minimal',
    description: 'Clean and professional',
    preview: 'bg-gradient-to-br from-gray-700 to-gray-900',
    colors: {
      primary: '#1f2937',
      secondary: '#4b5563',
      accent: '#f59e0b',
    },
  },
  {
    id: 'vibrant' as MVPTheme,
    name: 'Vibrant',
    description: 'Bold and energetic',
    preview: 'bg-gradient-to-br from-orange-500 to-pink-500',
    colors: {
      primary: '#f97316',
      secondary: '#ec4899',
      accent: '#8b5cf6',
    },
  },
];

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  currentTheme,
  onThemeChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all"
        title="Change theme"
      >
        <Palette className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Theme: {themes.find(t => t.id === currentTheme)?.name}
        </span>
      </motion.button>

      {/* Theme Selector Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 p-4"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Choose MVP Theme
              </h3>

              <div className="space-y-2">
                {themes.map((theme) => (
                  <motion.button
                    key={theme.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onThemeChange(theme.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full p-3 rounded-lg border-2 transition-all text-left',
                      currentTheme === theme.id
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Preview */}
                      <div
                        className={cn(
                          'w-12 h-12 rounded-lg flex-shrink-0',
                          theme.preview
                        )}
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {theme.name}
                          </h4>
                          {currentTheme === theme.id && (
                            <Check className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {theme.description}
                        </p>

                        {/* Color Swatches */}
                        <div className="flex items-center space-x-1 mt-2">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: theme.colors.primary }}
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: theme.colors.secondary }}
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: theme.colors.accent }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  💡 The theme will be applied to your generated MVP code
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeSwitcher;

// Theme CSS generator
export const generateThemeCSS = (theme: MVPTheme): string => {
  const themeConfig = themes.find(t => t.id === theme);
  if (!themeConfig) return '';

  return `
/* ${themeConfig.name} Theme */
:root {
  --color-primary: ${themeConfig.colors.primary};
  --color-secondary: ${themeConfig.colors.secondary};
  --color-accent: ${themeConfig.colors.accent};
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-secondary {
  background: var(--color-secondary);
  color: white;
}

.text-primary {
  color: var(--color-primary);
}

.bg-primary {
  background: var(--color-primary);
}

.border-primary {
  border-color: var(--color-primary);
}
`.trim();
};
