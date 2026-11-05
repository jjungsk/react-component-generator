import type { ReactNode } from 'react';

interface WindowProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function Window({ title, children, className = '' }: WindowProps) {
  return (
    <section className={`win ${className}`.trim()}>
      <header className="win-bar">
        <span className="win-close" aria-hidden="true" />
        <h2 className="win-title">{title}</h2>
        <span className="win-depth" aria-hidden="true" />
      </header>
      <div className="win-body">{children}</div>
    </section>
  );
}
