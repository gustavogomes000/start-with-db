import { Outlet, Link, createRootRoute, HeadContent, Scripts, useNavigate } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/", replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Toque no botão abaixo para voltar para a entrevista.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Abrir entrevista
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" },
      { title: "Voz das Mulheres - Dra. Fernanda Sarelli" },
      { name: "description", content: "Sistema de Pesquisa Voz das Mulheres" },
      { name: "theme-color", content: "#e91e63" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "VozMulheres" },
      { property: "og:title", content: "Voz das Mulheres - Dra. Fernanda Sarelli" },
      { name: "twitter:title", content: "Voz das Mulheres - Dra. Fernanda Sarelli" },
      { property: "og:description", content: "Sistema de Pesquisa Voz das Mulheres" },
      { name: "twitter:description", content: "Sistema de Pesquisa Voz das Mulheres" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1ec5d831-7c69-4378-b83a-05172a642d30/id-preview-f27c1a7b--9277d964-d934-436b-8f1a-01d0b38e3290.lovable.app-1777259195238.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1ec5d831-7c69-4378-b83a-05172a642d30/id-preview-f27c1a7b--9277d964-d934-436b-8f1a-01d0b38e3290.lovable.app-1777259195238.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icons/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icons/icon-512.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);

    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => registrations.forEach((registration) => registration.unregister()))
      .catch(() => {
        // Ignore browsers that block service worker access in private mode.
      });
  }, []);
  return (
    <>
      <Outlet />
      {mounted && <Toaster position="top-center" richColors closeButton />}
    </>
  );
}
