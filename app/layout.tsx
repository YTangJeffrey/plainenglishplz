import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Plain English, Please',
  description: 'Snap a museum label and get a plain-English explanation tailored to your audience.',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body>{children}</body>
  </html>
);

export default RootLayout;
