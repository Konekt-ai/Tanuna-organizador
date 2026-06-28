'use client';
import { useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/browser';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setError(
          error.message?.toLowerCase().includes('invalid')
            ? 'Correo o contraseña incorrectos.'
            : 'No se pudo iniciar sesión. Inténtalo de nuevo.'
        );
        setLoading(false);
        return;
      }
      // Sesión lista (cookies puestas): recarga completa para que el
      // middleware reconozca la sesión y entre al panel.
      window.location.assign('/');
    } catch (err) {
      setError('No se pudo conectar. Revisa tu internet.');
      setLoading(false);
    }
  }

  const inputCls =
    'w-full border-[1.4px] border-[rgba(42,38,34,.12)] rounded-[11px] bg-white px-3.5 py-2.5 text-[0.95rem] text-ink outline-none transition focus:border-camel focus:ring-[3px] focus:ring-camel-bg placeholder:text-faint';

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[0.74rem] font-bold text-ink-2">
          Correo
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@ejemplo.com"
          className={inputCls}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-[0.74rem] font-bold text-ink-2">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className={inputCls}
        />
      </div>

      {error && (
        <p className="text-[0.82rem] font-semibold text-bad bg-[#F6E4E6] rounded-[11px] px-3.5 py-2.5">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex items-center justify-center gap-2 w-full font-bold text-[0.95rem] rounded-full px-5 py-3 bg-charcoal text-white border border-charcoal transition hover:bg-[#1e1b17] disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
