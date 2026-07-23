import { getPanelUser } from '@/lib/auth';
import PanelShell from '@/components/panel/PanelShell';

// Todo el panel es privado: getPanelUser exige sesión (si no, redirige a /login)
// y trae nombre/rol/iniciales reales cuando ya existe la tabla profiles.
export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }) {
  const user = await getPanelUser();

  return <PanelShell user={user}>{children}</PanelShell>;
}
