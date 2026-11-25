import React from 'react';

export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1 text-sm lg:text-base">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}