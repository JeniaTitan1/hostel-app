<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Building;
use App\Models\Room;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Создаем админа
        User::create([
            'name' => 'Главный Администратор',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        // 2. Создаем тестового пользователя
        User::create([
            'name' => 'Иван Иванов',
            'email' => 'user@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
        ]);

        // 3. Создаем тестовый корпус
        $building = Building::create([
            'name' => 'Корпус А',
        ]);

        // 4. Генерируем тестовые комнаты
        // 1 этаж
        for ($i = 1; $i <= 5; $i++) {
            Room::create([
                'building_id' => $building->id,
                'floor' => 1,
                'room_number' => '10' . $i,
                'max_capacity' => 6,
            ]);
        }

        // 2 этаж
        for ($i = 1; $i <= 5; $i++) {
            Room::create([
                'building_id' => $building->id,
                'floor' => 2,
                'room_number' => '20' . $i,
                'max_capacity' => 4,
            ]);
        }
    }
}
