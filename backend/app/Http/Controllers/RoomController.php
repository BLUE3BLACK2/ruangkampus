<?php

namespace App\Http\Controllers;

use App\Http\Resources\RoomResource;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoomController extends Controller
{
    /** Query rules shared by the public list and the admin list. */
    private function indexRules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(Room::STATUSES)],
            'min_capacity' => ['nullable', 'integer', 'between:1,1000'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
        ];
    }

    private function indexQuery(Request $request, bool $public = false)
    {
        $validated = $request->validate($this->indexRules());

        return Room::query()
            ->with('facilities')
            ->when($public, fn ($q) => $q->where('status', 'available'))
            ->when(filled($validated['search'] ?? null), function ($query) use ($validated) {
                $term = '%'.$validated['search'].'%';
                $query->where(fn ($q) => $q
                    ->where('room_code', 'like', $term)
                    ->orWhere('room_name', 'like', $term)
                    ->orWhere('building', 'like', $term));
            })
            ->when(filled($validated['status'] ?? null),
                fn ($q) => $q->where('status', $validated['status']))
            ->when(filled($validated['min_capacity'] ?? null),
                fn ($q) => $q->where('capacity', '>=', $validated['min_capacity']))
            ->latest('id')
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();
    }

    /** Public catalog. Only rooms a visitor may see at all. */
    public function index(Request $request)
    {
        return RoomResource::collection($this->indexQuery($request, true));
    }

    /** Admin list. Same shape, so one component can render both. */
    public function adminIndex(Request $request)
    {
        return RoomResource::collection($this->indexQuery($request));
    }

    public function show(Room $room): RoomResource
    {
        return RoomResource::make($room->load('facilities'));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());
        $facilityIds = $validated['facilities'] ?? [];
        unset($validated['facilities']);

        $room = Room::create($validated);
        $room->facilities()->sync($facilityIds);

        return RoomResource::make($room->load('facilities'))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Room $room): RoomResource
    {
        $validated = $request->validate($this->rules($room));
        unset($validated['facilities']);

        $room->update($validated);

        if ($request->has('facilities')) {
            $room->facilities()->sync($request->input('facilities') ?? []);
        }

        return RoomResource::make($room->load('facilities'));
    }

    /**
     * Reservations restrict the delete at the database level, so the check runs
     * here first: a refused delete answers 422, never a raw 500.
     */
    public function destroy(Room $room): JsonResponse
    {
        if ($room->reservations()->exists()) {
            return response()->json([
                'message' => 'Ruangan masih punya riwayat pengajuan.',
            ], 422);
        }

        $room->facilities()->detach();
        $room->delete();

        return response()->json(['data' => null]);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?Room $room = null): array
    {
        $required = $room ? 'sometimes' : 'required';

        return [
            'room_code' => [
                $required,
                'string',
                'max:20',
                Rule::unique('rooms', 'room_code')->ignore($room?->id),
            ],
            'room_name' => [$required, 'string', 'max:255'],
            'building' => [$required, 'string', 'max:255'],
            'floor' => ['nullable', 'integer', 'between:0,255'],
            'capacity' => [$required, 'integer', 'between:1,1000'],
            'description' => ['nullable', 'string', 'max:5000'],
            'image' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::in(Room::STATUSES)],
            'facilities' => ['sometimes', 'array', 'max:50'],
            'facilities.*' => ['integer', 'distinct', 'exists:facilities,id'],
        ];
    }
}
