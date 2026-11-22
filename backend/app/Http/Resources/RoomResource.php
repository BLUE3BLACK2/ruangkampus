<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'room_code' => $this->room_code,
            'room_name' => $this->room_name,
            'building' => $this->building,
            'floor' => $this->floor,
            'capacity' => $this->capacity,
            'description' => $this->description,
            'image' => $this->image,
            'status' => $this->status,
            'facilities' => FacilityResource::collection($this->whenLoaded('facilities')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
