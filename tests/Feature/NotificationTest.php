<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Building;
use App\Models\Room;
use App\Models\Booking;
use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $student;
    private Building $building;
    private Room $room1;
    private Room $room2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->student = User::factory()->create(['role' => 'user', 'gender' => 'male']);

        $this->building = Building::create(['name' => 'Hostel Building A']);
        
        $this->room1 = Room::create([
            'building_id' => $this->building->id,
            'floor' => 1,
            'room_number' => '101',
            'max_capacity' => 2,
        ]);

        $this->room2 = Room::create([
            'building_id' => $this->building->id,
            'floor' => 1,
            'room_number' => '102',
            'max_capacity' => 2,
        ]);
    }

    public function test_manual_checkin_creates_notification()
    {
        $response = $this->actingAs($this->admin)
            ->post(route('admin.bookings.manual'), [
                'user_id' => $this->student->id,
                'room_id' => $this->room1->id,
            ]);

        $response->assertRedirect();
        
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->student->id,
            'title' => 'Заселення',
            'message' => "Адміністратор заселив вас до кімнати №101 (Hostel Building A).",
        ]);
    }

    public function test_booking_approval_creates_notification()
    {
        $booking = Booking::create([
            'user_id' => $this->student->id,
            'room_id' => $this->room1->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->post(route('admin.bookings.approve', $booking->id));

        $response->assertRedirect();
        
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->student->id,
            'title' => 'Заявку на заселення схвалено',
            'message' => "Вашу заявку на заселення до кімнати №101 схвалено.",
        ]);
    }

    public function test_booking_rejection_creates_notification()
    {
        $booking = Booking::create([
            'user_id' => $this->student->id,
            'room_id' => $this->room1->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)
            ->post(route('admin.bookings.reject', $booking->id), [
                'rejection_reason' => 'Недостатньо документів',
            ]);

        $response->assertRedirect();
        
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->student->id,
            'title' => 'Заявку на заселення відхилено',
            'message' => "Вашу заявку на заселення до кімнати №101 відхилено. Причина: Недостатньо документів.",
        ]);
    }

    public function test_reallocation_creates_notification()
    {
        $booking = Booking::create([
            'user_id' => $this->student->id,
            'room_id' => $this->room1->id,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->admin)
            ->post(route('admin.bookings.reallocate', $booking->id), [
                'room_id' => $this->room2->id,
                'reason' => 'Плановий ремонт',
            ]);

        $response->assertRedirect();
        
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->student->id,
            'title' => 'Переселення',
            'message' => "Адміністратор переселив вас з кімнати №101 до кімнати №102 (Hostel Building A). Причина: Плановий ремонт.",
        ]);
    }

    public function test_eviction_creates_notification()
    {
        $booking = Booking::create([
            'user_id' => $this->student->id,
            'room_id' => $this->room1->id,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->admin)
            ->post(route('admin.bookings.delete', $booking->id));

        $response->assertRedirect();
        
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->student->id,
            'title' => 'Виселення',
            'message' => "Вас виселено з кімнати №101.",
        ]);
    }

    public function test_user_can_read_and_clear_notifications()
    {
        $notif1 = Notification::create([
            'user_id' => $this->student->id,
            'title' => 'Test 1',
            'message' => 'Message 1',
        ]);

        $notif2 = Notification::create([
            'user_id' => $this->student->id,
            'title' => 'Test 2',
            'message' => 'Message 2',
        ]);

        // Dismiss single notification
        $response = $this->actingAs($this->student)
            ->post(route('notifications.read', $notif1->id));

        $response->assertRedirect();
        $this->assertDatabaseMissing('notifications', ['id' => $notif1->id]);
        $this->assertDatabaseHas('notifications', ['id' => $notif2->id]);

        // Clear all notifications
        $response = $this->actingAs($this->student)
            ->post(route('notifications.readAll'));

        $response->assertRedirect();
        $this->assertDatabaseMissing('notifications', ['id' => $notif2->id]);
    }

    public function test_admin_receives_pending_tickets_and_bookings_as_notifications()
    {
        // 1. Create a pending support ticket
        \App\Models\Ticket::create([
            'user_id' => $this->student->id,
            'room_id' => $this->room1->id,
            'description' => 'Не працює душ',
            'status' => 'pending',
        ]);

        // 2. Create a pending booking request
        Booking::create([
            'user_id' => $this->student->id,
            'room_id' => $this->room1->id,
            'status' => 'pending',
        ]);

        // 3. Make a request as admin to check Inertia shared props
        $response = $this->actingAs($this->admin)
            ->get(route('admin.dashboard'));

        $response->assertOk();

        // 4. Assert that the notifications are shared in Inertia props
        $sharedNotifications = $response->original->getData()['page']['props']['auth']['notifications'] ?? [];
        $this->assertCount(2, $sharedNotifications);

        $titles = collect($sharedNotifications)->pluck('title');
        $this->assertTrue($titles->contains('Нове звернення в підтримку'));
        $this->assertTrue($titles->contains('Заявка на заселення'));
    }
}
