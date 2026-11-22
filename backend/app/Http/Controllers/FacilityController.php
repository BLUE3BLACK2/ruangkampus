<?php

namespace App\Http\Controllers;

use App\Http\Resources\FacilityResource;
use App\Http\Resources\RoomResource;
use App\Models\Facility;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FacilityController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
        ]);

        $facilities = Facility::query()
            ->withCount('rooms')
            ->when(filled($validated['search'] ?? null), function ($query) use ($validated) {
                $term = '%'.$validated['search'].'%';
                $query->where(fn ($q) => $q
                    ->where('name', 'like', $term)
                    ->orWhere('description', 'like', $term));
            })
            ->orderBy('name')
            ->paginate($validated['per_page'] ?? 50)
            ->withQueryString();

        return FacilityResource::collection($facilities);
    }

    public function show(Facility $facility): FacilityResource
    {
        return FacilityResource::make($facility->loadCount('rooms'));
    }

    public function store(Request $request): JsonResponse
    {
        $facility = Facility::create($request->validate($this->rules()));

        return FacilityResource::make($facility->loadCount('rooms'))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Facility $facility): FacilityResource
    {
        $facility->update($request->validate($this->rules($facility)));

        return FacilityResource::make($facility->loadCount('rooms'));
    }

    /**
     * Deleting a facility drops only its pivot rows. Rooms and reservations
     * are untouched, so no relation check is needed here.
     */
    public function destroy(Facility $facility): JsonResponse
    {
        $facility->rooms()->detach();
        $facility->delete();

        return response()->json(['data' => null]);
    }

    /** Replace the facility list of one room. Same call the room endpoints use. */
    public function syncRooms(Request $request, Facility $facility)
    {
        $validated = $request->validate([
            'rooms' => ['present', 'array', 'max:200'],
            'rooms.*' => ['integer', 'distinct', 'exists:rooms,id'],
        ]);

        $facility->rooms()->sync($validated['rooms']);

        return RoomResource::collection(
            $facility->rooms()->with('facilities')->orderBy('room_code')->get()
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?Facility $facility = null): array
    {
        $required = $facility ? 'sometimes' : 'required';

        return [
            'name' => [
                $required,
                'string',
                'max:100',
                Rule::unique('facilities', 'name')->ignore($facility?->id),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
