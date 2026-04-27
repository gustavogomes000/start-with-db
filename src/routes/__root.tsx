import { Outlet, Link, createRootRoute, HeadContent, Scripts, useNavigate } from "@tanstack/react-router";
import { Toaster, toast } from "sonner";
import { useEffect, useState } from "react";

import appCss from "../styles.css?url";

const RECOVERY_QUERY_PARAM = "__hard_refresh";
const KNOWN_APP_ROUTES = new Set(["/", "/login", "/admin", "/meu-painel"]);

function buildRecoveryUrl(targetPath?: string) {
  const currentUrl = new URL(window.location.href);
  const safePath = targetPath ?? (KNOWN_APP_ROUTES.has(currentUrl.pathname) ? currentUrl.pathname : "/");
  const recoveryUrl = new URL(safePath, window.location.origin);

  currentUrl.searchParams.forEach((value, key) => {
    if (key !== RECOVERY_QUERY_PARAM) recoveryUrl.searchParams.set(key, value);
  });
  recoveryUrl.searchParams.set(RECOVERY_QUERY_PARAM, Date.now().toString());

  return recoveryUrl.toString();
}

async function forceFreshLoad(options: { force?: boolean; targetPath?: string; userInitiated?: boolean } = {}) {
  if (typeof window === "undefined") return false;

  const currentUrl = new URL(window.location.href);
  if (currentUrl.searchParams.has(RECOVERY_QUERY_PARAM) && !options.userInitiated) return false;

  if (options.userInitiated) {
    toast.info("Validando sistema e limpando cache...", { duration: 3000 });
  }

  const registrations =
    "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistrations().catch(() => []) : [];
  const cacheNames = "caches" in window ? await window.caches.keys().catch(() => []) : [];
  const isControlledByServiceWorker = "serviceWorker" in navigator && Boolean(navigator.serviceWorker.controller);
  const shouldRecover = options.force || isControlledByServiceWorker || registrations.length > 0 || cacheNames.length > 0;

  if (!shouldRecover) return false;

  await Promise.allSettled(registrations.map((registration) => registration.unregister()));
  if ("caches" in window) {
    await Promise.allSettled(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
  }

  window.location.replace(buildRecoveryUrl(options.targetPath));
  return true;
}

function NotFoundComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    forceFreshLoad({ force: true, targetPath: "/" }).then((reloading) => {
      if (!reloading) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Estamos validando que está tudo certo. Se a página não carregar sozinha, toque no botão abaixo.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => forceFreshLoad({ force: true, targetPath: "/", userInitiated: true })}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Validar e carregar agora
          </button>
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
    
    // Mostra feedback se acabamos de recuperar de um erro
    const url = new URL(window.location.href);
    if (url.searchParams.has(RECOVERY_QUERY_PARAM)) {
      toast.success("Sistema validado. Está tudo certo agora!", {
        duration: 5000,
      });
    }

    forceFreshLoad();
  }, []);
  return (
    <>
      <Outlet />
      {mounted && <Toaster position="top-center" richColors closeButton />}
    </>
  );
}
