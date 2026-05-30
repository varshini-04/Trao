import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "AI Travel Planner — Plan Your Next Journey",
  description: "Generate a detailed day-by-day travel itinerary with custom budget estimation and hotel suggestions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className={`${plusJakartaSans.variable} ${outfit.variable} ${playfairDisplay.variable} h-full antialiased bg-[#f8fafc] text-[#1e293b] font-sans bg-journal-grid`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
