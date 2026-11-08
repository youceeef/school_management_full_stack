<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SecurityAndAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_security_headers_are_present(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    public function test_protected_document_paths_are_not_exposed(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        Storage::fake('local');

        $owner = User::factory()->create();
        $owner->assignRole('enseignant');
        $viewer = User::factory()->create();
        $viewer->assignRole('eleve');

        Storage::disk('local')->put('documents/private.pdf', '%PDF-1.4');
        $document = Document::create([
            'title' => 'Private document',
            'file_path' => 'documents/private.pdf',
            'file_type' => 'application/pdf',
            'user_id' => $owner->id,
            'description' => 'Protected',
        ]);

        $this->getJson("/api/documents/{$document->id}")->assertUnauthorized();

        $response = $this
            ->withToken($viewer->createToken('test')->plainTextToken)
            ->getJson("/api/documents/{$document->id}");

        $response
            ->assertOk()
            ->assertJsonMissingPath('file_path')
            ->assertJsonMissingPath('file_url');
    }

    public function test_admin_cannot_delete_self_or_a_built_in_role(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->deleteJson("/api/users/{$admin->id}")
            ->assertUnprocessable();

        $adminRole = $admin->roles()->where('name', 'admin')->firstOrFail();

        $this->withToken($token)
            ->deleteJson("/api/roles/{$adminRole->id}")
            ->assertUnprocessable();

        $this->assertDatabaseHas('users', ['id' => $admin->id, 'deleted_at' => null]);
        $this->assertDatabaseHas('roles', ['id' => $adminRole->id, 'name' => 'admin']);
    }

    public function test_dashboard_document_count_is_not_shadowed_by_document_routes(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->withToken($admin->createToken('test')->plainTextToken)
            ->getJson('/api/documents/count')
            ->assertOk()
            ->assertExactJson(['count' => 0]);
    }
}
