'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, Button, ButtonLink } from '@/components/ui/Button';
import { Checkbox, FormError, TextField } from '@/components/ui/Field';
import { DemoCredentials } from '@/components/booking/steps/CheckoutSteps';
import { asset, STUDIO } from '@/lib/config';
import { useAction, useCurrentUser, useMounted } from '@/lib/hooks/useDatabase';
import { db } from '@/lib/store/database';
import { ACCOUNT_HREF, ADMIN_HREF, BOOKING_HREF } from '@/lib/nav';

/**
 * Écran de connexion / création de compte hors tunnel de réservation.
 * Après authentification, redirige vers l'espace correspondant au rôle.
 */
export function AuthPanel() {
  const router = useRouter();
  const user = useCurrentUser();
  const mounted = useMounted();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    if (user) router.replace(user.role === 'client' ? ACCOUNT_HREF : ADMIN_HREF);
  }, [user, router]);

  if (!mounted) {
    return <div className="mx-auto h-96 max-w-xl animate-pulse rounded-[1.75rem] bg-anthracite/6" aria-hidden="true" />;
  }

  if (user) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
        <p className="text-anthracite/70">Vous êtes connecté. Redirection en cours…</p>
        <ButtonLink href={user.role === 'client' ? ACCOUNT_HREF : ADMIN_HREF} size="md">
          Continuer <ArrowRight />
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl items-center gap-[var(--spacing-fluid-4)] lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <img
          src={asset('/brand/mascotte-walk-dark.webp')}
          alt=""
          width={760}
          height={837}
          className="u-float h-32 w-auto self-start opacity-90 sm:h-40"
        />
        <h1 className="text-[length:var(--text-5xl)]">
          {mode === 'signin' ? 'Content de vous revoir.' : 'Bienvenue au studio.'}
        </h1>
        <p className="max-w-[46ch] text-[length:var(--text-lg)] leading-relaxed text-anthracite/70">
          Votre espace vous sert à une chose&nbsp;: gérer vos séances sans avoir à appeler. Réserver, reporter,
          annuler, retrouver vos anciennes séances.
        </p>
        <p className="font-hand text-2xl text-anthracite/55">{STUDIO.slogan}</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-1.5 rounded-full bg-anthracite/6 p-1.5">
          {(
            [
              { id: 'signin', label: 'Se connecter' },
              { id: 'signup', label: 'Créer un compte' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              aria-pressed={mode === tab.id}
              className={[
                'min-h-11 flex-1 rounded-full px-4 text-[length:var(--text-sm)] font-semibold transition-colors duration-300',
                mode === tab.id ? 'bg-anthracite text-creme' : 'text-anthracite/60 hover:text-anthracite',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mode === 'signin' ? <SignIn /> : <SignUp />}

        <p className="text-center text-[length:var(--text-sm)] text-anthracite/60">
          Vous vouliez simplement réserver&nbsp;?{' '}
          <Link href={BOOKING_HREF} className="font-semibold text-orange underline-offset-4 hover:underline">
            Aller au tunnel de réservation
          </Link>
        </p>
      </div>
    </div>
  );
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { run, pending, error } = useAction((e: string, p: string) => db.signIn(e, p));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void run(email, password);
      }}
      className="u-card flex flex-col gap-4 p-6"
    >
      {error && <FormError>{error}</FormError>}
      <TextField
        id="login-email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        id="login-password"
        label="Mot de passe"
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" size="md" block disabled={pending}>
        {pending ? 'Connexion…' : 'Se connecter'}
      </Button>
      <p className="text-[length:var(--text-2xs)] text-anthracite/45">
        Mot de passe oublié&nbsp;? Appelez le studio au {STUDIO.phone}&nbsp;: la réinitialisation par email sera
        disponible à la mise en production.
      </p>
      <DemoCredentials />
    </form>
  );
}

function SignUp() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    marketingOptIn: false,
  });
  const [touched, setTouched] = useState(false);
  const { run, pending, error } = useAction(db.signUp.bind(db));
  const tooShort = form.password.length > 0 && form.password.length < 8;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setTouched(true);
        if (form.password.length < 8) return;
        void run(form);
      }}
      className="u-card flex flex-col gap-4 p-6"
    >
      {error && <FormError>{error}</FormError>}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="reg-firstname"
          label="Prénom"
          required
          autoComplete="given-name"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
        <TextField
          id="reg-lastname"
          label="Nom"
          required
          autoComplete="family-name"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
      </div>
      <TextField
        id="reg-email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <TextField
        id="reg-phone"
        label="Téléphone"
        hint="facultatif"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <TextField
        id="reg-password"
        label="Mot de passe"
        hint="8 caractères minimum"
        type="password"
        required
        autoComplete="new-password"
        error={touched && tooShort ? 'Le mot de passe doit faire au moins 8 caractères.' : undefined}
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <Checkbox
        id="reg-optin"
        checked={form.marketingOptIn}
        onChange={(e) => setForm({ ...form, marketingOptIn: e.target.checked })}
      >
        Je veux recevoir les actualités du studio. Facultatif, désinscription en un clic.
      </Checkbox>
      <Button type="submit" size="md" block disabled={pending}>
        {pending ? 'Création…' : 'Créer mon compte'}
      </Button>
      <p className="text-[length:var(--text-2xs)] leading-relaxed text-anthracite/45">
        En créant un compte, vous acceptez les{' '}
        <Link href="/cgv/" className="text-orange underline-offset-4 hover:underline">
          CGV
        </Link>{' '}
        et la{' '}
        <Link href="/confidentialite/" className="text-orange underline-offset-4 hover:underline">
          politique de confidentialité
        </Link>
        .
      </p>
    </form>
  );
}
