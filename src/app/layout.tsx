import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { WorkspaceGuard } from "@/components/workspace-guard";
import { Toaster } from "@/components/ui/sonner";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  weight: "variable",
  subsets: ["latin"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MediaForge | Local media workbench",
  description: "Convert, resize, compress, extract, edit, and organize image, video, audio, PDF, QR, and favicon files locally in your browser where supported.",
  manifest: "/site.webmanifest",
  applicationName: "MediaForge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${instrumentSans.variable} ${barlowCondensed.variable} ${plexMono.variable} h-full`}
    >
      <body className="relative flex min-h-full flex-col antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <a href="#main-content" className="mf-skip-link">Skip to workbench</a>
          <Navbar />
          <WorkspaceGuard />
          {process.env.NEXT_PUBLIC_MEDIAFORGE_ANDROID === "1" && (
            <aside className="border-b border-border bg-card px-4 py-3 text-center text-xs leading-5 text-muted-foreground" aria-label="Android preview information">
              Android preview · Save opens your phone’s file picker · Exports up to 256 MB · Keep your originals
              <a href="/licenses/THIRD_PARTY_LICENSES.txt" className="ml-2 text-primary underline underline-offset-4">Open-source notices</a>
            </aside>
          )}
          <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col relative">
            {children}
          </main>
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
