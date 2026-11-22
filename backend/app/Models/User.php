<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Validation\Rule;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLES = ['admin', 'mahasiswa', 'dosen'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'nim',
        'nip',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function reviewedReservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'reviewed_by');
    }

    public function reservationLogs(): HasMany
    {
        return $this->hasMany(ReservationLog::class, 'admin_id');
    }

    /**
     * Identity rules, one source for create and update.
     * Mahasiswa owns a NIM, dosen owns a NIP, admin owns neither.
     * Pass the existing model on update so its own row is not a unique clash.
     *
     * @return array<string, mixed>
     */
    public static function rules(?self $user = null): array
    {
        $required = $user ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:255'],
            'email' => [
                $required,
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user?->id),
            ],
            'password' => $user
                ? ['sometimes', 'string', 'min:8', 'confirmed']
                : ['required', 'string', 'min:8', 'confirmed'],
            'role' => [$required, Rule::in(self::ROLES)],
            'nim' => [
                'nullable',
                'string',
                'max:20',
                'required_if:role,mahasiswa',
                Rule::unique('users', 'nim')->ignore($user?->id),
            ],
            'nip' => [
                'nullable',
                'string',
                'max:20',
                'required_if:role,dosen',
                Rule::unique('users', 'nip')->ignore($user?->id),
            ],
        ];
    }
}
