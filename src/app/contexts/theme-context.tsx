import { createContext, useContext, useEffect, useState, ReactNode, Fragment, createElement } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Create a default context value to handle edge cases during hot reload
const defaultThemeContext: ThemeContextType = {
  theme: "dark",
  setTheme: () => {
    console.warn("setTheme called outside ThemeProvider - using default");
  },
  toggleTheme: () => {
    console.warn("toggleTheme called outside ThemeProvider - using default");
  },
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

// Innermost component with strict typing - ONLY accepts children
function ThemeContextCore({ children }: { children: ReactNode }) {
  // Default to dark mode, read from localStorage if available
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove both classes first
    root.classList.remove("light", "dark");
    
    // Add the appropriate class
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return createElement(ThemeContext.Provider, { value: { theme, setTheme, toggleTheme } }, children);
}

// Barrier component using createElement to prevent prop inheritance
function ThemeContextBarrier(props: any) {
  const { children } = props;
  return createElement(Fragment, null, createElement(ThemeContextCore, { children }));
}

// Internal component that strips all props except children
function ThemeProviderInternal(props: any) {
  const { children } = props;
  return createElement(ThemeContextBarrier, { children });
}

export function ThemeProvider(props: any) {
  const { children } = props;
  return createElement(ThemeProviderInternal, { children });
}

export function useTheme() {
  const context = useContext(ThemeContext);
  // Context now always has a value (either real or default), so just return it
  return context;
}