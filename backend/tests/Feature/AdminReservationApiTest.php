<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminReservationApiTest extends TestCase
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

    private function slotPayload(Room $room): array
    {
        return [
            'room_id' => $room->id,
            'reservation_date' => $this->futureDate(),
            'start_time' => '09:00',
            'end_time' => '10:00',
            'purpose' => 'Kuliah tambahan',
            'participant_count' => 5,
        ];
    }

    // ---------- akses ----------

    public function test_guest_cannot_use_admin_endpoints(): void
    {
        $reservation = $this->makeReservation($this->makeUser(), $this->makeRoom());

        $this->getJson('/api/admin/reservations')->assertStatus(401);
        $this->patchJson("/api/admin/reservations/{$reservation->id}/approve")->assertStatus(401);
        $this->patchJson("/api/admin/reservations/{$reservation->id}/reject", ['admin_notes' => 'x'])->assertStatus(401);
    }

    public function test_non_admin_cannot_use_admin_endpoints(): void
    {
        $reservation = $this->makeReservation($this->makeUser(), $this->makeRoom());

        foreach (['mahasiswa', 'dosen'] as $role) {
            Sanctum::actingAs($this->makeUser($role));

            $this->getJson('/api/admin/reservations')->assertStatus(403);
            $this->patchJson("/api/admin/reservations/{$reservation->id}/approve")->assertStatus(403);
            $this->patchJson("/api/admin/reservations/{$reservation->id}/reject", ['admin_notes' => 'x'])->assertStatus(403);
        }

        $this->assertDatabaseHas('reservations', ['id' => $reservation->id, 'status' => 'pending']);
    }

    // ---------- daftar ----------

    public function test_admin_sees_reservations_of_all_users(): void
    {
        $this->makeReservation($this->makeUser(), $this->makeRoom());
        $this->makeReservation($this->makeUser('dosen'), $this->makeRoom());
        $this->makeReservation($this->makeUser(), $this->makeRoom());

        Sanctum::actingAs($this->makeUser('admin'));

        $this->getJson('/api/admin/reservations')
            ->assertOk()
            ->assertJsonStructure(['data', 'links', 'meta'])
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonStructure(['data' => ['*' => ['id', 'reservation_code', 'status', 'room', 'user']]]);
    }

    public function test_admin_can_filter_the_list(): void
    {
        $user = $this->makeUser();
        $roomA = $this->makeRoom();
        $roomB = $this->makeRoom();

        $this->makeReservation($user, $roomA, ['status' => 'pending', 'reservation_code' => 'RSV-CARI-001']);
        $this->makeReservation($user, $roomA, [
            'status' => 'approved',
            'start_time' => '12:00:00',
            'end_time' => '13:00:00',
        ]);
        $this->makeReservation($user, $roomB, [
            'reservation_date' => now()->addDays(20)->format('Y-m-d'),
        ]);

        Sanctum::actingAs($this->makeUser('admin'));

        $this->getJson('/api/admin/reservations?status=approved')
            ->assertOk()->assertJsonCount(1, 'data');

        $this->getJson('/api/admin/reservations?room_id=' . $roomB->id)
            ->assertOk()->assertJsonCount(1, 'data');

        $this->getJson('/api/admin/reservations?date=' . $this->futureDate())
            ->assertOk()->assertJsonCount(2, 'data');

        $this->getJson('/api/admin/reservations?search=CARI')
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.reservation_code', 'RSV-CARI-001');
    }

    // ---------- menyetujui ----------

    public function test_admin_can_approve_pending_reservation(): void
    {
        $admin = $this->makeUser('admin');
        $reservation = $this->makeReservation($this->makeUser(), $this->makeRoom());
        Sanctum::actingAs($admin);

        $this->patchJson("/api/admin/reservations/{$reservation->id}/approve", [
            'admin_notes' => 'Silakan digunakan.',
        ])->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.admin_notes', 'Silakan digunakan.')
            ->assertJsonPath('data.reviewed_by', $admin->id);

        $fresh = $reservation->fresh();
        $this->assertSame('approved', $fresh->status);
        $this->assertSame($admin->id, $fresh->reviewed_by);
        $this->assertNotNull($fresh->reviewed_at);

        $this->assertDatabaseHas('reservation_logs', [
            'reservation_id' => $reservation->id,
            'admin_id' => $admin->id,
            'previous_status' => 'pending',
            'new_status' => 'approved',
            'notes' => 'Silakan digunakan.',
        ]);
    }

    public function test_approve_notes_are_optional(): void
    {
        $reservation = $this->makeReservation($this->makeUser(), $this->makeRoom());
        Sanctum::actingAs($this->makeUser('admin'));

        $this->patchJson("/api/admin/reservations/{$reservation->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.admin_notes', null);

        $this->assertDatabaseHas('reservation_logs', [
            'reservation_id' => $reservation->id,
            'new_status' => 'approved',
            'notes' => 'Reservasi disetujui.',
        ]);
    }

    public function test_approved_reservation_keeps_blocking_the_slot(): void
    {
        $room = $this->makeRoom();
        $reservation = $this->makeReservation($this->makeUser(), $room);

        Sanctum::actingAs($this->makeUser('admin'));
        $this->patchJson("/api/admin/reservations/{$reservation->id}/approve")->assertOk();

        Sanctum::actingAs($this->makeUser());
        $this->postJson('/api/reservations', $this->slotPayload($room))
            ->assertStatus(422)
            ->assertJsonValidationErrors('start_time');
    }

    // ---------- menolak ----------

    public function test_reject_requires_notes(): void
    {
        $reservation = $this->makeReservation($this->makeUser(), $this->makeRoom());
        Sanctum::actingAs($this->makeUser('admin'));

        $this->patchJson("/api/admin/reservations/{$reservation->id}/reject")
            ->assertStatus(422)
            ->assertJsonValidationErrors('admin_notes');

        $this->assertDatabaseHas('reservations', ['id' => $reservation->id, 'status' => 'pending']);
    }

    public function test_admin_can_reject_with_notes(): void
    {
        $admin = $this->makeUser('admin');
        $reservation = $this->makeReservation($this->makeUser(), $this->makeRoom());
        Sanctum::actingAs($admin);

        $this->patchJson("/api/admin/reservations/{$reservation->id}/reject", [
            'admin_notes' => 'Ruangan dipakai kegiatan fakultas.',
        ])->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.admin_notes', 'Ruangan dipakai kegiatan fakultas.')
            ->assertJsonPath('data.reviewed_by', $admin->id);

        $this->assertNotNull($reservation->fresh()->reviewed_at);

        $this->assertDatabaseHas('reservation_logs', [
            'reservation_id' => $reservation->id,
            'admin_id' => $admin->id,
            'previous_status' => 'pending',
            'new_status' => 'rejected',
            'notes' => 'Ruangan dipakai kegiatan fakultas.',
        ]);
    }

    public function test_rejected_reservation_frees_the_slot(): void
    {
        $room = $this->makeRoom();
        $reservation = $this->makeReservation($this->makeUser(), $room);

        Sanctum::actingAs($this->makeUser('admin'));
        $this->patchJson("/api/admin/reservations/{$reservation->id}/reject", [
            'admin_notes' => 'Ditolak.',
        ])->assertOk();

        Sanctum::actingAs($this->makeUser());
        $this->postJson('/api/reservations', $this->slotPayload($room))->assertCreated();
    }

    // ---------- status yang tidak boleh diproses ----------

    public function test_cannot_process_a_reservation_that_is_not_pending(): void
    {
        $owner = $this->makeUser();
        Sanctum::actingAs($this->makeUser('admin'));

        foreach (['approved', 'rejected', 'cancelled'] as $status) {
            $reservation = $this->makeReservation($owner, $this->makeRoom(), ['status' => $status]);

            $this->patchJson("/api/admin/reservations/{$reservation->id}/approve")
                ->assertStatus(422)
                ->assertJsonValidationErrors('status');

            $this->patchJson("/api/admin/reservations/{$reservation->id}/reject", ['admin_notes' => 'x'])
                ->assertStatus(422)
                ->assertJsonValidationErrors('status');

            $this->assertDatabaseHas('reservations', ['id' => $reservation->id, 'status' => $status]);
        }
    }

    public function test_admin_cannot_approve_after_the_owner_cancelled(): void
    {
        $owner = $this->makeUser();
        $reservation = $this->makeReservation($owner, $this->makeRoom());

        Sanctum::actingAs($owner);
        $this->patchJson("/api/reservations/{$reservation->id}/cancel")->assertOk();

        Sanctum::actingAs($this->makeUser('admin'));
        $this->patchJson("/api/admin/reservations/{$reservation->id}/approve")
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');

        $this->assertDatabaseHas('reservations', ['id' => $reservation->id, 'status' => 'cancelled']);
    }
}