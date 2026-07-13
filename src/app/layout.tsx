import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
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
          <Navbar />
          <main className="flex-1 flex flex-col relative">
            {children}
          </main>
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
