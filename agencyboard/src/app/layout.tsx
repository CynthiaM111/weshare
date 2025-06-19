import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins, Orbitron,Syncopate,Black_Ops_One,Monoton } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-orbitron',
});

const syncopate = Syncopate({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-syncopate',
});

const black_ops_one = Black_Ops_One({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-black-ops-one',
});

const monoton = Monoton({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-monoton',
});

export const metadata: Metadata = {
  title: "WeShare",
  description: "WeShare",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${orbitron.variable} ${syncopate.variable} ${black_ops_one.variable} ${monoton.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
