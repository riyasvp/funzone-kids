import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fredoka",
});

export const metadata: Metadata = {
  title: "FunZone Kids - 20 Free Fun Games for Children!",
  description: "Play 20 amazing free games for kids! Snake, Memory Match, Bubble Pop, and more. Safe, fun, and educational games for children of all ages.",
  keywords: ["kids games", "children games", "free games", "educational games", "fun games", "online games for kids", "safe games"],
  authors: [{ name: "FunZone Kids" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "FunZone Kids - Free Fun Games!",
    description: "20 amazing free games for kids! Safe and fun entertainment.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fredoka.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
