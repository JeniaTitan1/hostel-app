<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Building;
use App\Models\Room;
use App\Models\Booking;
use App\Models\Ticket;
use App\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HostelImprovementsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $user;
    private Building $building;
    private Room $room;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->user = User::factory()->create(['role' => 'user']);

        $this->building = Building::create(['name' => 'Hostel Building A']);
        $this->room = Room::create([
            'building_id' => $this->building->id,
            'floor' => 1,
            'room_number' => '101',
            'max_capacity' => 2,
        ]);
    }

    public function test_user_can_update_telegram_and_phone()
    {
        $response = $this->actingAs($this->user)
            ->patch(route('profile.update'), [
                'name' => 'New Name',
                'email' => $this->user->email,
                'telegram' => '@new_student',
                'phone' => '+380991112233',
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'telegram' => '@new_student',
            'phone' => '+380991112233',
        ]);
    }

    public function test_user_can_submit_maintenance_ticket_when_settled()
    {
        // 1. Settled user
        Booking::create([
            'user_id' => $this->user->id,
            'room_id' => $this->room->id,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('tickets.store'), [
                'description' => 'Leaking faucet in bathroom',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('tickets', [
            'user_id' => $this->user->id,
            'room_id' => $this->room->id,
            'description' => 'Leaking faucet in bathroom',
            'status' => 'pending',
        ]);
    }

    public function test_user_cannot_submit_maintenance_ticket_when_not_settled()
    {
        $response = $this->actingAs($this->user)
            ->post(route('tickets.store'), [
                'description' => 'Some issue',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('error', 'Ви повинні мати активне заселення, щоб надіслати заявку!');
        $this->assertDatabaseEmpty('tickets');
    }

    public function test_admin_can_resolve_maintenance_ticket()
    {
        Booking::create([
            'user_id' => $this->user->id,
            'room_id' => $this->room->id,
            'status' => 'approved',
        ]);

        $ticket = Ticket::create([
            'user_id' => $this->user->id,
            'room_id' => $this->room->id,
            'description' => 'Broken window',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->post(route('admin.tickets.resolve', $ticket->id));

        $response->assertRedirect();
        $this->assertDatabaseHas('tickets', [
            'id' => $ticket->id,
            'status' => 'resolved',
        ]);
    }

    public function test_booking_actions_generate_audit_logs()
    {
        // User requests booking
        $this->actingAs($this->user)
            ->post(route('bookings.store'), [
                'room_id' => $this->room->id
            ]);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $this->user->id,
            'action' => 'booking_requested',
        ]);

        $booking = Booking::first();

        // Admin approves booking
        $this->actingAs($this->admin)
            ->post(route('admin.bookings.approve', $booking->id));

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $this->user->id,
            'action' => 'booking_approved',
        ]);
    }
}
