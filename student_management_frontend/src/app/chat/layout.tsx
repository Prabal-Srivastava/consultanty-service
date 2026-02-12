import { ReactNode } from 'react';

export default function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {children}
    </div>
  );
}