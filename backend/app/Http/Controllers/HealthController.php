<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class HealthController extends Controller
{
    public function liveness(): JsonResponse
    {
        return $this->response([
            ...$this->metadata(),
            'status' => 'ok',
        ]);
    }

    public function readiness(): JsonResponse
    {
        $checks = Cache::remember(
            'health.readiness.v1',
            max(1, config('health.cache_seconds', 60)),
            fn () => [
                'database' => $this->checkDatabase(),
                'profile_storage' => $this->checkStorage(
                    config('filesystems.uploads_disk')
                ),
                'document_storage' => $this->checkStorage(
                    config('filesystems.documents_disk')
                ),
            ]
        );

        $healthy = collect($checks)->every(
            fn (array $check) => $check['status'] === 'ok'
        );

        return $this->response([
            ...$this->metadata(),
            'status' => $healthy ? 'ok' : 'degraded',
            'checks' => $checks,
        ], $healthy ? 200 : 503);
    }

    private function metadata(): array
    {
        return [
            'application' => config('app.name'),
            'version' => config('health.version', 'local'),
            'build_time' => $this->buildTime(),
            'timestamp' => now()->utc()->toIso8601String(),
        ];
    }

    private function buildTime(): ?string
    {
        if ($configured = config('health.build_time')) {
            return $configured;
        }

        $path = config('health.build_time_file');

        return is_string($path) && is_readable($path)
            ? trim((string) file_get_contents($path))
            : null;
    }

    private function checkDatabase(): array
    {
        return $this->timedCheck(function () {
            DB::select('select 1');
        });
    }

    private function checkStorage(?string $diskName): array
    {
        return $this->timedCheck(function () use ($diskName) {
            if (! $diskName) {
                throw new \RuntimeException('Storage disk is not configured.');
            }

            $configuration = config("filesystems.disks.{$diskName}");
            if (! is_array($configuration)) {
                throw new \RuntimeException('Storage disk configuration is missing.');
            }

            if (($configuration['driver'] ?? null) === 's3') {
                $bucket = $configuration['bucket'] ?? null;
                if (! $bucket) {
                    throw new \RuntimeException('Storage bucket is not configured.');
                }

                Storage::disk($diskName)->getClient()->listObjectsV2([
                    'Bucket' => $bucket,
                    'MaxKeys' => 1,
                ]);

                return;
            }

            $root = $configuration['root'] ?? null;
            if (! is_string($root) || ! is_dir($root) || ! is_readable($root)) {
                throw new \RuntimeException('Local storage is not readable.');
            }
        });
    }

    private function timedCheck(callable $check): array
    {
        $startedAt = hrtime(true);

        try {
            $check();

            return [
                'status' => 'ok',
                'latency_ms' => $this->elapsedMilliseconds($startedAt),
            ];
        } catch (Throwable) {
            return [
                'status' => 'error',
                'latency_ms' => $this->elapsedMilliseconds($startedAt),
            ];
        }
    }

    private function elapsedMilliseconds(int $startedAt): float
    {
        return round((hrtime(true) - $startedAt) / 1_000_000, 2);
    }

    private function response(array $payload, int $status = 200): JsonResponse
    {
        return response()
            ->json($payload, $status)
            ->header('Cache-Control', 'no-store, max-age=0');
    }
}
