<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserGeneratorService
{
    /**
     * Generate bulk student users with random credentials.
     */
    public function generateStudents(int $count, ?string $specialty, ?int $course, ?string $group): array
    {
        $generated = [];

        for ($i = 0; $i < $count; $i++) {
            $randomNum = rand(1000, 9999);
            $email = "student_{$randomNum}_" . Str::random(4) . "@mnau.edu.ua";
            $password = Str::random(10);
            $gender = rand(0, 1) === 0 ? 'male' : 'female';

            $user = User::create([
                'name' => "Студент #" . ($i + 1),
                'email' => $email,
                'password' => Hash::make($password),
                'role' => 'user',
                'gender' => $gender,
                'specialty' => $specialty,
                'course' => $course ?: 1,
                'group' => $group,
                'must_change_password' => true,
            ]);

            $generated[] = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'password' => $password,
                'gender' => $user->gender,
                'specialty' => $user->specialty,
                'course' => $user->course,
                'group' => $user->group,
            ];
        }

        return $generated;
    }

    /**
     * Generate a commandant account for a building.
     */
    public function generateCommandant(int $buildingId, string $buildingName): array
    {
        $randomNum = rand(100, 999);
        $email = "commandant_{$buildingId}_{$randomNum}@mnau.edu.ua";
        $password = Str::random(10);

        $user = User::create([
            'name' => "Комендант ({$buildingName})",
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'commandant',
            'building_id' => $buildingId,
            'must_change_password' => true,
        ]);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'password' => $password,
            'building_name' => $buildingName,
        ];
    }
}
