import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./tailwind.css";
import { ThemeProvider } from "@/components/ui/provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pathway - USDC Bridge",
  description: "Noble <> Ethereum USDC Bridge",
  keywords: [
    "pathway",
    "thepathway",
    "cosmos usdc bridge",
    "cosmos bridge",
    "noble usdc bridge",
    "usdc bridge",
  ],
  authors: [
    {
      name: "Peter Anyaogu",
      url: "https://www.linkedin.com/in/anyaogu/",
    },
  ],
};

export const viewport: Viewport = {
  minimumScale: 1,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2FB85D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
