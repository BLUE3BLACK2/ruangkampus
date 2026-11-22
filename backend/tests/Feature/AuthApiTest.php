<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;
    protected function setUp(): void
    {
        parent::setUp();

        // Cloudflare dipalsukan: test tidak memanggil jaringan sungguhan.
        Http::fake([
            'challenges.cloudflare.com/*' => Http::response(['success' => true]),
        ]);
    }

    private function mahasiswaPayload(array $override = []): array
    {
        return array_merge([
            'name' => 'Budi Mahasiswa',
            'email' => 'budi@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'mahasiswa',
            'nim' => '2415101001',
            'turnstile_token' => 'token-uji',
        ], $override);
    }

    public function test_mahasiswa_can_register_and_gets_token(): void
    {
        $response = $this->postJson('/api/register', $this->mahasiswaPayload());

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'mahasiswa')
            ->assertJsonPath('data.user.nim', '2415101001')
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonMissingPath('data.user.password');

        $this->assertNotEmpty($response->json('data.token'));
        $this->assertDatabaseHas('users', ['email' => 'budi@example.test', 'role' => 'mahasiswa']);
    }

    public function test_dosen_can_register_with_nip(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Dosen Uji',
            'email' => 'dosen@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'dosen',
            'nip' => '199001012020011001',
            'turnstile_token' => 'token-uji',
        ])->assertCreated()
            ->assertJsonPath('data.user.role', 'dosen')
            ->assertJsonPath('data.user.nip', '199001012020011001');
    }

    public function test_public_register_cannot_create_admin(): void
    {
        $this->postJson('/api/register', $this->mahasiswaPayload(['role' => 'admin']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('role');

        $this->assertDatabaseMissing('users', ['email' => 'budi@example.test']);
    }

    public function test_mahasiswa_must_provide_nim(): void
    {
        $this->postJson('/api/register', $this->mahasiswaPayload(['nim' => null]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('nim');
    }

    public function test_email_must_be_unique(): void
    {
        $this->postJson('/api/register', $this->mahasiswaPayload())->assertCreated();

        $this->postJson('/api/register', $this->mahasiswaPayload(['nim' => '2415101002']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_password_confirmation_is_required(): void
    {
        $this->postJson('/api/register', $this->mahasiswaPayload(['password_confirmation' => 'beda']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('password');
    }

    public function test_user_can_login_with_correct_credentials(): void
    {
        User::factory()->create([
            'email' => 'login@example.test',
            'password' => 'password123',
            'role' => 'dosen',
            'nip' => '199001012020011002',
        ]);

        $this->postJson('/api/login', [
            'email' => 'login@example.test',
            'password' => 'password123',
            'turnstile_token' => 'token-uji',
        ])->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'dosen')
            ->assertJsonStructure(['data' => ['user', 'token', 'token_type']]);
    }

    public function test_login_with_wrong_password_is_rejected(): void
    {
        User::factory()->create([
            'email' => 'login@example.test',
            'password' => 'password123',
        ]);

        $this->postJson('/api/login', [
            'email' => 'login@example.test',
            'password' => 'salah-total',
            'turnstile_token' => 'token-uji',
        ])->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_me_returns_current_user_with_token(): void
    {
        $token = $this->postJson('/api/register', $this->mahasiswaPayload())
            ->json('data.token');

        $this->withToken($token)->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.user.email', 'budi@example.test');
    }

    public function test_me_without_token_is_unauthorized(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
    }

    public function test_logout_revokes_the_current_token(): void
    {
        $token = $this->postJson('/api/register', $this->mahasiswaPayload())
            ->json('data.token');

        $user = User::where('email', 'budi@example.test')->first();
        $this->assertSame(1, $user->tokens()->count());

        $this->withToken($token)->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSame(0, $user->tokens()->count());
    }
}