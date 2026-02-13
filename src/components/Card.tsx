import { ReactNode } from "react";

export function Card({
  title,
  desc,
  children,
  className,
}: {
  title?: string;
  desc?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className || ''}`}>
      {title ? <h3 className="text-lg font-semibold tracking-tight">{title}</h3> : null}
      {desc ? <p className="mt-2 text-sm text-slate-600">{desc}</p> : null}
      {children ? <div className={title || desc ? "mt-4" : ""}>{children}</div> : null}
    </div>
  );
}
