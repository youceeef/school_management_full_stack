"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

const ProtectedRoute = ({ 
  children, 
  permission,
  permissions = [],
  role,
  matchType = 'any',
  redirectTo = '/unauthorized' 
}) => {
  const router = useRouter();
  const { hasPermission, hasRole, hasAnyPermission, hasAllPermissions, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      let hasAccess = true;

      // Check for single permission
      if (permission) {
        hasAccess = hasPermission(permission);
      }

      // Check for multiple permissions
      if (permissions.length > 0) {
        hasAccess = matchType === 'any' 
          ? hasAnyPermission(permissions)
          : hasAllPermissions(permissions);
      }

      // Check for role
      if (role) {
        hasAccess = hasRole(role);
      }

      if (!hasAccess) {
        router.push(redirectTo);
      }
    }
  }, [permission, permissions, role, matchType, loading, router, redirectTo, hasPermission, hasRole, hasAnyPermission, hasAllPermissions]);

  // Show loading indicator while checking auth
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <LoadingSpinner />
    </div>;
  }

  // If authenticated, render children
  return children;
};

export default ProtectedRoute;
