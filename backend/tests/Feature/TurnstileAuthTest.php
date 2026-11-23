<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TurnstileAuthTest extends TestCase
{
    use RefreshDatabase;

    private function registerPayload(array $override = []): array
    {
        return array_merge([
            'name' => 'Budi Mahasiswa',
            'email' => 'budi@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'mahasiswa',
            'nim' => '2415101001',
        ], $override);
    }

    public function test_register_without_token_is_rejected(): void
    {
        Http::fake();

        $this->postJson('/api/register', $this->registerPayload())
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors('turnstile_token');

        $this->assertDatabaseMissing('users', ['email' => 'budi@example.test']);
        Http::assertNothingSent();
    }

    public function test_login_without_token_is_rejected(): void
    {
        Http::fake();

        $this->postJson('/api/login', [
            'email' => 'a@example.test',
            'password' => 'password123',
        ])->assertStatus(422)
            ->assertJsonValidationErrors('turnstile_token');
    }

    public function test_register_with_token_rejected_by_cloudflare_fails(): void
    {
        Http::fake([
            'challenges.cloudflare.com/*' => Http::response(['success' => false]),
        ]);

        $this->postJson('/api/register', $this->registerPayload(['turnstile_token' => 'palsu']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('turnstile_token');

        $this->assertDatabaseMissing('users', ['email' => 'budi@example.test']);
    }

    public function test_login_with_token_rejected_by_cloudflare_fails(): void
    {
        Http::fake([
            'challenges.cloudflare.com/*' => Http::response(['success' => false]),
        ]);

        User::factory()->create(['email' => 'a@example.test', 'password' => 'password123']);

        $this->postJson('/api/login', [
            'email' => 'a@example.test',
            'password' => 'password123',
            'turnstile_token' => 'palsu',
        ])->assertStatus(422);
    }

    public function test_valid_token_lets_register_through(): void
    {
        Http::fake([
            'challenges.cloudflare.com/*' => Http::response(['success' => true]),
        ]);

        $this->postJson('/api/register', $this->registerPayload(['turnstile_token' => 'asli']))
            ->assertCreated();
    }

    public function test_me_does_not_require_turnstile(): void
    {
        Http::fake();

        $user = User::factory()->create();
        $token = $user->createToken('uji')->plainTextToken;

        $this->withToken($token)->getJson('/api/me')->assertOk();
        Http::assertNothingSent();
    }
}