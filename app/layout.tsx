import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Code Archaeology - Historical Intelligence for GitHub Repositories',
  description:
    'Explore the story behind your code. Understand repository history, relationships, and evolution with evidence-backed analysis.',
  keywords: [
    'GitHub',
    'Repository Analysis',
    'Code History',
    'Archaeology',
    'Developer Tools',
    'AI Analysis',
  ],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0d0d0d" />
      </head>
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}