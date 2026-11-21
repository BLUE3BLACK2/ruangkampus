<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\Reservation;
use App\Models\ReservationLog;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The overlap rule is the one piece of business logic the database cannot
 * enforce, so it is the one piece that needs a test.
 */
class ReservationOverlapTest extends TestCase
{
    use RefreshDatabase;

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

    private function reservation(Room $room, string $start, string $end, string $status = 'pending'): Reservation
    {
        static $n = 0;

        return Reservation::create([
            'reservation_code' => 'RSV-'.++$n,
            'user_id' => User::factory()->create()->id,
            'room_id' => $room->id,
            'reservation_date' => '2026-12-01',
            'start_time' => $start,
            'end_time' => $end,
            'purpose' => 'Uji bentrok',
            'participant_count' => 10,
            'status' => $status,
        ]);
    }

    public function test_same_room_same_date_overlapping_is_blocked(): void
    {
        $room = $this->room();
        $this->reservation($room, '08:00', '10:00');

        $this->assertTrue(Reservation::slotTaken($room->id, '2026-12-01', '09:00', '11:00'));
    }

    public function test_different_date_does_not_conflict(): void
    {
        $room = $this->room();
        $this->reservation($room, '08:00', '10:00');

        $this->assertFalse(Reservation::slotTaken($room->id, '2026-12-02', '09:00', '11:00'));
    }

    public function test_different_room_does_not_conflict(): void
    {
        $room = $this->room();
        $other = $this->room();
        $this->reservation($room, '08:00', '10:00');

        $this->assertFalse(Reservation::slotTaken($other->id, '2026-12-01', '09:00', '11:00'));
    }

    public function test_rejected_and_cancelled_do_not_block(): void
    {
        $room = $this->room();
        $this->reservation($room, '08:00', '10:00', 'rejected');
        $this->reservation($room, '10:00', '12:00', 'cancelled');

        $this->assertFalse(Reservation::slotTaken($room->id, '2026-12-01', '09:00', '11:00'));
    }

    public function test_approved_blocks_same_as_pending(): void
    {
        $room = $this->room();
        $this->reservation($room, '08:00', '10:00', 'approved');

        $this->assertTrue(Reservation::slotTaken($room->id, '2026-12-01', '09:00', '11:00'));
    }

    public function test_adjacent_slots_do_not_conflict(): void
    {
        $room = $this->room();
        $this->reservation($room, '08:00', '10:00');

        $this->assertFalse(Reservation::slotTaken($room->id, '2026-12-01', '10:00', '12:00'));
        $this->assertFalse(Reservation::slotTaken($room->id, '2026-12-01', '07:00', '08:00'));
    }

    public function test_row_does_not_collide_with_itself_on_update(): void
    {
        $room = $this->room();
        $existing = $this->reservation($room, '08:00', '10:00');

        $this->assertFalse(
            Reservation::slotTaken($room->id, '2026-12-01', '08:00', '10:00', $existing->id)
        );
    }

    public function test_log_records_previous_and_new_status(): void
    {
        $room = $this->room();
        $reservation = $this->reservation($room, '08:00', '10:00');
        $admin = User::factory()->create(['role' => 'admin']);

        $reservation->logStatus(null, null, 'Diajukan.');

        $reservation->status = 'approved';
        $reservation->admin_notes = 'Disetujui.';
        $reservation->save();
        $reservation->logStatus('pending', $admin, 'Disetujui.');

        $logs = ReservationLog::where('reservation_id', $reservation->id)->orderBy('id')->get();

        $this->assertCount(2, $logs);
        $this->assertNull($logs[0]->previous_status);
        $this->assertSame('pending', $logs[0]->new_status);
        $this->assertNull($logs[0]->admin_id);
        $this->assertSame('pending', $logs[1]->previous_status);
        $this->assertSame('approved', $logs[1]->new_status);
        $this->assertSame($admin->id, $logs[1]->admin_id);
    }

    public function test_relations_resolve(): void
    {
        $room = $this->room();
        $facility = Facility::create(['name' => 'Proyektor-'.fake()->unique()->numerify('###')]);
        $room->facilities()->attach($facility->id);

        $reservation = $this->reservation($room, '08:00', '10:00');

        $this->assertTrue($reservation->user->is($reservation->user));
        $this->assertTrue($reservation->room->is($room));
        $this->assertTrue($room->facilities->first()->is($facility));
        $this->assertTrue($facility->rooms->first()->is($room));
        $this->assertCount(1, $room->reservations);
        $this->assertCount(1, $reservation->user->reservations);
    }
}
