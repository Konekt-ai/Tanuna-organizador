import {
  Home,
  ShoppingBag,
  Users,
  MessageCircle,
  Package,
  Tags,
  Layers,
  Boxes,
  BarChart3,
  Settings,
} from 'lucide-react';

// Estructura del menú lateral del panel, agrupada igual que el diseño.
export const NAV_GROUPS = [
  {
    group: null,
    items: [{ label: 'Inicio', href: '/', icon: Home }],
  },
  {
    group: 'Ventas',
    items: [
      { label: 'Pedidos', href: '/pedidos', icon: ShoppingBag },
      { label: 'Clientas', href: '/clientas', icon: Users },
      { label: 'WhatsApp', href: '/whatsapp', icon: MessageCircle },
    ],
  },
  {
    group: 'Catálogo',
    items: [
      { label: 'Productos', href: '/productos', icon: Package },
      { label: 'Categorías', href: '/categorias', icon: Tags },
      { label: 'Arma tu Taluna', href: '/combinaciones', icon: Layers },
      { label: 'Inventario', href: '/inventario', icon: Boxes },
    ],
  },
  {
    group: 'Resultados',
    items: [{ label: 'Reportes', href: '/reportes', icon: BarChart3 }],
  },
  {
    group: 'Sistema',
    items: [{ label: 'Configuración', href: '/configuracion', icon: Settings }],
  },
];
