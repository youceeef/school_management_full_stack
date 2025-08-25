import React from "react";

const Card = ({ title, children, className = "", headerAction }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
          {headerAction && <div className="flex items-center">{headerAction}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};

export default Card;
