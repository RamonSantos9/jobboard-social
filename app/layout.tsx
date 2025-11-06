import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JobBoard Social",
  description:
    "Uma plataforma social para profissionais e empresas conectarem-se através de vagas e networking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={sora.variable}>
      <body className={`${sora.className} font-sora`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
