<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminUser = User::create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@example.com',
            'password' => bcrypt('admin@example.com'),
        ]);

        // $teacherUser = User::create([
        //     'first_name' => 'Teacher',
        //     'last_name' => 'User',
        //     'email' => 'teacher@example.com',
        //     'password' => bcrypt('teacher@example.com'),
        // ]);
        // $manager = User::create([
        //     'first_name' => 'responsable',
        //     'last_name' => 'User',
        //     'email' => 'responsable@example.com',
        //     'password' => bcrypt('responsable@example.com'),
        // ]);
        // $eleve = User::create([
        //     'first_name' => 'eleve',
        //     'last_name' => 'User',
        //     'email' => 'eleve@example.com',
        //     'password' => bcrypt('eleve@example.com'),
        // ]);

        //     // Assign roles to the users
        $adminUser->assignRole('admin');
        // $teacherUser->assignRole('enseignant');
        // $manager->assignRole('responsable_laboratoire');
        // $eleve->assignRole(roles: 'eleve');
    }
}
