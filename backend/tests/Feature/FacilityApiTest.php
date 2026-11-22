<?php

namespace Tests\Feature;

use App\Http\Controllers\FacilityController;
use App\Models\Facility;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FacilityApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('api')->prefix('api')->group(function () {
            Route::get('facilities', [FacilityController::class, 'index']);

            Route::middleware(['auth:sanctum', 'admin'])->group(function () {
                Route::get('facilities/{facility}', [FacilityController::class, 'show']);
                Route::post('facilities', [FacilityController::class, 'store']);
                Route::match(['put', 'patch'], 'facilities/{facility}', [FacilityController::class, 'update']);
                Route::delete('facilities/{facility}', [FacilityController::class, 'destroy']);
                Route::put('facilities/{facility}/rooms', [FacilityController::class, 'syncRooms']);
            });
        });
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function room(array $attrs = []): Room
    {
        return Room::create(array_merge([
            'room_code' => 'R-'.fake()->unique()->numerify('###'),
            'room_name' => 'Ruang Uji',
            'building' => 'Gedung A',
            'floor' => 1,
            'capacity' => 40,
            'status' => 'available',
        ], $attrs));
    }

    public function test_guest_can_list_facilities_with_room_count(): void
    {
        $facility = Facility::create(['name' => 'AC']);
        $facility->rooms()->attach($this->room()->id);

        $this->getJson('/api/facilities')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'AC')
            ->assertJsonPath('data.0.rooms_count', 1);
    }

    public function test_list_search_filters_by_name(): void
    {
        Facility::create(['name' => 'Proyektor']);
        Facility::create(['name' => 'AC']);

        $this->getJson('/api/facilities?search=Proyek')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_guest_cannot_create_facility(): void
    {
        $this->postJson('/api/facilities', ['name' => 'AC'])->assertUnauthorized();
        $this->assertDatabaseCount('facilities', 0);
    }

    public function test_admin_can_create_facility(): void
    {
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/facilities', ['name' => 'Proyektor', 'description' => 'Proyektor presentasi'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Proyektor');

        $this->assertDatabaseHas('facilities', ['name' => 'Proyektor']);
    }

    public function test_facility_name_must_be_unique(): void
    {
        Facility::create(['name' => 'AC']);
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/facilities', ['name' => 'AC'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    public function test_admin_can_update_facility_and_reuse_its_own_name(): void
    {
        $facility = Facility::create(['name' => 'AC']);
        Sanctum::actingAs($this->admin());

        $this->putJson("/api/facilities/{$facility->id}", ['name' => 'AC', 'description' => 'Pendingin'])
            ->assertOk()
            ->assertJsonPath('data.description', 'Pendingin');
    }

    public function test_non_admin_cannot_update_facility(): void
    {
        $facility = Facility::create(['name' => 'AC']);
        Sanctum::actingAs(User::factory()->create(['role' => 'mahasiswa']));

        $this->putJson("/api/facilities/{$facility->id}", ['name' => 'AC Baru'])->assertForbidden();
        $this->assertDatabaseHas('facilities', ['name' => 'AC']);
    }

    public function test_admin_can_delete_facility_without_touching_rooms(): void
    {
        $room = $this->room();
        $facility = Facility::create(['name' => 'AC']);
        $room->facilities()->attach($facility->id);
        Sanctum::actingAs($this->admin());

        $this->deleteJson("/api/facilities/{$facility->id}")->assertOk();

        $this->assertDatabaseMissing('facilities', ['id' => $facility->id]);
        $this->assertDatabaseMissing('room_facility', ['facility_id' => $facility->id]);
        $this->assertDatabaseHas('rooms', ['id' => $room->id]);
    }

    public function test_admin_can_replace_the_rooms_holding_a_facility(): void
    {
        $facility = Facility::create(['name' => 'AC']);
        $keep = $this->room();
        $drop = $this->room();
        $facility->rooms()->attach([$keep->id, $drop->id]);
        Sanctum::actingAs($this->admin());

        $this->putJson("/api/facilities/{$facility->id}/rooms", ['rooms' => [$keep->id]])
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->assertDatabaseHas('room_facility', ['facility_id' => $facility->id, 'room_id' => $keep->id]);
        $this->assertDatabaseMissing('room_facility', ['facility_id' => $facility->id, 'room_id' => $drop->id]);
    }

    public function test_sync_rejects_duplicate_and_unknown_rooms(): void
    {
        $facility = Facility::create(['name' => 'AC']);
        $room = $this->room();
        Sanctum::actingAs($this->admin());

        $this->putJson("/api/facilities/{$facility->id}/rooms", ['rooms' => [$room->id, $room->id]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('rooms.1');

        $this->putJson("/api/facilities/{$facility->id}/rooms", ['rooms' => [999]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('rooms.0');
    }
}
