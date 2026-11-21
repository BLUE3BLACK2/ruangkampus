<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasFactory;

    public const STATUSES = ['available', 'maintenance', 'inactive'];

    protected $fillable = [
        'room_code',
        'room_name',
        'building',
        'floor',
        'capacity',
        'description',
        'image',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'floor' => 'integer',
            'capacity' => 'integer',
        ];
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function facilities()
    {
    return $this->belongsToMany(
        Facility::class,
        'room_facility',
        'room_id',
        'facility_id'
        );
    }
}
