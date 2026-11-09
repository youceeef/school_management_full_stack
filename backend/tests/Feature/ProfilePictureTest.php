<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfilePictureTest extends TestCase
{
    use RefreshDatabase;

    private const DISK = 'profile_test';

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake(self::DISK);
        config(['filesystems.uploads_disk' => self::DISK]);
    }

    public function test_user_can_upload_a_valid_profile_picture(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->post('/api/user/profile', [
            'picture' => $this->fakePng('avatar.png', 400, 400),
        ], ['Accept' => 'application/json']);

        $response
            ->assertOk()
            ->assertJsonPath('updated.picture', true);

        $path = $user->fresh()->picture;

        $this->assertNotNull($path);
        $this->assertStringStartsWith('profile_pictures/', $path);
        Storage::disk(self::DISK)->assertExists($path);
    }

    public function test_replacement_is_stored_before_old_picture_is_removed(): void
    {
        $oldPath = 'profile_pictures/old-avatar.jpg';
        Storage::disk(self::DISK)->put($oldPath, 'old-image');

        $user = User::factory()->create(['picture' => $oldPath]);
        Sanctum::actingAs($user);

        $this->post('/api/user/profile', [
            'picture' => $this->fakePng('new-avatar.png', 300, 300),
        ], ['Accept' => 'application/json'])->assertOk();

        $newPath = $user->fresh()->picture;

        $this->assertNotSame($oldPath, $newPath);
        Storage::disk(self::DISK)->assertExists($newPath);
        Storage::disk(self::DISK)->assertMissing($oldPath);
    }

    public function test_invalid_picture_dimensions_return_validation_errors(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->post('/api/user/profile', [
            'picture' => $this->fakePng('tiny.png', 50, 50),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('picture');

        $this->assertNull($user->fresh()->picture);
    }

    public function test_user_can_delete_a_profile_picture(): void
    {
        $path = 'profile_pictures/avatar.jpg';
        Storage::disk(self::DISK)->put($path, 'image');

        $user = User::factory()->create(['picture' => $path]);
        Sanctum::actingAs($user);

        $this->deleteJson('/api/user/profile/picture')->assertOk();

        $this->assertNull($user->fresh()->picture);
        Storage::disk(self::DISK)->assertMissing($path);
    }

    private function fakePng(string $name, int $width, int $height): UploadedFile
    {
        $signature = "\x89PNG\r\n\x1a\n";
        $header = pack('NNCCCCC', $width, $height, 8, 2, 0, 0, 0);
        $scanlines = str_repeat("\x00".str_repeat("\x00", $width * 3), $height);

        $contents = $signature
            .$this->pngChunk('IHDR', $header)
            .$this->pngChunk('IDAT', gzcompress($scanlines, 9))
            .$this->pngChunk('IEND', '');

        return UploadedFile::fake()->createWithContent($name, $contents);
    }

    private function pngChunk(string $type, string $data): string
    {
        return pack('N', strlen($data))
            .$type
            .$data
            .pack('N', crc32($type.$data));
    }
}
