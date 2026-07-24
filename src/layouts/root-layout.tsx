import { Outlet } from "react-router";
import { ThemeWrapper } from "./theme-wrapper";
import { CardMorphProvider } from "../screens/marketplace-card-morph";

// Regular function component - React Router compatible
export function RootLayout() {
  return (
    <ThemeWrapper>
      <CardMorphProvider>
        <Outlet />
      </CardMorphProvider>
    </ThemeWrapper>
  );
}
