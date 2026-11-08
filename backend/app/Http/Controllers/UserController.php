<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
    }

    //
    public function index()
    {
        $this->authorize('listUsers', User::class);
        $users = User::with('roles')->get();
        $usersWithRoles = $users->map(function ($user) {
            return [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                // Add other fields as needed
                'roles' => $user->roles->pluck('name'),
            ];
        });

        return response()->json($usersWithRoles);
    }

    public function show($id)
    {
        $user = User::find($id);

        return response()->json($user);
    }

    public function showProfile()
    {
        try {
            $user = Auth::user()->load('roles');

            return response()->json([
                'message' => 'Profile fetched successfully',
                'user' => new UserResource($user),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user profile: '.$e->getMessage());

            return response()->json(['message' => 'Error fetching profile'], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        try {
            $user = Auth::user();
            DB::beginTransaction();

            try {
                $validatedData = $this->validateProfileData($request);

                // Handle file upload if picture is present
                $pictureUploaded = false;
                if ($request->hasFile('picture')) {
                    $pictureResult = $this->handleProfilePicture($request, $user);
                    if (! $pictureResult['success']) {
                        DB::rollBack();

                        return response()->json(['message' => $pictureResult['message']], 500);
                    }
                    $pictureUploaded = true;
                }

                // Update other user fields
                $this->updateUserFields($user, $validatedData);

                // Save if changes were made
                $hasTextChanges = $user->isDirty();

                if ($hasTextChanges || $pictureUploaded) {
                    $user->save();
                    DB::commit();

                    return response()->json([
                        'message' => 'Profile updated successfully',
                        'user' => new UserResource($user),
                    ]);
                } else {
                    DB::commit();

                    return response()->json([
                        'message' => 'No changes detected in the profile data',
                        'user' => new UserResource($user),
                    ]);
                }
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Error updating user profile: '.$e->getMessage());

            return response()->json(['message' => 'Error updating profile'], 500);
        }
    }

    private function validateProfileData(Request $request)
    {
        $rules = [
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'bio' => 'nullable|string|max:1000',
        ];

        // Only add picture validation if a file is being uploaded
        if ($request->hasFile('picture')) {
            $rules['picture'] = [
                'file',
                'image',
                'mimes:jpeg,png,jpg,gif,webp',
                'max:2048', // 2MB
                'dimensions:min_width=100,min_height=100,max_width=2000,max_height=2000',
            ];
        }

        return $request->validate($rules);
    }

    private function handleProfilePicture(Request $request, User $user)
    {
        try {
            $diskName = config('filesystems.uploads_disk');
            $disk = Storage::disk($diskName);

            // Verify the file is valid
            if (! $request->file('picture')->isValid()) {
                return [
                    'success' => false,
                    'message' => 'The uploaded file is not valid',
                ];
            }

            // Delete old picture if exists
            if ($user->picture && $disk->exists($user->picture)) {
                $disk->delete($user->picture);
            }

            // Create the directory if it doesn't exist
            $directory = 'profile_pictures';
            if (! $disk->exists($directory)) {
                $disk->makeDirectory($directory);
            }

            // Store with unique filename
            $fileName = time().'_'.uniqid().'.'.$request->file('picture')->getClientOriginalExtension();
            $path = $request->file('picture')->storeAs($directory, $fileName, $diskName);

            if (! $path) {
                return [
                    'success' => false,
                    'message' => 'Failed to store the uploaded file',
                ];
            }

            $user->picture = $path;

            return ['success' => true];
        } catch (\Exception $e) {
            Log::error('File Upload Failed: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to upload profile picture',
            ];
        }
    }

    public function deleteProfilePicture()
    {
        try {
            $user = Auth::user();

            if (! $user->picture) {
                return response()->json(['message' => 'No profile picture to delete'], 404);
            }

            $disk = Storage::disk(config('filesystems.uploads_disk'));
            if ($disk->exists($user->picture)) {
                $disk->delete($user->picture);
            }

            // Clear stale database paths even if an ephemeral filesystem already
            // removed the underlying file.
            $user->picture = null;
            $user->save();

            return response()->json([
                'message' => 'Profile picture deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting profile picture: '.$e->getMessage());

            return response()->json(['message' => 'Error deleting profile picture'], 500);
        }
    }

    private function updateUserFields(User $user, array $validatedData)
    {
        $fields = ['first_name', 'last_name', 'address', 'phone', 'bio'];

        foreach ($fields as $field) {
            // Only update if field exists in validated data AND is not empty or null
            if (
                array_key_exists($field, $validatedData) &&
                $validatedData[$field] !== null &&
                $validatedData[$field] !== ''
            ) {
                $user->{$field} = $validatedData[$field];
            }
        }

        return $user;
    }

    public function deleteProfile()
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $picturePath = $user->picture;

        $user->tokens()->delete();

        if ($user->delete()) {
            // If user deletion is successful, then delete the profile picture
            $disk = Storage::disk(config('filesystems.uploads_disk'));
            if ($picturePath && $disk->exists($picturePath)) {
                try {
                    $disk->delete($picturePath);
                } catch (\Exception $e) {
                    Log::error('Failed to delete profile picture: '.$e->getMessage());
                }
            }

            return response()->json(['message' => 'Your profile has been deleted successfully.']);
        } else {
            return response()->json(['message' => 'Failed to delete profile from the database.'], 500);
        }
    }

    public function deleteUserByAdmin(Request $request, $userId)
    {
        $this->authorize('deleteUser', User::class);
        $user = User::with('roles')->findOrFail($userId);

        if ($request->user()->is($user)) {
            return response()->json([
                'message' => 'You cannot delete your own administrator account.',
            ], 422);
        }

        if ($user->hasRole('admin') && User::role('admin')->count() <= 1) {
            return response()->json([
                'message' => 'The last administrator account cannot be deleted.',
            ], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function getCurrentUser()
    {
        $user = Auth::user()->load('roles');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'roles' => $user->roles->pluck('name'),
            ],
        ]);
    }

    public function getPermissions()
    {
        $user = Auth::user();

        return response()->json([
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    }
}
