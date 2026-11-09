<?php

return [
    'version' => env('APP_VERSION', env('RENDER_GIT_COMMIT', 'local')),
    'api_schema_version' => (string) env('API_SCHEMA_VERSION', '1'),
    'build_time' => env('APP_BUILD_TIME'),
    'build_time_file' => base_path('.build-time'),
    'cache_seconds' => (int) env('HEALTH_CACHE_SECONDS', 60),
];
