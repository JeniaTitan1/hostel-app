<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ImpersonationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_impersonate_student(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create([
            'role' => 'user',
            'name' => 'Студент Тест',
            'email' => 'student.test@mnau.edu.ua',
        ]);

        $response = $this->actingAs($admin)
            ->post("/admin/users/{$student->id}/impersonate");

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($student);
    }

    public function test_commandant_can_impersonate_student(): void
    {
        $commandant = User::factory()->create(['role' => 'commandant']);
        $student = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($commandant)
            ->post("/admin/users/{$student->id}/impersonate");

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($student);
    }

    public function test_admin_cannot_impersonate_another_admin(): void
    {
        $admin1 = User::factory()->create(['role' => 'admin']);
        $admin2 = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin1)
            ->post("/admin/users/{$admin2->id}/impersonate");

        $response->assertSessionHas('error');
        $this->assertAuthenticatedAs($admin1);
    }
}
