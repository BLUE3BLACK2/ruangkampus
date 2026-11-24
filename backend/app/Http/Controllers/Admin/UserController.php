<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * Menampilkan daftar pengguna dengan pencarian, filter role, dan pagination.
     */
    public function index(Request $request): AnonymousResourceCollection
    {

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', 'in:admin,mahasiswa,dosen'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $users = User::query()
            ->withCount('reservations')
            ->when($validated['search'] ?? null, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('nim', 'like', "%{$search}%")
                        ->orWhere('nip', 'like', "%{$search}%");
                });
            })
            ->when($validated['role'] ?? null, function ($query, $role) {
                $query->where('role', $role);
            })
            ->latest()
            ->paginate($validated['per_page'] ?? 10);

        return UserResource::collection($users);
    }

    /**
     * Menyimpan pengguna baru.
     */
    public function store(Request $request): UserResource
    {
        $validated = $request->validate(User::rules());

        $user = User::create($validated);

        return new UserResource($user);
    }

    /**
     * Menampilkan detail pengguna.
     */
    public function show(User $user): UserResource
    {
        return new UserResource(
            $user->loadCount('reservations')
        );
    }

    /**
     * Memperbarui data pengguna.
     */

    public function update(Request $request, User $user): UserResource
    {
        $validated = $request->validate(User::rules($user));

        if (array_key_exists('role', $validated)) {
            $role = $validated['role'];

            if ($role === 'mahasiswa') {
                $validated['nip'] = null;
            } elseif ($role === 'dosen') {
                $validated['nim'] = null;
            } elseif ($role === 'admin') {
                $validated['nim'] = null;
                $validated['nip'] = null;
            }
        }

        $user->update($validated);

        return new UserResource(
            $user->loadCount('reservations')
        );
    }


    /**
     * Menghapus pengguna yang belum memiliki riwayat reservasi.
     */
    public function destroy(User $user): JsonResponse
    {
        if ($user->id === Auth::id()) {
            throw ValidationException::withMessages([
                'user' => 'Anda tidak dapat menghapus akun sendiri.',
            ]);
        }

        if ($user->reservations()->exists()) {
            throw ValidationException::withMessages([
                'user' => 'Pengguna tidak dapat dihapus karena memiliki riwayat reservasi.',
            ]);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil dihapus.',
        ]);
    }
}
