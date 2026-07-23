<?php

namespace Tests\Feature;

use App\Models\Building;
use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_approved_booking_generates_unique_order_number(): void
    {
        $building = Building::create(['name' => 'Корпус А', 'floors' => 3]);
        $room = Room::create([
            'building_id' => $building->id,
            'floor' => 1,
            'room_number' => '101',
            'max_capacity' => 4,
        ]);
        $user = User::factory()->create(['role' => 'user']);

        $booking = Booking::create([
            'user_id' => $user->id,
            'room_id' => $room->id,
            'status' => 'approved',
        ]);

        $this->assertNotEmpty($booking->order_number);
        $this->assertStringStartsWith('ORD-2026-', $booking->order_number);
    }

    public function test_admin_can_verify_valid_order_code(): void
    {
        $building = Building::create(['name' => 'Корпус А', 'floors' => 3]);
        $room = Room::create([
            'building_id' => $building->id,
            'floor' => 2,
            'room_number' => '205',
            'max_capacity' => 4,
        ]);
        $student = User::factory()->create([
            'role' => 'user',
            'name' => 'Іван Тестовий',
            'email' => 'ivan.test@mnau.edu.ua',
        ]);
        $admin = User::factory()->create(['role' => 'admin']);

        $booking = Booking::create([
            'user_id' => $student->id,
            'room_id' => $room->id,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($admin)
            ->getJson("/verify-order?code={$booking->order_number}");

        $response->assertStatus(200);
        $response->assertJson([
            'valid' => true,
            'booking' => [
                'order_number' => $booking->order_number,
                'user' => [
                    'name' => 'Іван Тестовий',
                    'email' => 'ivan.test@mnau.edu.ua',
                ],
                'room' => [
                    'room_number' => '205',
                    'floor' => 2,
                ],
            ],
        ]);
    }

    public function test_regular_student_cannot_access_order_verification(): void
    {
        $student = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($student)
            ->getJson('/verify-order?code=ORD-2026-TEST');

        $response->assertStatus(403);
    }

    public function test_admin_receives_404_for_invalid_code(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)
            ->getJson('/verify-order?code=ORD-2026-INVALID');

        $response->assertStatus(404);
        $response->assertJson([
            'valid' => false,
        ]);
    }
}
