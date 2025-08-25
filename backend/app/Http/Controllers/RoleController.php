<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RoleController extends Controller
{

    public function listRoles()
    {
        $this->authorize('listRoles', Role::class);
        // Eager load permissions for all roles
        $roles = Role::with('permissions')->get();
        // Format each role to include its permissions as an array of names
        $rolesWithPermissions = $roles->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ];
        });
        return response()->json($rolesWithPermissions);
    }
    public function listPermissions()
    {
        $this->authorize('listPermissions', Role::class);
        $permissions = Permission::all();
        return response()->json($permissions);
    }

    /**
     * Create a new role and optionally assign permissions to it.
     */
    public function createRole(Request $request)
    {
        $this->authorize('createRole', Role::class);

        // Valider les données d'entrée
        $validated = $request->validate([
            'role_name' => 'required|string|unique:roles,name',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,name',
            'user_id' => 'nullable|exists:users,id',
        ]);

        // Étape 1 : Créer le rôle
        $role = Role::create([
            'name' => $validated['role_name'],
            'guard_name' => 'sanctum',
        ]);

        // Étape 2 : Attribuer les permissions au rôle
        if (!empty($validated['permissions'])) {
            $role->givePermissionTo($validated['permissions']);
        }

        // Étape 3 : Attribuer le rôle à un utilisateur si un user_id est fourni
        if (!empty($validated['user_id'])) {
            $user = User::findOrFail($validated['user_id']);
            $user->assignRole($role);
        }

        return response()->json([
            'message' => 'Role created successfully',
            'role' => $role->only('id', 'name'),
            'permissions' => $role->permissions->pluck('name'),
            'user' => !empty($validated['user_id']) ? $user
                ->only(['id', 'first_name']) : null,
        ], 201);
    }

    /**
     * Assign a role to a user.
     */
    public function assignRoleToUser(Request $request, $userId)
    {
        // Ensure the current user has the right permission to assign roles
        $this->authorize('assignRoleToUser', Role::class);

        // Validate the incoming request
        $validated = $request->validate([
            'role_name' => 'required|string|exists:roles,name',
        ]);

        // Find the user by the provided ID
        $user = User::findOrFail($userId);

        // Find the role by name
        $role = Role::findByName($validated['role_name']);

        // Assign the role to the user
        $user->assignRole($role);

        // Return a success response
        return response()->json([
            'message' => 'Role assigned to user successfully.',
            'user' => $user->only(['id', 'first_name']),
            'role' => $role->only(['id', 'name']),
        ]);
    }

    public function removeRoleFromUser(Request $request, $userId)
    {
        // Ensure the current user has the right permission to remove roles
        $this->authorize('removeRoleFromUser', Role::class);

        // Validate the incoming request
        $validated = $request->validate([
            'role_name' => 'required|string|exists:roles,name',
        ]);
        $this->authorize('removeRoleFromUser', [User::class, $userId]);
        // Find the user by the provided ID
        $user = User::findOrFail($userId);

        // Find the role by name
        $role = Role::findByName($validated['role_name']);

        // Remove the role from the user if they have it
        if ($user->hasRole($role)) {
            $user->removeRole($role);

            // Return a success response
            return response()->json([
                'message' => 'Role removed from user successfully.',
                'user' => $user->only(['id', 'first_name']),
                'role' => $role->only(['id', 'name']),
            ]);
        }

        // Return a not found response if the user does not have the role
        return response()->json([
            'message' => 'User does not have the specified role.',
        ], 404);
    }


    /**
     * Assign permissions to an existing role.
     */
    public function assignPermissionsToRole(Request $request, $roleId)
    {
        $this->authorize('assignPermissionsToRole', Role::class);
        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        // Find the role
        $role = Role::findOrFail($roleId);

        // Assign the permissions to the role
        $role->givePermissionTo($validated['permissions']);
        return response()->json([
            'message' => 'Permissions assigned to role successfully.',
            'role' => $role->only('id', 'name'),
            'permissions' => $role->permissions->pluck('name'),
        ]);
    }



    // get all the roles
    public function getAllRoles()
    {
        $this->authorize('getAllRoles', Role::class);
        $roles = Role::all();
        return response()->json($roles);
    }


    // get a role by id
    public function getRoleById($id)
    {
        $this->authorize('getRoleById', Role::class);
        $role = Role::findOrFail($id);
        return response()->json($role);
    }


    // update a role by id
    public function updateRole(Request $request, $id)
    {
        $this->authorize('updateRole', Role::class);

        // Validate the input data
        $validated = $request->validate([
            'name' => 'sometimes|string|unique:roles,name,' . $id,
            'permissions' => 'sometimes|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        // Find the role
        $role = Role::findOrFail($id);

        // Update role name if provided
        if (isset($validated['name'])) {
            $role->update(['name' => $validated['name']]);
        }

        // Update permissions if provided
        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json([
            'message' => 'Role updated successfully',
            'role' => $role->only(['id', 'name']),
            'permissions' => $role->permissions->pluck('name'),
        ]);
    }

    // delete a role by id
    public function deleteRole($id)
    {
        $this->authorize('deleteRole', Role::class);
        $role = Role::findOrFail($id);
        $role->delete();
        return response()->json(['message' => 'Role deleted successfully']);
    }
}
