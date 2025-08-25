<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {

        $permissions = [
            // Salle
            'list_salles',
            'ajouter_salle',
            'modifier_salle',
            'supprimer_salle',
            'voir_salle',
            // Document
            'upload_documents',
            'show_documents',
            'delete_documents',
            'download_documents',
            'view_document',
            'update_documents',
            'telechargements',
            // Equipement permissions
            'ajouter_equipement',
            'voir_equipement',
            'modifier_equipement',
            'supprimer_equipement',
            'list_equipements',
            // Role
            'delete user',
            'list roles',
            'list permissions',
            'createRole',
            'assignRoleToUser',
            'removeRoleFromUser',
            'assignPermissionsToRole',
            'getAllRoles',
            'getRoleById',
            'updateRole',
            'deleteRole',

            // User permissions
            'list users',
            // Reservation permissions
            'list all reservations',
            'list own reservations',
            'view reservation detail',
            'create reservations',
            'approve reservations',
            'reject reservations',
            'cancel any reservation',
            'cancel own reservation',
            // New permissions
            'view_calendar_reservations',
            'view_daily_reservations',

        ];


        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $teacherRole = Role::firstOrCreate(['name' => 'enseignant']);
        $labManagerRole = Role::firstOrCreate(['name' => 'responsable_laboratoire']);
        $eleveRole = Role::firstOrCreate(['name' => 'eleve']);

        $adminRole->givePermissionTo($permissions);

        $teacherRole->givePermissionTo([
            'voir_salle',
            'upload_documents',
            'show_documents',
            'download_documents',
            'delete_documents',
            'view_document',
            'update_documents',
            // 'telechargements',
            'list own reservations',
            'view reservation detail',
            'create reservations',
            'cancel own reservation',
            'view_calendar_reservations',
            'view_daily_reservations',
        ]);
        $labManagerRole->givePermissionTo([
            'list_salles',
            'voir_equipement',
            'list_equipements',
            'list all reservations',
            'list own reservations',
            'view reservation detail',
            'create reservations',
            'approve reservations',
            'reject reservations',
            'cancel any reservation',
            'cancel own reservation',
            'view_calendar_reservations',
            'view_daily_reservations',
        ]);
        $eleveRole->givePermissionTo([
            'download_documents',
            'view_document',
            'telechargements',
            'view_calendar_reservations',
            'view_daily_reservations',
        ]);
    }
}
