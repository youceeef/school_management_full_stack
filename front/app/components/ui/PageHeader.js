import React from "react";
import Link from "next/link";
import Button from "../Button";
import PermissionGate from "../PermissionGate";

const PageHeader = ({ title, description, actions, breadcrumbs = [], className = "" }) => {
  return (
    <div className={`pb-2 ${className}`}>
      {breadcrumbs.length > 0 && (
        <nav aria-label="Fil d'Ariane" className="mb-3">
          <ol className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span aria-hidden="true">/</span>}
                <li>
                  {item.href ? (
                    <Link href={item.href} className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-slate-800 dark:text-slate-200">{item.label}</span>
                  )}
                </li>
              </React.Fragment>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100 text-balance">
            {title}
          </h1>
          {description && <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">{description}</p>}
        </div>

        {actions && actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {actions.map((action, index) => {
              const { children, variant, onClick, loading, disabled, size, className: btnClassName, permission, icon } = action;

              const button = (
                <Button
                  key={index}
                  variant={variant}
                  onClick={onClick}
                  loading={loading}
                  disabled={disabled}
                  size={size}
                  icon={icon}
                  className={btnClassName}
                >
                  {children}
                </Button>
              );

              return permission ? (
                <PermissionGate key={index} permission={permission}>
                  {button}
                </PermissionGate>
              ) : (
                button
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
