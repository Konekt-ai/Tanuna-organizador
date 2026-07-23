'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';

// Proveedor de tema claro/oscuro (estrategia de clase .dark en <html>).
// Envuelve la app para que el toggle de Apariencia funcione y respete la
// preferencia del sistema por defecto.
export default function ThemeProvider({ children }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
