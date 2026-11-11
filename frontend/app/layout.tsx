import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tidewrk | Workspace',
  description: 'A straightforward workspace for projects and team tasks.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
