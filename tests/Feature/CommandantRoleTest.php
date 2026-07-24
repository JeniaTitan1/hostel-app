<?php

namespace Tests\Feature;

use App\Models\Building;
use App\Models\Room;
use App\Models\User;
use App\Models\Booking;
use App\Models\Ticket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommandantRoleTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $commandantA;
    protected User $commandantB;
    protected Building $buildingA;
    protected Building $buildingB;
    protected Room $roomA;
    protected Room $roomB;
    protected User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->buildingA = Building::create(['name' => 'Корпус А']);
        $this->buildingB = Building::create(['name' => 'Корпус Б']);

        $this->superAdmin = User::create([
            'name' => 'Головний Адмін',
            'email' => 'superadmin@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        $this->commandantA = User::create([
            'name' => 'Комендант А',
            'email' => 'commandant_a@test.com',
            'password' => bcrypt('password'),
            'role' => 'commandant',
            'building_id' => $this->buildingA->id,
        ]);

        $this->commandantB = User::create([
            'name' => 'Комендант Б',
            'email' => 'commandant_b@test.com',
            'password' => bcrypt('password'),
            'role' => 'commandant',
            'building_id' => $this->buildingB->id,
        ]);

        $this->roomA = Room::create([
            'building_id' => $this->buildingA->id,
            'floor' => 1,
            'room_number' => '101',
            'max_capacity' => 4,
        ]);

        $this->roomB = Room::create([
            'building_id' => $this->buildingB->id,
            'floor' => 1,
            'room_number' => '101',
            'max_capacity' => 4,
        ]);

        $this->student = User::create([
            'name' => 'Студент Іван',
            'email' => 'student@test.com',
            'password' => bcrypt('password'),
            'role' => 'user',
            'gender' => 'male',
        ]);
    }

    public function test_commandant_can_access_admin_dashboard()
    {
        $response = $this->actingAs($this->commandantA)->get('/admin/dashboard');

        $response->assertStatus(200);
    }

    public function test_commandant_is_redirected_to_admin_dashboard_from_root_dashboard()
    {
        $response = $this->actingAs($this->commandantA)->get('/dashboard');

        $response->assertRedirect('/admin/dashboard');
    }

    public function test_commandant_sees_only_their_building_in_dashboard()
    {
        $response = $this->actingAs($this->commandantA)->get('/admin/dashboard');

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('buildings', 1)
            ->where('buildings.0.id', $this->buildingA->id)
        );
    }

    public function test_commandant_cannot_update_site_settings()
    {
        $response = $this->actingAs($this->commandantA)->post('/admin/settings', [
            'min_beds_per_room' => 2,
            'max_beds_per_room' => 10,
            'global_intake_closed' => false,
        ]);

        $response->assertStatus(403);
    }

    public function test_commandant_cannot_reallocate_student()
    {
        $booking = Booking::create([
            'user_id' => $this->student->id,
            'room_id' => $this->roomA->id,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->commandantA)->post("/admin/bookings/{$booking->id}/reallocate", [
            'room_id' => $this->roomB->id,
        ]);

        $response->assertStatus(403);
    }

    public function test_super_admin_can_create_commandant()
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/commandants', [
            'name' => 'Новий Комендант',
            'email' => 'new_commandant@test.com',
            'password' => 'password123',
            'building_id' => $this->buildingB->id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'email' => 'new_commandant@test.com',
            'role' => 'commandant',
            'building_id' => $this->buildingB->id,
        ]);
    }

    public function test_super_admin_can_generate_commandant()
    {
        $response = $this->actingAs($this->superAdmin)->post('/admin/commandants/generate', [
            'building_id' => $this->buildingA->id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'role' => 'commandant',
            'building_id' => $this->buildingA->id,
        ]);
    }

    public function test_commandant_cannot_manage_other_building_rooms()
    {
        $response = $this->actingAs($this->commandantA)->post("/admin/rooms/{$this->roomB->id}/toggle-status", [
            'closure_reason' => 'Ремонт',
            'closure_duration' => '1 тиждень',
        ]);

        $response->assertStatus(403);
    }
}
