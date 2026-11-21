<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reservation extends Model
{
    use HasFactory;

    public const STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

    /** Statuses that occupy a room's time slot. */
    public const BLOCKING_STATUSES = ['pending', 'approved'];

    protected $fillable = [
        'reservation_code',
        'user_id',
        'room_id',
        'reservation_date',
        'start_time',
        'end_time',
        'purpose',
        'participant_count',
        'status',
        'admin_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'reservation_date' => 'date',
            'participant_count' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(ReservationLog::class);
    }

    /** Reservations on a given date that overlap [start, end) for a room. */
    public function scopeOverlapping(Builder $query, int $roomId, string $date, string $start, string $end): Builder
    {
        return $query->where('room_id', $roomId)
            ->whereDate('reservation_date', $date)
            ->whereIn('status', self::BLOCKING_STATUSES)
            ->where('start_time', '<', $end)
            ->where('end_time', '>', $start);
    }
}
