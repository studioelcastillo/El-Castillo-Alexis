import { ActionButton, Field, InlineMessage, StatusBadge, TextInput } from '@studiocore/ui';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, KeyRound, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { healthRequest, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@studiocore.local');
  const [password, setPassword] = useState('Admin123*');
  const [branchId, setBranchId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const healthQuery = useQuery({
    queryKey: ['public-health'],
    queryFn: healthRequest,
  });

  const from = typeof location.state?.from === 'string' ? location.state.from : '/dashboard';

  return (
    <div className="login-shell">
      <section className="hero-panel panel fade-up">
        <span className="eyebrow">StudioCore ERP</span>
        <h1>Nuevo cockpit multiempresa listo para validar auth, tenant y gobierno base.</h1>
        <p>
          Este shell ya consume el backend nuevo de fase 0: login real, sesion JWT, permisos, empresas,
          sedes, usuarios, roles y auditoria.
        </p>

        <div className="hero-points">
          <article className="feature-chip">
            <ShieldCheck size={18} />
            <div>
              <strong>Auth operativo</strong>
              <span>Usa `/auth/login`, refresco de token y `/auth/me`.</span>
            </div>
          </article>
          <article className="feature-chip">
            <Building2 size={18} />
            <div>
              <strong>Tenant real</strong>
              <span>Expone empresa activa, sede activa y alcance por permisos.</span>
            </div>
          </article>
          <article className="feature-chip">
            <KeyRound size={18} />
            <div>
              <strong>Seed demo local</strong>
              <span>La base local crea un admin y un auditor para probar la shell.</span>
            </div>
          </article>
        </div>

        <div className="hero-status card-outline">
          <span className="mini-label">Estado del API</span>
          {healthQuery.isSuccess ? (
            <div className="status-line">
              <StatusBadge value={healthQuery.data.status} />
              <span>{healthQuery.data.service}</span>
            </div>
          ) : healthQuery.isError ? (
            <div className="status-line">
              <StatusBadge value="offline" />
              <span>No se detecta el backend en `VITE_API_BASE_URL`.</span>
            </div>
          ) : (
            <div className="status-line">
              <StatusBadge value="checking" />
              <span>Verificando conectividad...</span>
            </div>
          )}
        </div>
      </section>

      <section className="login-panel panel fade-up">
        <span className="eyebrow">Ingreso</span>
        <h2>Inicia sesion en el shell base</h2>
        <p>Si estas usando la seed demo local, puedes entrar con el admin inicial ya cargado.</p>

        <form
          className="form-grid"
          onSubmit={async (event) => {
            event.preventDefault();
            setErrorMessage(null);
            setIsSubmitting(true);

            try {
              await login(email.trim(), password, branchId ? Number(branchId) : undefined);
              navigate(from, { replace: true });
            } catch (error) {
              setErrorMessage(
                error instanceof ApiError ? error.message : 'No fue posible iniciar sesion en este momento.',
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <Field label="Email" htmlFor="login-email">
            <TextInput id="login-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </Field>

          <Field label="Contrasena" htmlFor="login-password">
            <TextInput
              id="login-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
            />
          </Field>

          <Field label="Sede activa opcional" htmlFor="login-branch-id">
            <TextInput
              id="login-branch-id"
              value={branchId}
              onChange={(event) => setBranchId(event.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
              placeholder="Ej. 2"
            />
          </Field>

          {errorMessage ? <InlineMessage tone="error">{errorMessage}</InlineMessage> : null}

          <ActionButton type="submit" fullWidth disabled={isSubmitting}>
            <ArrowRight size={16} />
            {isSubmitting ? 'Validando sesion...' : 'Entrar al cockpit'}
          </ActionButton>
        </form>

        <div className="login-notes card-outline">
          <span className="mini-label">Arranque local recomendado</span>
          <code>docker compose up -d && npm run db:migrate --workspace @studiocore/api && npm run db:seed --workspace @studiocore/api</code>
        </div>
      </section>
    </div>
  );
}
