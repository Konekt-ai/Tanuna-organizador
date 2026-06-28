import './globals.css';
import { Fraunces, Manrope } from 'next/font/google';

// Mismas tipografías que el Organizador: Fraunces (títulos) + Manrope (texto).
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata = {
  title: 'Taluna · Organizador',
  description:
    'Organiza el catálogo de Taluna (bolsas, straps, cinturones y combinaciones) y sube fotos desde el celular. Todo se guarda en la nube.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FAF7F2',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
