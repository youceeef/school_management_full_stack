<?php

use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\EquipementController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\RoleController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\SalleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Auth\ChangePasswordController;
use App\Models\Reservation;
use App\Models\User;
use App\Http\Controllers\DashboardController;

/*
|--------------------------------------------------------------------------
| GUEST ROUTES
|--------------------------------------------------------------------------
| Routes accessible to all visitors.
*/

Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])->middleware('guest')->name('password.email');
Route::post('/reset-password', [NewPasswordController::class, 'store'])->middleware('guest')->name('password.update');
Route::post('/login', [AuthenticatedSessionController::class, 'store']);

Route::prefix('register')->group(function () {
    Route::post('/eleve', [RegisteredUserController::class, 'registerStudent']);
    Route::post('/enseignant', [RegisteredUserController::class, 'registerTeacher']);
    Route::post('/responsable_labo', [RegisteredUserController::class, 'registerManager']);
    Route::post('/admin', [RegisteredUserController::class, 'registerAdmin']);
});

/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES
|--------------------------------------------------------------------------
| Routes requiring authentication via Sanctum.
*/
Route::middleware(['auth:sanctum'])->group(function () {

    // --- Documents ---
    Route::prefix('documents')->group(function () {
        Route::get('/telechargements', [DocumentController::class, 'telechargements']);
        Route::post('/upload', [DocumentController::class, 'upload']);
        Route::get('/', [DocumentController::class, 'index']);
        Route::get('/{documentId}', [DocumentController::class, 'show']);
        Route::get('/{documentId}/download', [DocumentController::class, 'download']);
        Route::delete('/{documentId}', [DocumentController::class, 'delete']);
        Route::put('/{documentId}', [DocumentController::class, 'update']);
    });
    // --- Dashboard Stats ---
    Route::get('/users/count', [DashboardController::class, 'getUserCount']);
    Route::get('/salles/count', [DashboardController::class, 'getSalleCount']);
    Route::get('/equipements/count', [DashboardController::class, 'getEquipementCount']);
    Route::get('/documents/count', [DashboardController::class, 'getDocumentCount']);

    // --- Salles ---
    Route::prefix('salles')->group(function () {
        Route::get('/', [SalleController::class, 'index']);
        Route::post('/', [SalleController::class, 'store']);
        Route::get('/{salleId}', [SalleController::class, 'show']);
        Route::put('/{salleId}', [SalleController::class, 'update']);
        Route::delete('/{salleId}', [SalleController::class, 'destroy']);
    });
    Route::get('/sallesIndex/', [SalleController::class, 'indexCalendar'])->name('salles.calendar');
    Route::get('/indexEquipements/', [EquipementController::class, 'indexEquipements'])->name('equipements.index');
    // --- Equipements ---
    Route::prefix('equipements')->group(function () {
        Route::get('/', [EquipementController::class, 'index']);
        Route::post('/', [EquipementController::class, 'store']);
        Route::get('/{equipementId}', [EquipementController::class, 'show']);
        Route::put('/{equipementId}', [EquipementController::class, 'update']);
        Route::delete('/{equipementId}', [EquipementController::class, 'destroy']);
    });

    // --- Users & Profile ---
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::delete('/users/{userId}', [UserController::class, 'deleteUserByAdmin'])->name('users.destroy');
    Route::delete('/users/{userId}/roles', [RoleController::class, 'removeRoleFromUser']);
    Route::get('/user', [UserController::class, 'getCurrentUser']);
    Route::get('/user/permissions', [UserController::class, 'getPermissions']);

    Route::prefix('user')->group(function () {
        Route::get('/profile', [UserController::class, 'showProfile']);
        Route::post('/profile', [UserController::class, 'updateProfile']);
        Route::delete('/profile', [UserController::class, 'deleteProfile']);
        Route::delete('/profile/picture', [UserController::class, 'deleteProfilePicture'])->name('profile.picture.delete');
    });

    // --- Reservations ---
    Route::prefix('reservations')->group(function () {
        // Specific GET routes must be defined BEFORE generic routes with parameters.
        Route::get('/', [ReservationController::class, 'index'])->name('reservations.index');
        Route::get('/calendar/view', [ReservationController::class, 'getCalendarReservations'])->name('reservations.calendar');
        Route::get('/calendar/daily', [ReservationController::class, 'getDailyReservations'])->name('reservations.daily');
        Route::get('/recent', [DashboardController::class, 'getRecentReservations'])->name('reservations.recent');

        // Other action routes
        Route::post('/', [ReservationController::class, 'store'])->name('reservations.store');

        // Generic routes with parameters ({reservation}) must be defined LAST.
        Route::get('/{reservation}', [ReservationController::class, 'show'])->name('reservations.show');
        Route::put('/{reservation}/approve', [ReservationController::class, 'approve'])->name('reservations.approve');
        Route::put('/{reservation}/reject', [ReservationController::class, 'reject'])->name('reservations.reject');
        Route::delete('/{reservation}', [ReservationController::class, 'destroy'])->name('reservations.destroy');
    });

    Route::prefix('my-reservations')->group(function () {
        Route::get('/', [ReservationController::class, 'myReservations'])->name('reservations.my');
        Route::get('/{reservation}', [ReservationController::class, 'myReservationSingle'])->name('reservations.my.show');
        Route::delete('/{reservation}/cancel', [ReservationController::class, 'cancelMyReservation'])->name('reservations.my.cancel');
    });

    // --- Roles & Permissions ---
    Route::get('/permissions', [RoleController::class, 'listPermissions'])->name('roles.permissions');
    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'listRoles'])->name('roles.index');
        Route::post('/', [RoleController::class, 'createRole'])->name('roles.create');
        Route::get('/{role}', [RoleController::class, 'getRoleById'])->name('roles.show');
        Route::put('/{role}', [RoleController::class, 'updateRole'])->name('roles.update');
        Route::delete('/{role}', [RoleController::class, 'deleteRole'])->name('roles.destroy');
        Route::post('/{role}/permissions', [RoleController::class, 'assignPermissionsToRole'])->name('roles.assignPermissions');
        Route::post('/users/{user}', [RoleController::class, 'assignRoleToUser'])->name('roles.assignToUser');
    });

    // --- Notifications ---
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('notifications.index');
        Route::get('/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread.count');
        Route::post('/{notification}/mark-as-read', [NotificationController::class, 'markAsRead'])->name('notifications.markAsRead');
        Route::post('/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.markAllAsRead');
        Route::delete('/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
    });

    // --- Auth Actions ---
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
    Route::post('/change-password', [ChangePasswordController::class, 'store'])->name('password.change');
});
