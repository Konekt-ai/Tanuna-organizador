import { requireUser } from '@/lib/auth';
import { signOut } from './actions';
import TalunaGlyph from '@/components/TalunaGlyph';

// Panel de inicio del Organizador. Requiere sesión: si no hay, requireUser
// redirige a /login. Desde aquí se abre el Organizador (/estudio.html).
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await requireUser();

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-white to-bg-soft flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        {/* Marca */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <span className="text-burg">
            <TalunaGlyph size={30} />
          </span>
          <div className="leading-none">
            <b className="font-fraunces text-xl font-medium tracking-wide text-charcoal">
              Taluna
            </b>
            <small className="block font-manrope font-semibold text-[0.62rem] tracking-[0.22em] uppercase text-camel-d mt-1">
              Organizador
            </small>
          </div>
        </div>

        {/* Tarjeta principal */}
        <div className="bg-white border border-[rgba(42,38,34,.12)] rounded-[26px] shadow-taluna p-7 sm:p-8 text-center">
          <span className="inline-flex items-center gap-2 text-[0.66rem] font-bold tracking-[0.2em] uppercase text-camel-d">
            <span className="text-camel">
              <TalunaGlyph size={14} />
            </span>
            Tu espacio de trabajo
          </span>

          <h1 className="font-fraunces text-[1.9rem] leading-[1.05] text-charcoal mt-3 mb-2">
            Vamos a ordenar
            <br />
            <em className="italic text-burg">tu catálogo</em>
          </h1>

          <p className="text-muted text-[0.95rem] mb-1">
            Sesión iniciada como
          </p>
          <p className="font-semibold text-ink mb-6 break-words">{user.email}</p>

          <a
            href="/estudio.html"
            className="flex items-center justify-center gap-2 w-full font-bold text-[0.95rem] rounded-full px-5 py-3.5 bg-charcoal text-white border border-charcoal transition hover:bg-[#1e1b17]"
          >
            <TalunaGlyph size={16} />
            Abrir el Organizador
          </a>

          <p className="text-muted text-[0.8rem] mt-4 flex items-center justify-center gap-2">
            <span className="inline-block w-[7px] h-[7px] rounded-full bg-good" />
            Todo se guarda solo en la nube
          </p>
        </div>

        {/* Cerrar sesión */}
        <form action={signOut} className="mt-5 text-center">
          <button
            type="submit"
            className="font-bold text-[0.85rem] rounded-full px-4 py-2.5 border-[1.4px] border-[rgba(42,38,34,.12)] bg-white text-ink-2 transition hover:border-charcoal"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
