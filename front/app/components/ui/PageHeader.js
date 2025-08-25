import React from "react";
import Button from "../Button";
import PermissionGate from "../PermissionGate";

const PageHeader = ({ title, description, actions, breadcrumbs = [], className = "" }) => {
  return (
    <div className={`mb-8 ${className}`}>
      {breadcrumbs.length > 0 && (
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span>/</span>}
                <li>
                  {item.href ? (
                    <a href={item.href} className="hover:text-gray-700 dark:hover:text-gray-300">
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </li>
              </React.Fragment>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
          {description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>}
        </div>

        {actions && (
          <div className="flex items-center space-x-3">
            {actions.map((action, index) => {
              const { children, variant, onClick, loading, size, className: btnClassName, permission } = action;
              
              const button = (
                <Button
                  key={index}
                  variant={variant}
                  onClick={onClick}
                  loading={loading}
                  size={size}
                  className={btnClassName}
                >
                  {children}
                </Button>
              );

              return permission ? (
                <PermissionGate key={index} permission={permission}>
                  {button}
                </PermissionGate>
              ) : button;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
