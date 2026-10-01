import type { Metadata } from "next";
import {
  Caveat,
  Inter,
  Lato,
  Merriweather,
  Montserrat,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Roboto,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/Toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });
const roboto = Roboto({ subsets: ["latin"], variable: "--font-roboto", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });
const lato = Lato({ subsets: ["latin"], weight: ["300", "400", "700"], variable: "--font-lato", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const merriweather = Merriweather({ subsets: ["latin"], variable: "--font-merriweather", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Fiagmazation — Design Together, Create More", template: "%s · Fiagmazation" },
  description:
    "Fiagmazation is a modern collaborative design tool that brings your ideas to life. Work together in real-time, anywhere, anytime.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={[
        inter.variable,
        jakarta.variable,
        caveat.variable,
        roboto.variable,
        montserrat.variable,
        lato.variable,
        playfair.variable,
        spaceGrotesk.variable,
        merriweather.variable,
      ].join(" ")}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("fz.theme");if(!t&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches)t="dark";if(t==="dark")document.documentElement.classList.add("dark");}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
      <Toaster />
    </html>
  );
}
