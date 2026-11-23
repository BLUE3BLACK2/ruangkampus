<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReservationApiTest extends TestCase
{
    use RefreshDatabase;

    private int $counter = 0;

    private function makeUser(string $role = 'mahasiswa'): User
    {
        $this->counter++;

        return User::factory()->create([
            'role' => $role,
            'nim' => $role === 'mahasiswa' ? '24151010' . str_pad((string) $this->counter, 2, '0', STR_PAD_LEFT) : null,
            'nip' => $role === 'dosen' ? '1990010120200110' . str_pad((string) $this->counter, 2, '0', STR_PAD_LEFT) : null,
        ]);
    }

    private function makeRoom(array $override = []): Room
    {
        $this->counter++;

        return Room::create(array_merge([
            'room_code' => 'T-' . $this->counter,
            'room_name' => 'Ruang Uji ' . $this->counter,
            'building' => 'Gedung A',
            'floor' => 1,
            'capacity' => 30,
            'status' => 'available',
        ], $override));
    }

    private function futureDate(): string
    {
        return now()->addDays(10)->format('Y-m-d');
    }

    private function payload(Room $room, array $override = []): array
    {
        return array_merge([
            'room_id' => $room->id,
            'reservation_date' => $this->futureDate(),
            'start_time' => '09:00',
            'end_time' => '10:00',
            'purpose' => 'Kuliah tambahan',
            'participant_count' => 20,
        ], $override);
    }

    /** Buat reservasi langsung di database (tanpa lewat API). */
    private function makeReservation(User $user, Room $room, array $override = []): Reservation
    {
        $this->counter++;

        return Reservation::create(array_merge([
            'reservation_code' => 'RSV-TEST-' . $this->counter,
            'user_id' => $user->id,
            'room_id' => $room->id,
            'reservation_date' => $this->futureDate(),
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'purpose' => 'Uji',
            'participant_count' => 10,
            'status' => 'pending',
        ], $override));
    }

    // ---------- membuat reservasi ----------

    public function test_guest_cannot_create_reservation(): void
    {
        $room = $this->makeRoom();

        $this->postJson('/api/reservations', $this->payload($room))->assertStatus(401);
    }

    public function test_mahasiswa_can_create_pending_reservation_with_log(): void
    {
        $user = $this->makeUser('mahasiswa');
        $room = $this->makeRoom();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/reservations', $this->payload($room));

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.start_time', '09:00')
            ->assertJsonPath('data.end_time', '10:00')
            ->assertJsonPath('data.user_id', $user->id);

        $this->assertStringStartsWith('RSV-', $response->json('data.reservation_code'));

        $this->assertDatabaseHas('reservation_logs', [
            'reservation_id' => $response->json('data.id'),
            'previous_status' => null,
            'new_status' => 'pending',
        ]);
    }

    public function test_dosen_can_create_reservation(): void
    {
        $room = $this->makeRoom();
        Sanctum::actingAs($this->makeUser('dosen'));

        $this->postJson('/api/reservations', $this->payload($room))->assertCreated();
    }

    public function test_admin_cannot_create_reservation(): void
    {
        $room = $this->makeRoom();
        Sanctum::actingAs($this->makeUser('admin'));

        $this->postJson('/api/reservations', $this->payload($room))
            ->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_participants_cannot_exceed_capacity(): void
    {
        $room = $this->makeRoom(['capacity' => 10]);
        Sanctum::actingAs($this->makeUser());

        $this->postJson('/api/reservations', $this->payload($room, ['participant_count' => 11]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('participant_count');
    }

    public function test_participants_equal_to_capacity_is_allowed(): void
    {
        $room = $this->makeRoom(['capacity' => 10]);
        Sanctum::actingAs($this->makeUser());

        $this->postJson('/api/reservations', $this->payload($room, ['participant_count' => 10]))
            ->assertCreated();
    }

    public function test_end_time_must_be_after_start_time(): void
    {
        $room = $this->makeRoom();
        Sanctum::actingAs($this->makeUser());

        $this->postJson('/api/reservations', $this->payload($room, [
            'start_time' => '10:00',
            'end_time' => '09:00',
        ]))->assertStatus(422)->assertJsonValidationErrors('end_time');

        $this->postJson('/api/reservations', $this->payload($room, [
            'start_time' => '10:00',
            'end_time' => '10:00',
        ]))->assertStatus(422)->assertJsonValidationErrors('end_time');
    }

    public function test_room_must_be_available(): void
    {
        Sanctum::actingAs($this->makeUser());

        foreach (['maintenance', 'inactive'] as $status) {
            $room = $this->makeRoom(['status' => $status]);

            $this->postJson('/api/reservations', $this->payload($room))
                ->assertStatus(422)
                ->assertJsonValidationErrors('room_id');
        }
    }

    public function test_unknown_room_is_rejected(): void
    {
        Sanctum::actingAs($this->makeUser());

        $this->postJson('/api/reservations', [
            'room_id' => 99999,
            'reservation_date' => $this->futureDate(),
            'start_time' => '09:00',
            'end_time' => '10:00',
            'purpose' => 'Uji',
            'participant_count' => 5,
        ])->assertStatus(422)->assertJsonValidationErrors('room_id');
    }

    public function test_past_date_is_rejected(): void
    {
        $room = $this->makeRoom();
        Sanctum::actingAs($this->makeUser());

        $this->postJson('/api/reservations', $this->payload($room, [
            'reservation_date' => now()->subDays(2)->format('Y-m-d'),
        ]))->assertStatus(422)->assertJsonValidationErrors('reservation_date');
    }

    // ---------- bentrok jadwal ----------

    public function test_overlapping_slot_is_rejected(): void
    {
        $room = $this->makeRoom();
        $this->makeReservation($this->makeUser(), $room, [
            'start_time' => '09:00:00',
            'end_time' => '11:00:00',
        ]);

        Sanctum::actingAs($this->makeUser());

        $this->postJson('/api/reservations', $this->payload($room, [
            'start_time' => '10:00',
            'end_time' => '12:00',
        ]))->assertStatus(422)->assertJsonValidationErrors('start_time');
    }

    public function test_approved_reservation_also_blocks_the_slot(): void
    {
        $room = $this->makeRoom();
        $this->makeReservation($this->makeUser(), $room, ['status' => 'approved']);

        Sanctum::actingAs($this->makeUser());

        $this->postJson('/api/reservations', $this->payload($room))
            ->assertStatus(422)
            ->assertJsonValidationErrors('start_time');
    }

    public function test_adjacent_slots_are_allowed(): void
    {
        $room = $this->makeRoom();
        $this->makeReservation($this->makeUser(), $room, [
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
        ]);

        Sanctum::actingAs($this->makeUser());

        $this->postJson('/api/reservations', $this->payload($room, [
            'start_time' => '10:00',
            'end_time' => '11:00',
        ]))->assertCreated();
    }

    public function test_rejected_and_cancelled_do_not_block_the_slot(): void
    {
        $room = $this->makeRoom();
        $other = $this->makeUser();
        $this->makeReservation($other, $room, ['status' => 'rejected']);
        $this->makeReservation($other, $room, ['status' => 'cancelled']);

        Sanctum::actingAs($this->makeUser());

        $this->postJson('/api/reservations', $this->payload($room))->assertCreated();
    }

    public function test_same_time_in_a_different_room_is_allowed(): void
    {
        $roomA = $this->makeRoom();
        $roomB = $this->makeRoom();
        $this->makeReservation($this->makeUser(), $roomA);

        Sanctum::actingAs($this->makeUser());

        $this->postJson('/api/reservations', $this->payload($roomB))->assertCreated();
    }

    // ---------- daftar dan detail ----------

    public function test_index_lists_only_own_reservations(): void
    {
        $me = $this->makeUser();
        $other = $this->makeUser();
        $room = $this->makeRoom();

        $this->makeReservation($me, $room, ['start_time' => '08:00:00', 'end_time' => '09:00:00']);
        $this->makeReservation($me, $room, ['start_time' => '12:00:00', 'end_time' => '13:00:00']);
        $this->makeReservation($other, $room, ['start_time' => '15:00:00', 'end_time' => '16:00:00']);

        Sanctum::actingAs($me);

        $this->getJson('/api/reservations')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2);
    }

    public function test_index_can_filter_by_status(): void
    {
        $me = $this->makeUser();
        $room = $this->makeRoom();

        $this->makeReservation($me, $room, ['status' => 'pending']);
        $this->makeReservation($me, $room, [
            'status' => 'approved',
            'start_time' => '12:00:00',
            'end_time' => '13:00:00',
        ]);

        Sanctum::actingAs($me);

        $this->getJson('/api/reservations?status=approved')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'approved');
    }

    public function test_owner_can_view_detail_with_room_and_logs(): void
    {
        $me = $this->makeUser();
        $room = $this->makeRoom();
        Sanctum::actingAs($me);

        $id = $this->postJson('/api/reservations', $this->payload($room))->json('data.id');

        $this->getJson("/api/reservations/{$id}")
            ->assertOk()
            ->assertJsonPath('data.id', $id)
            ->assertJsonPath('data.room.id', $room->id)
            ->assertJsonCount(1, 'data.logs');
    }

    public function test_other_user_cannot_view_detail(): void
    {
        $reservation = $this->makeReservation($this->makeUser(), $this->makeRoom());

        Sanctum::actingAs($this->makeUser());

        $this->getJson("/api/reservations/{$reservation->id}")->assertStatus(403);
    }

    public function test_admin_can_view_any_reservation(): void
    {
        $reservation = $this->makeReservation($this->makeUser(), $this->makeRoom());

        Sanctum::actingAs($this->makeUser('admin'));

        $this->getJson("/api/reservations/{$reservation->id}")->assertOk();
    }

    // ---------- pembatalan ----------

    public function test_owner_can_cancel_pending_reservation(): void
    {
        $me = $this->makeUser();
        $reservation = $this->makeReservation($me, $this->makeRoom());
        Sanctum::actingAs($me);

        $this->patchJson("/api/reservations/{$reservation->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertDatabaseHas('reservations', ['id' => $reservation->id, 'status' => 'cancelled']);
        $this->assertDatabaseHas('reservation_logs', [
            'reservation_id' => $reservation->id,
            'previous_status' => 'pending',
            'new_status' => 'cancelled',
        ]);
    }

    public function test_owner_can_cancel_approved_reservation(): void
    {
        $me = $this->makeUser();
        $reservation = $this->makeReservation($me, $this->makeRoom(), ['status' => 'approved']);
        Sanctum::actingAs($me);

        $this->patchJson("/api/reservations/{$reservation->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_cannot_cancel_someone_elses_reservation(): void
    {
        $reservation = $this->makeReservation($this->makeUser(), $this->makeRoom());

        Sanctum::actingAs($this->makeUser());

        $this->patchJson("/api/reservations/{$reservation->id}/cancel")->assertStatus(403);
        $this->assertDatabaseHas('reservations', ['id' => $reservation->id, 'status' => 'pending']);
    }

    public function test_cannot_cancel_rejected_or_already_cancelled(): void
    {
        $me = $this->makeUser();
        $room = $this->makeRoom();
        Sanctum::actingAs($me);

        foreach (['rejected', 'cancelled'] as $i => $status) {
            $reservation = $this->makeReservation($me, $room, [
                'status' => $status,
                'start_time' => sprintf('%02d:00:00', 8 + $i * 2),
                'end_time' => sprintf('%02d:00:00', 9 + $i * 2),
            ]);

            $this->patchJson("/api/reservations/{$reservation->id}/cancel")
                ->assertStatus(422)
                ->assertJsonValidationErrors('status');
        }
    }

    public function test_cannot_cancel_a_reservation_that_already_started(): void
    {
        $me = $this->makeUser();
        $reservation = $this->makeReservation($me, $this->makeRoom(), [
            'reservation_date' => now()->subDays(2)->format('Y-m-d'),
        ]);
        Sanctum::actingAs($me);

        $this->patchJson("/api/reservations/{$reservation->id}/cancel")
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
    }

    public function test_cancelling_frees_the_slot(): void
    {
        $me = $this->makeUser();
        $room = $this->makeRoom();
        $reservation = $this->makeReservation($me, $room);

        Sanctum::actingAs($me);
        $this->patchJson("/api/reservations/{$reservation->id}/cancel")->assertOk();

        Sanctum::actingAs($this->makeUser());
        $this->postJson('/api/reservations', $this->payload($room))->assertCreated();
    }
}