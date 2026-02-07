import "./globals.css";
import { Providers } from "./providers"; // Importe o componente que criamos
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

// É aqui que se configura o SEO e a verificação do Google no Next.js novo
export const metadata = {
  title: "Nosso Local",
  description: "Shopping virtual para o comércio local",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nosso Local",
  },
  verification: {
    google: "D1VrU2-MBaQS5OfUt2DAcErgME0Ht0Tord2YhSdSrYo",
  },
};

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
        <link
          rel="icon"
          type="image/png"
          sizes="96x96"
          href="/favicon/favicon-96x96.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nosso Local" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ServiceWorkerRegistration />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
