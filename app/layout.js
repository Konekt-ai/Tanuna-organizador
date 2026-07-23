import './globals.css';
import { Instrument_Serif, Inter } from 'next/font/google';
import ThemeProvider from '@/components/theme-provider';

// Tipografías del panel: Instrument Serif (títulos/marca) + Inter (cuerpo/UI),
// las mismas del diseño de la fachada.
const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Taluna · Panel',
  description:
    'Panel administrativo de Taluna MX: pedidos, clientas, catálogo, inventario y reportes. Todo en la nube.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F7F1E7',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${serif.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
