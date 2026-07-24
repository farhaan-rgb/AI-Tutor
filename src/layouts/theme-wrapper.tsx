import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "../app/theme";
import { ReactNode, Fragment, createElement } from "react";
import { ThemeProvider } from "../app/contexts/theme-context";

// Innermost layer - strict typing, only accepts children
function MuiProviderCore({ children }: { children: ReactNode }) {
  return createElement(MuiThemeProvider, { theme }, children);
}

// Middle barrier - creates new element without inheriting props
function MuiProviderBarrier(props: any) {
  const { children } = props;
  // Use Fragment to break prop inheritance chain
  return createElement(Fragment, null, createElement(MuiProviderCore, { children }));
}

// Outer wrapper for MUI
function FilteredMuiProvider(props: any) {
  const { children } = props;
  return createElement(MuiProviderBarrier, { children });
}

/**
 * Isolated ThemeProvider wrapper that filters out Figma data attributes
 * This prevents Figma-specific data attributes from reaching MUI components
 * Also provides theme context for dark/light mode
 */
export function ThemeWrapper(props: any) {
  const { children } = props;
  return createElement(
    ThemeProvider,
    { children: createElement(Fragment, null, 
      createElement(FilteredMuiProvider, { children: createElement(Fragment, null,
        createElement(CssBaseline, null),
        children
      )})
    )}
  );
}