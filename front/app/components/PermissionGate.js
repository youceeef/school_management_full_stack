'use client';

import { useAuth } from '../context/AuthContext';

export const PermissionGate = ({ 
  children, 
  permission,
  permissions = [],
  role, 
  matchType = 'any',
  fallback = null 
}) => {
  const { hasPermission, hasRole, hasAnyPermission, hasAllPermissions } = useAuth();

  const hasAccess = () => {
    // Check for single permission
    if (permission) {
      return hasPermission(permission);
    }

    // Check for multiple permissions
    if (permissions.length > 0) {
      return matchType === 'any' 
        ? hasAnyPermission(permissions)
        : hasAllPermissions(permissions);
    }

    // Check for role
    if (role) {
      return hasRole(role);
    }

    // If no permission or role specified, deny access
    return false;
  };

  return hasAccess() ? children : fallback;
};

export default PermissionGate; 