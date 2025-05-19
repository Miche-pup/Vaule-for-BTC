import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SiteLayout from '@/components/Layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bitcoin Value Catalyst',
  description: 'Share and vote on ideas to improve Bitcoin',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black min-h-screen text-white`}>
        <SiteLayout>{children}</SiteLayout>
      </body>
    </html>
  );
} 