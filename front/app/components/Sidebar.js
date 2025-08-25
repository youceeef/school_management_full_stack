"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const Sidebar = ({ isSidebarOpen, toggleSidebar, handleLogout, navItems, isMobileView, setIsSidebarOpen }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileView && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <aside 
        className={`
          fixed top-0 left-0 h-full bg-white dark:bg-dark-card z-30 
          transform transition-all duration-300 ease-in-out 
          ${isSidebarOpen 
            ? "translate-x-0 w-[280px] lg:w-64 shadow-2xl lg:shadow-lg" 
            : "-translate-x-full lg:translate-x-0 w-0 lg:w-[68px] overflow-hidden"
          }
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b dark:border-dark-border bg-gray-50 dark:bg-dark-card/50">
          <div className="flex items-center overflow-hidden">
            <div className={`relative w-10 h-10 flex-shrink-0 ${!isSidebarOpen ? 'mx-auto' : ''}`}>
              <Image 
                src="/logo.png" 
                alt="EDUSPACE Logo" 
                fill
                sizes="40px"
                className="object-contain dark:hidden" 
              />
              <Image 
                src="/logo_var.png" 
                alt="EDUSPACE Logo" 
                fill
                sizes="40px"
                className="object-contain hidden dark:block" 
              />
            </div>
            {isSidebarOpen && (
              <h2 className="font-bold text-xl text-[#1F2937] dark:text-white ml-3 truncate">EDUSPACE</h2>
            )}
          </div>
          {/* Toggle button - Only show on desktop */}
          <button 
            onClick={toggleSidebar} 
            className={`
              p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border/30 
              transition-all duration-200 hidden lg:block text-gray-600 
              dark:text-gray-300 border-none outline-none focus:outline-none group
              ${!isSidebarOpen ? 'absolute right-0 mr-2' : ''}
            `}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${isSidebarOpen ? 'rotate-0' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isSidebarOpen 
                  ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" // Collapse icon
                  : "M13 5l7 7-7 7M5 5l7 7-7 7"      // Expand icon
                }
              />
            </svg>
          </button>

          {/* Close button - Only show on mobile */}
          {isMobileView && (
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border/30 transition-all duration-200 lg:hidden text-gray-600 dark:text-gray-300 border-none outline-none focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide py-4">
          <ul className={`space-y-1 ${isSidebarOpen ? 'px-3' : 'px-2'}`}>
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={isMobileView ? () => setIsSidebarOpen(false) : undefined}
                    className={`
                      flex items-center rounded-lg 
                      transition-all duration-200 group relative
                      ${isActive 
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border/20"
                      }
                      ${isSidebarOpen 
                        ? 'px-3 py-2.5' 
                        : 'justify-center w-[52px] h-[42px] mx-auto'
                      }
                    `}
                    title={!isSidebarOpen ? item.name : undefined}
                  >
                    <div className={`
                      min-w-[24px] flex items-center justify-center
                      ${!isSidebarOpen ? 'text-2xl' : 'text-xl'}
                    `}>
                      {item.icon}
                    </div>
                    
                    {isSidebarOpen && (
                      <span className="ml-3 font-medium text-base truncate">
                        {item.name}
                      </span>
                    )}

                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 dark:bg-primary-400 rounded-r-full" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t dark:border-dark-border bg-gray-50 dark:bg-dark-card/50">
          <button 
            onClick={handleLogout} 
            className={`
              flex items-center rounded-lg
              text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 
              transition-colors duration-200 group
              ${isSidebarOpen 
                ? 'px-3 py-2.5 w-full' 
                : 'justify-center w-[52px] h-[42px] mx-auto'
              }
            `}
            title={!isSidebarOpen ? "Déconnexion" : undefined}
          >
            <div className={`
              min-w-[24px] flex items-center justify-center
              ${!isSidebarOpen ? 'text-2xl' : 'text-xl'}
            `}>
              🚪
            </div>
            {isSidebarOpen && (
              <span className="ml-3 font-medium truncate">
                Déconnexion
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
