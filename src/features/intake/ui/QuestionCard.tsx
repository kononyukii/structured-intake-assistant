import type { ReactNode } from 'react';

interface QuestionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function QuestionCard({ title, description, children }: QuestionCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 md:p-6">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
