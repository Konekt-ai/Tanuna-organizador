import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import TalunaGlyph from '@/components/TalunaGlyph';
import LoginForm from './login-form';

// Pantalla de inicio de sesión. Si ya hay sesión, va directo al panel.
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect('/');

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-white to-bg-soft flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-[380px]">
        {/* Marca */}
        <div className="flex flex-col items-center gap-3 mb-7 text-center">
          <span className="text-burg">
            <TalunaGlyph size={40} />
          </span>
          <div className="leading-none">
            <b className="font-fraunces text-2xl font-medium tracking-wide text-charcoal">
              Taluna
            </b>
            <small className="block font-manrope font-semibold text-[0.62rem] tracking-[0.22em] uppercase text-camel-d mt-1.5">
              Organizador
            </small>
          </div>
        </div>

        {/* Tarjeta de login */}
        <div className="bg-white border border-[rgba(42,38,34,.12)] rounded-[26px] shadow-taluna p-7">
          <h1 className="font-fraunces text-[1.5rem] leading-tight text-charcoal mb-1">
            Inicia sesión
          </h1>
          <p className="text-muted text-[0.9rem] mb-6">
            Entra con tu cuenta para organizar el catálogo y que todo se guarde
            en la nube.
          </p>

          <LoginForm />
        </div>

        <p className="text-faint text-[0.74rem] text-center mt-5">
          Acceso solo para el equipo de Taluna.
        </p>
      </div>
    </main>
  );
}
