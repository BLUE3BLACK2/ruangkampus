<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * Register publik. Hanya mahasiswa dan dosen: aturan 'role' dari
     * User::rules() ditimpa supaya akun admin tidak bisa dibuat dari sini.
     */
    public function register(Request $request): JsonResponse
    {
        $rules = User::rules();
        $rules['role'] = ['required', Rule::in(['mahasiswa', 'dosen'])];

        $validated = $request->validate($rules);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'], // di-hash otomatis oleh cast 'hashed'
            'role' => $validated['role'],
            'nim' => $validated['role'] === 'mahasiswa' ? $validated['nim'] : null,
            'nip' => $validated['role'] === 'dosen' ? $validated['nip'] : null,
        ]);

        return $this->tokenResponse($user, 'Registrasi berhasil.', 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah.',
                'errors' => ['email' => ['Email atau password salah.']],
            ], 401);
        }

        return $this->tokenResponse($user, 'Login berhasil.');
    }

    /** Hapus hanya token yang sedang dipakai, bukan semua perangkat. */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
            'data' => null,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Data pengguna berhasil diambil.',
            'data' => ['user' => $this->userData($request->user())],
        ]);
    }

    /** Field user yang boleh keluar ke frontend. */
    private function userData(User $user): array
    {
        return $user->only(['id', 'name', 'email', 'role', 'nim', 'nip']);
    }

    private function tokenResponse(User $user, string $message, int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'user' => $this->userData($user),
                'token' => $user->createToken('auth_token')->plainTextToken,
                'token_type' => 'Bearer',
            ],
        ], $status);
    }
}