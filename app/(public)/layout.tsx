import type { Metadata } from "next";
import { Inter, Space_Grotesk, Space_Mono } from "next/font/google";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Apply to HackClub VIT Chennai",
  description: "Join HackClub VIT Chennai - Recruitment 2026",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className="bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}