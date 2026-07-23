<?php

namespace Tests\Feature;

use App\Models\EmailChangeRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmailChangeTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $student;
    protected User $tempStudent;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::create([
            'name' => 'Головний Адмін',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        $this->student = User::create([
            'name' => 'Студент Петро',
            'email' => 'petro@test.com',
            'password' => bcrypt('password'),
            'role' => 'user',
            'gender' => 'male',
            'specialty' => 'КН',
            'course' => 2,
            'group' => 'КН-21',
            'phone' => '+380991112233',
            'must_change_password' => false,
            'password_changed' => true,
            'email_changes_count' => 0,
        ]);

        $this->tempStudent = User::create([
            'name' => 'Тимчасовий Користувач #1',
            'email' => 'student1234@mnau.edu.ua',
            'password' => bcrypt('password'),
            'role' => 'user',
            'must_change_password' => true,
            'password_changed' => false,
            'email_changes_count' => 0,
        ]);
    }

    public function test_student_can_change_email_once_directly()
    {
        $response = $this->actingAs($this->student)->patch('/profile', [
            'name' => 'Студент Петро',
            'email' => 'new_petro@test.com',
            'gender' => 'male',
            'specialty' => 'КН',
            'course' => 2,
            'group' => 'КН-21',
            'phone' => '+380991112233',
        ]);

        $response->assertRedirect('/profile');
        $this->assertDatabaseHas('users', [
            'id' => $this->student->id,
            'email' => 'new_petro@test.com',
            'email_changes_count' => 1,
        ]);
    }

    public function test_student_second_email_change_creates_pending_request()
    {
        // Вже 1 раз змінював пошту
        $this->student->update(['email_changes_count' => 1]);

        $response = $this->actingAs($this->student)->patch('/profile', [
            'name' => 'Студент Петро',
            'email' => 'second_change@test.com',
            'gender' => 'male',
            'specialty' => 'КН',
            'course' => 2,
            'group' => 'КН-21',
            'phone' => '+380991112233',
        ]);

        $response->assertRedirect('/profile');
        // Емейл в користувача залишається старим!
        $this->assertDatabaseHas('users', [
            'id' => $this->student->id,
            'email' => 'petro@test.com',
        ]);

        // Створено запит на зміну емейлу зі статусом pending
        $this->assertDatabaseHas('email_change_requests', [
            'user_id' => $this->student->id,
            'old_email' => 'petro@test.com',
            'new_email' => 'second_change@test.com',
            'status' => 'pending',
        ]);
    }

    public function test_admin_can_approve_email_change_request()
    {
        $requestRecord = EmailChangeRequest::create([
            'user_id' => $this->student->id,
            'old_email' => 'petro@test.com',
            'new_email' => 'approved_email@test.com',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->superAdmin)->post("/admin/email-requests/{$requestRecord->id}/approve");

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id' => $this->student->id,
            'email' => 'approved_email@test.com',
        ]);
        $this->assertDatabaseHas('email_change_requests', [
            'id' => $requestRecord->id,
            'status' => 'approved',
        ]);
    }

    public function test_admin_can_reject_email_change_request()
    {
        $requestRecord = EmailChangeRequest::create([
            'user_id' => $this->student->id,
            'old_email' => 'petro@test.com',
            'new_email' => 'rejected_email@test.com',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->superAdmin)->post("/admin/email-requests/{$requestRecord->id}/reject", [
            'rejection_reason' => 'Некоректний емейл',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id' => $this->student->id,
            'email' => 'petro@test.com',
        ]);
        $this->assertDatabaseHas('email_change_requests', [
            'id' => $requestRecord->id,
            'status' => 'rejected',
            'rejection_reason' => 'Некоректний емейл',
        ]);
    }
}
