import { ReactNode } from "react";

export function Section({
  title,
  kicker,
  children,
  className,
  id,
}: {
  title?: string;
  kicker?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-14 ${className || ''}`}>
      <div className="mx-auto max-w-6xl px-4">
        {title ? (
          <div className="mb-8 max-w-2xl">
            {kicker ? (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {kicker}
              </p>
            ) : null}
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {title}
            </h2>
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}
