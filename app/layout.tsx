import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Globiz Patholab — Diagnostic Excellence',
  description:
    'Globiz Patholab: streamlined pathology lab management for clinicians and patients.',
  keywords: ['pathology', 'lab management', 'diagnostics', 'Globiz'],
  authors: [{ name: 'Globiz Patholab' }],
};

// Separate viewport export — required in Next.js 14+
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // enables safe-area-inset support on notched phones
  themeColor: '#2d14c9',  // Android status bar color
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var isNative = !!(
                  (window.Capacitor && window.Capacitor.isNativePlatform) ||
                  window.location.protocol === 'capacitor:' ||
                  window.location.protocol === 'file:' ||
                  (window.location.hostname === 'localhost' && !window.location.port) ||
                  navigator.userAgent.indexOf('Capacitor') > -1
                );
                if (isNative) {
                  document.documentElement.classList.add('is-native');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased" style={{ background: '#f1f3ff', overscrollBehavior: 'none' }}>
        {children}
      </body>
    </html>
  );
}
