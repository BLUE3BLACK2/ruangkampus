<?php

namespace Tests\Feature;

use App\Services\TurnstileService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TurnstileServiceTest extends TestCase
{
    public function test_turnstile_verification_returns_true_when_cloudflare_accepts_token(): void
    {
        config([
            'services.turnstile.secret_key' => 'test-secret',
        ]);

        Http::fake([
            'challenges.cloudflare.com/*' => Http::response([
                'success' => true,
            ], 200),
        ]);

        $service = new TurnstileService();

        $result = $service->verify('test-token');

        $this->assertTrue($result);
    }

    public function test_turnstile_verification_returns_false_when_cloudflare_rejects_token(): void
    {
        config([
            'services.turnstile.secret_key' => 'test-secret',
        ]);

        Http::fake([
            'challenges.cloudflare.com/*' => Http::response([
                'success' => false,
            ], 200),
        ]);

        $service = new TurnstileService();

        $result = $service->verify('invalid-token');

        $this->assertFalse($result);
    }
}
