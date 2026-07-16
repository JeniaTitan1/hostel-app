<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Building;
use App\Models\Room;
use App\Models\Booking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $user1;
    private User $user2;
    private Building $building;
    private Room $room1;
    private Room $room2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->user1 = User::factory()->create(['role' => 'user']);
        $this->user2 = User::factory()->create(['role' => 'user']);

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
            'max_capacity' => 1,
        ]);
    }

    public function test_user_can_submit_booking_application()
    {
        $response = $this->actingAs($this->user1)
            ->post(route('bookings.store'), [
                'room_id' => $this->room1->id
            ]);

        $response->assertRedirect();
        
        $this->assertDatabaseHas('bookings', [
            'user_id' => $this->user1->id,
            'room_id' => $this->room1->id,
            'status' => 'pending'
        ]);
    }

    public function test_user_cannot_book_room_if_already_has_pending_application()
    {
        Booking::create([
            'user_id' => $this->user1->id,
            'room_id' => $this->room1->id,
            'status' => 'pending'
        ]);

        $response = $this->actingAs($this->user1)
            ->post(route('bookings.store'), [
                'room_id' => $this->room2->id
            ]);

        $response->assertSessionHas('error', 'У вас вже є заявка на розгляді!');
        $this->assertDatabaseMissing('bookings', [
            'user_id' => $this->user1->id,
            'room_id' => $this->room2->id
        ]);
    }

    public function test_user_can_submit_relocation_request_if_booking_approved()
    {
        $booking = Booking::create([
            'user_id' => $this->user1->id,
            'room_id' => $this->room1->id,
            'status' => 'approved'
        ]);

        $response = $this->actingAs($this->user1)
            ->post(route('bookings.store'), [
                'room_id' => $this->room2->id
            ]);

        $response->assertRedirect();

        $booking->refresh();
        $this->assertEquals('pending', $booking->status);
        $this->assertEquals($this->room2->id, $booking->new_room_id);
        $this->assertEquals($this->room1->id, $booking->room_id);
    }

    public function test_relocation_rejection_restores_original_booking_status()
    {
        $booking = Booking::create([
            'user_id' => $this->user1->id,
            'room_id' => $this->room1->id,
            'new_room_id' => $this->room2->id,
            'status' => 'pending'
        ]);

        $response = $this->actingAs($this->admin)
            ->post(route('admin.bookings.reject', $booking->id));

        $response->assertRedirect();

        $booking->refresh();
        $this->assertEquals('approved', $booking->status);
        $this->assertNull($booking->new_room_id);
        $this->assertEquals($this->room1->id, $booking->room_id);
    }

    public function test_relocation_approval_updates_room_id()
    {
        $booking = Booking::create([
            'user_id' => $this->user1->id,
            'room_id' => $this->room1->id,
            'new_room_id' => $this->room2->id,
            'status' => 'pending'
        ]);

        $response = $this->actingAs($this->admin)
            ->post(route('admin.bookings.approve', $booking->id));

        $response->assertRedirect();

        $booking->refresh();
        $this->assertEquals('approved', $booking->status);
        $this->assertNull($booking->new_room_id);
        $this->assertEquals($this->room2->id, $booking->room_id);
    }

    public function test_admin_direct_relocation_moves_user()
    {
        $booking = Booking::create([
            'user_id' => $this->user1->id,
            'room_id' => $this->room1->id,
            'status' => 'approved'
        ]);

        $response = $this->actingAs($this->admin)
            ->post(route('admin.bookings.reallocate', $booking->id), [
                'room_id' => $this->room2->id
            ]);

        $response->assertRedirect();

        $booking->refresh();
        $this->assertEquals('approved', $booking->status);
        $this->assertNull($booking->new_room_id);
        $this->assertEquals($this->room2->id, $booking->room_id);
    }

    public function test_capacity_check_includes_pending_relocation_in_original_room()
    {
        // room2 max_capacity = 1.
        // If user1 is approved in room2, it is full.
        $booking1 = Booking::create([
            'user_id' => $this->user1->id,
            'room_id' => $this->room2->id,
            'status' => 'approved'
        ]);

        // If user1 requests to move from room2 to room1, user1's booking becomes status = pending, new_room_id = room1.
        // User1 STILL occupies room2 until approved.
        // Therefore, room2 should be considered full (capacity=1, occupied=1).
        // Let's test if user2 is blocked from booking room2:
        $booking1->update([
            'new_room_id' => $this->room1->id,
            'status' => 'pending'
        ]);

        $response = $this->actingAs($this->user2)
            ->post(route('bookings.store'), [
                'room_id' => $this->room2->id
            ]);

        $response->assertSessionHas('error', 'В цій кімнаті немає місць.');
        $this->assertDatabaseMissing('bookings', [
            'user_id' => $this->user2->id,
            'room_id' => $this->room2->id
        ]);
    }

    public function test_admin_can_create_building()
    {
        $response = $this->actingAs($this->admin)
            ->post(route('admin.buildings.store'), [
                'name' => 'Hostel Building B'
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('buildings', [
            'name' => 'Hostel Building B'
        ]);
    }

    public function test_non_admin_cannot_create_building()
    {
        $response = $this->actingAs($this->user1)
            ->post(route('admin.buildings.store'), [
                'name' => 'Hostel Building C'
            ]);

        $response->assertForbidden();

        $this->assertDatabaseMissing('buildings', [
            'name' => 'Hostel Building C'
        ]);
    }

    public function test_admin_can_bulk_create_rooms()
    {
        $building = Building::create(['name' => 'Hostel Building D']);

        $response = $this->actingAs($this->admin)
            ->post(route('admin.rooms.bulk'), [
                'building_id' => $building->id,
                'floor' => 1,
                'count' => 5,
                'max_capacity' => 4,
            ]);

        $response->assertRedirect();

        $this->assertEquals(5, Room::where('building_id', $building->id)->count());
    }

    public function test_admin_can_manually_book_user_to_room()
    {
        $response = $this->actingAs($this->admin)
            ->post(route('admin.bookings.manual'), [
                'user_id' => $this->user1->id,
                'room_id' => $this->room1->id,
            ]);

        $response->assertRedirect();
        
        $this->assertDatabaseHas('bookings', [
            'user_id' => $this->user1->id,
            'room_id' => $this->room1->id,
            'status' => 'approved',
        ]);
    }
}
