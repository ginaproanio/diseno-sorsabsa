import { useState } from 'react';
import { BRANDS, BrandProvider, Wordmark, Card, Button, StatusBadge, Icon, Input } from '../lib';

function DomusNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-brand-border/60 bg-brand-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Wordmark className="text-xl font-bold" />
        <nav className="hidden items-center gap-6 text-sm font-medium text-brand-muted md:flex">
          <a href="#features" className="transition-colors hover:text-brand-text">Features</a>
          <a href="#social" className="transition-colors hover:text-brand-text">Social proof</a>
          <a href="#cta" className="transition-colors hover:text-brand-text">Planes</a>
        </nav>
        <Button size="sm" href="#cta">Empezar</Button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-brand-border/60 bg-brand-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-3xl">
          <StatusBadge tone="info" size="sm" className="mb-4">
            Gestión inmobiliaria para equipos modernos
          </StatusBadge>
          <h1 className="font-brand-heading text-4xl font-bold tracking-tight text-brand-text sm:text-5xl">
            Administra propiedades sin fricción
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-muted sm:text-lg">
            DomusCRM centraliza cartera, contratos, pagos y comunicación con propietarios
            en un solo panel. Menos ruido, más cierres.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" href="#cta">Crear cuenta gratis</Button>
            <Button size="lg" variant="secondary" href="#features">Ver cómo funciona</Button>
          </div>
          <p className="mt-3 text-xs text-brand-muted">
            Alta en 2 minutos · Sin tarjeta · Soporte en español
          </p>
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          background:
            'radial-gradient(600px 400px at 80% -10%, var(--brand-secondary), transparent), radial-gradient(600px 400px at 20% 110%, var(--brand-secondary), transparent)',
        }}
      />
    </section>
  );
}

const FEATURES = [
  {
    icon: 'building-2' as IconName,
    title: 'Cartera unificada',
    body: 'Unidades, inquilinos y propietarios con historial completo en un solo lugar.',
  },
  {
    icon: 'receipt' as IconName,
    title: 'Pagos y gastos',
    body: 'Conciliación automática, recordatorios y reportes listos para contabilidad.',
  },
  {
    icon: 'message-square' as IconName,
    title: 'Comunicación',
    body: 'Avisos masivos, plantillas y bandeja de mensajes por propiedad.',
  },
] as const;

function Features() {
  return (
    <section id="features" className="border-b border-brand-border/60 bg-brand-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-brand-heading text-3xl font-bold tracking-tight text-brand-text">
            Hecho para operar, no para configurar
          </h2>
          <p className="mt-3 text-brand-muted">
            Flujos pensados para administradores y corredurías, con defaults que se adaptan a mercados
            residenciales y comerciales.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} interactive className="h-full">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-brand bg-brand-primary/10 p-2 text-brand-primary">
                  <Icon name={feature.icon} size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-brand-text">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-brand-muted">{feature.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const SOCIAL = [
  { value: '2.4k', label: 'Gestores activos' },
  { value: '18k', label: 'Propiedades administradas' },
  { value: '99.9%', label: 'Uptime en 12 meses' },
] as const;

function SocialProof() {
  return (
    <section id="social" className="border-b border-brand-border/60 bg-brand-background">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {SOCIAL.map((item) => (
            <Card key={item.label} className="text-center">
              <p className="font-brand-heading text-3xl font-bold text-brand-primary">{item.value}</p>
              <p className="mt-1 text-sm text-brand-muted">{item.label}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="cta" className="border-b border-brand-border/60 bg-brand-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Card className="overflow-hidden">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h2 className="font-brand-heading text-3xl font-bold tracking-tight text-brand-text">
                Empezá a administrar mejor hoy
              </h2>
              <p className="mt-3 text-brand-muted">
                Migración asistida de tu cartera actual, plantillas de contratos y soporte dedicado
                en el plan inicial.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button size="lg">Hablar con ventas</Button>
                <Button size="lg" variant="secondary">Ver planes</Button>
              </div>
              <p className="mt-3 text-xs text-brand-muted">
                Soporte por email y chat · Onboarding en 24h
              </p>
            </div>
            <form
              className="rounded-brand border border-brand-border bg-brand-background p-5"
              onSubmit={(e) => e.preventDefault()}
            >
              <label className="block text-sm font-medium text-brand-text">Correo corporativo</label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  type="email"
                  placeholder="nombre@inmobiliaria.com"
                  className="flex-1"
                />
                <Button type="submit">Enviar</Button>
              </div>
              <p className="mt-2 text-xs text-brand-muted">
                No compartimos tu correo. Podés solicitar la baja cuando quieras.
              </p>
            </form>
          </div>
        </Card>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-brand-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Wordmark className="text-sm font-semibold" />
          <p className="text-xs text-brand-muted">
            © {new Date().getFullYear()} DomusCRM. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function DomusLanding() {
  return (
    <BrandProvider brand={BRANDS.domuscrm}>
      <DomusNav />
      <main>
        <Hero />
        <Features />
        <SocialProof />
        <CTA />
      </main>
      <Footer />
    </BrandProvider>
  );
}


