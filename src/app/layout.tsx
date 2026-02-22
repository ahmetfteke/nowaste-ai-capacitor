import type { Metadata, Viewport } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { HouseholdProvider } from "@/lib/household-context";
import { PWAElements } from "@/components/pwa-elements";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "No Waste AI",
  description: "Reduce food waste with AI-powered inventory tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${ibmPlexMono.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <HouseholdProvider>
            <PWAElements />
            {children}
          </HouseholdProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
