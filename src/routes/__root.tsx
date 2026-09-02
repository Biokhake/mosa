import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME =
  "MOSA: Modular Omni-Support Automata / Mimetic Operating System Architecture";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { property: "og:title", content: APP_NAME },
      { name: "theme-color", content: "#f4f1ea" },
      { name: "description", content: "Modular Omni-Support Automata / Mimetic Operating System Architecture — humanoid mix-build hangar." },
      { property: "og:description", content: "Modular Omni-Support Automata / Mimetic Operating System Architecture — humanoid mix-build hangar." },
    ],
    links: [
      { rel: "icon", href: "data:," },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" className="theme-light" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="overflow-hidden bg-bg text-fg antialiased">
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
