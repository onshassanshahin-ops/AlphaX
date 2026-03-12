import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'AlphaX — Syrian Research Collective',
    template: '%s | AlphaX',
  },
  description:
    'AlphaX is a Syrian research collective dedicated to bridging the knowledge gap in the Arab world. We translate global research into Arabic, publish original research, and train the next generation of Arab scientists.',
  keywords: ['AlphaX', 'Syrian research', 'Arabic science', 'research collective', 'knowledge bridge'],
  authors: [{ name: 'AlphaX Collective' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'AlphaX',
    title: 'AlphaX — Syrian Research Collective',
    description: 'From knowledge consumers to knowledge creators.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AlphaX — Syrian Research Collective',
    description: 'From knowledge consumers to knowledge creators.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-bg text-slate-200 font-inter antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1f3a',
              color: '#e2e8f0',
              border: '1px solid rgba(0, 180, 216, 0.3)',
              borderRadius: '0.5rem',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: {
                primary: '#00B4D8',
                secondary: '#0f1419',
              },
            },
            error: {
              iconTheme: {
                primary: '#FF6B35',
                secondary: '#0f1419',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
