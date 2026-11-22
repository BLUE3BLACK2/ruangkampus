<?php

namespace Tests\Feature;

use App\Http\Controllers\RoomController;
use App\Models\Facility;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * routes/api.php belongs to the auth owner, so the endpoints under test are
 * registered here with the same paths, verbs, and middleware the handover
 * document asks for. Testing the controllers does not require editing that file.
 */
class RoomApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('api')->prefix('api')->group(function () {
            Route::get('rooms', [RoomController::class, 'index']);
            Route::get('rooms/{room}', [RoomController::class, 'show']);

            Route::middleware(['auth:sanctum', 'admin'])->group(function () {
                Route::get('admin/rooms', [RoomController::class, 'adminIndex']);
                Route::post('rooms', [RoomController::class, 'store']);
                Route::match(['put', 'patch'], 'rooms/{room}', [RoomController::class, 'update']);
                Route::delete('rooms/{room}', [RoomController::class, 'destroy']);
            });
        });
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

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function payload(array $attrs = []): array
    {
        return array_merge([
            'room_code' => 'GD-301',
            'room_name' => 'Ruang Kuliah 301',
            'building' => 'Gedung D',
            'floor' => 3,
            'capacity' => 45,
            'description' => 'Ruang kelas.',
            'status' => 'available',
        ], $attrs);
    }

    public function test_guest_can_list_rooms_with_facilities(): void
    {
        $room = $this->room(['room_code' => 'AUD-1']);
        $room->facilities()->attach(Facility::create(['name' => 'Proyektor'])->id);

        $response = $this->getJson('/api/rooms');

        $response->assertOk()
            ->assertJsonPath('data.0.room_code', 'AUD-1')
            ->assertJsonPath('data.0.facilities.0.name', 'Proyektor')
            ->assertJsonStructure(['data', 'links', 'meta']);
    }

    public function test_list_search_matches_code_name_and_building(): void
    {
        $this->room(['room_code' => 'LAB-KOM', 'room_name' => 'Lab Komputer', 'building' => 'Gedung B']);
        $this->room(['room_code' => 'R-101', 'room_name' => 'Ruang Kelas', 'building' => 'Gedung A']);

        $this->getJson('/api/rooms?search=Lab')->assertJsonCount(1, 'data');
        $this->getJson('/api/rooms?search=Gedung%20A')->assertJsonCount(1, 'data');
        $this->getJson('/api/rooms?search=R-101')->assertJsonCount(1, 'data');
    }

    public function test_list_filters_by_status_and_min_capacity(): void
    {
        $this->room(['status' => 'maintenance', 'capacity' => 10]);
        $this->room(['status' => 'available', 'capacity' => 200]);

        $this->getJson('/api/rooms?status=maintenance')->assertJsonCount(1, 'data');
        $this->getJson('/api/rooms?min_capacity=50')->assertJsonCount(1, 'data');
        $this->getJson('/api/rooms?status=nope')->assertStatus(422);
    }

    public function test_guest_can_view_one_room(): void
    {
        $room = $this->room();

        $this->getJson("/api/rooms/{$room->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $room->id);
    }

    public function test_admin_list_matches_the_public_shape_and_allows_status_filter(): void
    {
        $this->room(['status' => 'maintenance']);
        Sanctum::actingAs($this->admin());

        $this->getJson('/api/admin/rooms?status=maintenance')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonStructure(['data', 'links', 'meta']);
    }

    public function test_non_admin_cannot_reach_the_admin_room_list(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'mahasiswa']));

        $this->getJson('/api/admin/rooms')->assertForbidden();
    }

    public function test_missing_room_returns_404(): void
    {
        $this->getJson('/api/rooms/999')->assertNotFound();
    }

    public function test_guest_cannot_create_room(): void
    {
        $this->postJson('/api/rooms', $this->payload())->assertUnauthorized();
        $this->assertDatabaseCount('rooms', 0);
    }

    public function test_non_admin_cannot_create_room(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'mahasiswa']));

        $this->postJson('/api/rooms', $this->payload())->assertForbidden();
        $this->assertDatabaseCount('rooms', 0);
    }

    public function test_admin_can_create_room_with_facilities(): void
    {
        $facility = Facility::create(['name' => 'AC']);
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/rooms', $this->payload([
            'room_code' => 'GD-301',
            'facilities' => [$facility->id],
        ]))
            ->assertCreated()
            ->assertJsonPath('data.room_code', 'GD-301')
            ->assertJsonPath('data.facilities.0.name', 'AC');

        $this->assertDatabaseHas('rooms', ['room_code' => 'GD-301']);
        $this->assertDatabaseHas('room_facility', ['facility_id' => $facility->id]);
    }

    public function test_room_code_must_be_unique(): void
    {
        $this->room(['room_code' => 'GD-301']);
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/rooms', $this->payload(['room_code' => 'GD-301']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('room_code');
    }

    public function test_capacity_must_be_at_least_one(): void
    {
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/rooms', $this->payload(['capacity' => 0]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('capacity');
    }

    public function test_status_outside_the_enum_is_rejected(): void
    {
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/rooms', $this->payload(['status' => 'unavailable']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
    }

    public function test_unknown_facility_is_rejected(): void
    {
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/rooms', $this->payload(['facilities' => [999]]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('facilities.0');
    }

    public function test_duplicate_facility_ids_are_rejected(): void
    {
        $facility = Facility::create(['name' => 'AC']);
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/rooms', $this->payload(['facilities' => [$facility->id, $facility->id]]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('facilities.1');
    }

    public function test_admin_can_update_room_and_replace_facilities(): void
    {
        $room = $this->room(['room_code' => 'GD-301']);
        $old = Facility::create(['name' => 'Whiteboard']);
        $new = Facility::create(['name' => 'Sound System']);
        $room->facilities()->attach($old->id);
        Sanctum::actingAs($this->admin());

        $this->putJson("/api/rooms/{$room->id}", [
            'room_name' => 'Ruang Kuliah 301 Baru',
            'facilities' => [$new->id],
        ])
            ->assertOk()
            ->assertJsonPath('data.room_name', 'Ruang Kuliah 301 Baru')
            ->assertJsonPath('data.facilities.0.name', 'Sound System');

        $this->assertDatabaseMissing('room_facility', ['facility_id' => $old->id]);
    }

    public function test_update_keeps_facilities_when_the_key_is_absent(): void
    {
        $room = $this->room();
        $facility = Facility::create(['name' => 'AC']);
        $room->facilities()->attach($facility->id);
        Sanctum::actingAs($this->admin());

        $this->putJson("/api/rooms/{$room->id}", ['room_name' => 'Nama Baru'])->assertOk();

        $this->assertDatabaseHas('room_facility', ['facility_id' => $facility->id]);
    }

    public function test_update_ignores_its_own_room_code(): void
    {
        $room = $this->room(['room_code' => 'GD-301']);
        Sanctum::actingAs($this->admin());

        $this->putJson("/api/rooms/{$room->id}", ['room_code' => 'GD-301'])->assertOk();
    }

    public function test_non_admin_cannot_delete_room(): void
    {
        $room = $this->room();
        Sanctum::actingAs(User::factory()->create(['role' => 'dosen']));

        $this->deleteJson("/api/rooms/{$room->id}")->assertForbidden();
        $this->assertDatabaseHas('rooms', ['id' => $room->id]);
    }

    public function test_admin_can_delete_room_without_reservations(): void
    {
        $room = $this->room();
        $room->facilities()->attach(Facility::create(['name' => 'AC'])->id);
        Sanctum::actingAs($this->admin());

        $this->deleteJson("/api/rooms/{$room->id}")->assertOk()->assertExactJson(['data' => null]);

        $this->assertDatabaseMissing('rooms', ['id' => $room->id]);
        $this->assertDatabaseCount('room_facility', 0);
    }

    public function test_room_with_reservations_cannot_be_deleted(): void
    {
        $room = $this->room();
        Reservation::create([
            'reservation_code' => 'RSV-1',
            'user_id' => User::factory()->create()->id,
            'room_id' => $room->id,
            'reservation_date' => '2026-12-01',
            'start_time' => '08:00',
            'end_time' => '10:00',
            'purpose' => 'Uji',
            'participant_count' => 5,
            'status' => 'pending',
        ]);
        Sanctum::actingAs($this->admin());

        $this->deleteJson("/api/rooms/{$room->id}")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Ruangan masih punya riwayat pengajuan.');

        $this->assertDatabaseHas('rooms', ['id' => $room->id]);
    }
}
