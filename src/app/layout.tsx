import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Zilla_Slab } from "next/font/google";
import "./globals.css";

const zillaSlab = Zilla_Slab({
  variable: "--font-zilla-slab",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "tradefinder",
  description: "Find a tradesperson — we call around for you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${zillaSlab.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
