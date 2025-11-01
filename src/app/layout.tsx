import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import ReactQueryProvider from "../../providers/ReactQueryProvider";
import MantinesProvider from "../../providers/MantinesProvider";
import { Toaster } from "react-hot-toast";
import AuthProvider from "../../providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  icons: {
    icon: "/logo/logo.png",
  },
  title: "Chinmoy Danish Electrical Plumbing Shop Portal",
  description:
    "It is a internal portal of Chinmoy Danish Electrical Plumbing Shopk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="format-detection" content="telephone=no" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ReactQueryProvider>
            <MantinesProvider>
              {children}
              <Toaster
                position="bottom-right"
                gutter={8}
                toastOptions={{
                  duration: 5000,
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: "#4CAF50",
                      secondary: "#fff",
                    },
                  },
                  error: {
                    duration: 4000,
                  },
                }}
                reverseOrder={false}
              />
            </MantinesProvider>
          </ReactQueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
