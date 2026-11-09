<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::forget('health.readiness.v1');
        config([
            'health.version' => 'test-commit-sha',
            'health.build_time' => '2026-11-09T00:00:00Z',
            'filesystems.uploads_disk' => 'public',
            'filesystems.documents_disk' => 'local',
        ]);
    }

    public function test_readiness_reports_version_and_dependency_health(): void
    {
        $this->getJson('/health')
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('version', 'test-commit-sha')
            ->assertJsonPath('build_time', '2026-11-09T00:00:00Z')
            ->assertJsonPath('checks.database.status', 'ok')
            ->assertJsonPath('checks.profile_storage.status', 'ok')
            ->assertJsonPath('checks.document_storage.status', 'ok')
            ->assertJsonStructure([
                'timestamp',
                'checks' => [
                    'database' => ['status', 'latency_ms'],
                    'profile_storage' => ['status', 'latency_ms'],
                    'document_storage' => ['status', 'latency_ms'],
                ],
            ]);
    }

    public function test_readiness_returns_a_safe_degraded_response(): void
    {
        config(['filesystems.uploads_disk' => 'missing-health-disk']);
        Cache::forget('health.readiness.v1');

        $response = $this->getJson('/health')
            ->assertStatus(503)
            ->assertJsonPath('status', 'degraded')
            ->assertJsonPath('checks.profile_storage.status', 'error');

        $profileCheck = $response->json('checks.profile_storage');

        $this->assertArrayNotHasKey('exception', $profileCheck);
        $this->assertArrayNotHasKey('message', $profileCheck);
        $this->assertArrayNotHasKey('bucket', $profileCheck);
        $this->assertArrayNotHasKey('endpoint', $profileCheck);
    }
}
