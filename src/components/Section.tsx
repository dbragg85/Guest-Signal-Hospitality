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
    <section id={id} className={`py-12 md:py-14 ${className || ''}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-5">
        {title ? (
          <div className="mx-auto mb-8 max-w-4xl text-center">
            {kicker ? (
              <p className="mb-2 text-sm font-semibold text-amber-800">
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
