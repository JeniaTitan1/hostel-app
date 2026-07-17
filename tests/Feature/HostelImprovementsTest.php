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

    public function test_user_is_redirected_to_profile_when_must_change_password_is_true()
    {
        $this->user->update([
            'must_change_password' => true,
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('dashboard'));

        $response->assertRedirect(route('profile.edit'));
        $response->assertSessionHas('error');
    }

    public function test_enforcement_is_cleared_after_password_and_profile_updates()
    {
        $this->user->update([
            'name' => 'Temporary Student #1234',
            'email' => 'student1234@mnau.edu.ua',
            'must_change_password' => true,
            'password_changed' => false,
            'telegram' => null,
            'phone' => null,
        ]);

        // 1. Update password
        $response = $this->actingAs($this->user)
            ->put(route('password.update'), [
                'current_password' => 'password',
                'password' => 'new_password123',
                'password_confirmation' => 'new_password123',
            ]);

        $response->assertSessionHasNoErrors();
        $this->user->refresh();
        $this->assertTrue($this->user->password_changed);
        // still true because profile details (name, email, phone, telegram) are not completed
        $this->assertTrue($this->user->must_change_password);

        // 2. Update profile information (changing email to a custom non-temp one, telegram is optional)
        $response = $this->actingAs($this->user)
            ->patch(route('profile.update'), [
                'name' => 'Олексій Коваленко',
                'email' => 'oleksiy@personal.com',
                'telegram' => null,
                'phone' => '+380998887766',
            ]);

        $response->assertSessionHasNoErrors();
        $this->user->refresh();
        // now must be false because password, name, email changed and phone filled (telegram is optional)
        $this->assertFalse($this->user->must_change_password);
    }

    public function test_admin_can_generate_batch_of_users()
    {
        $response = $this->actingAs($this->admin)
            ->post(route('admin.users.generate'), [
                'count' => 5,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('generated_users');

        $this->assertEquals(5, User::where('role', 'user')->where('must_change_password', true)->count());
    }

    public function test_admin_can_clear_audit_logs()
    {
        // 1. Create a mock audit log entry
        AuditLog::log($this->user->id, 'mock_action', 'Mock log details');

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'mock_action',
        ]);

        // 2. Perform truncation
        $response = $this->actingAs($this->admin)
            ->post(route('admin.audit-logs.clear'));

        $response->assertRedirect();
        
        // table is truncated and a new entry logs_cleared is created
        $this->assertEquals(1, AuditLog::count());
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'logs_cleared',
        ]);
    }

    public function test_admin_can_update_system_settings()
    {
        $response = $this->actingAs($this->admin)
            ->post(route('admin.settings.update'), [
                'min_beds_per_room' => 2,
                'max_beds_per_room' => 8,
                'global_intake_closed' => true,
            ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $this->assertEquals('2', \App\Models\Setting::get('min_beds_per_room'));
        $this->assertEquals('8', \App\Models\Setting::get('max_beds_per_room'));
        $this->assertEquals('1', \App\Models\Setting::get('global_intake_closed'));
    }

    public function test_booking_creation_fails_when_global_intake_is_closed()
    {
        // 1. Close global intake
        \App\Models\Setting::set('global_intake_closed', '1');

        $building = \App\Models\Building::create(['name' => 'Test Building #99']);
        $room = \App\Models\Room::create([
            'building_id' => $building->id,
            'room_number' => '999',
            'floor' => 1,
            'max_capacity' => 4,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('bookings.store'), [
                'room_id' => $room->id,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('error', 'Подача нових заявок на заселення тимчасово закрита адміністрацією.');
    }
}
