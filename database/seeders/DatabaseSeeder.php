<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Building;
use App\Models\Room;
use App\Models\Booking;
use App\Models\Ticket;
use App\Models\Specialty;
use App\Models\AcademicCourse;
use App\Models\AcademicGroup;
use App\Models\AuditLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 0. Створюємо академічні опції
        $specs = ['КН', 'ГРС', 'МЕН', 'ПВ', 'ФІН'];
        foreach ($specs as $s) {
            Specialty::create(['name' => $s]);
        }

        $courses = [1, 2, 3, 4, 5, 6];
        foreach ($courses as $c) {
            AcademicCourse::create(['number' => $c]);
        }

        $groups = ['1', '2', '3', '4', '5'];
        foreach ($groups as $g) {
            AcademicGroup::create(['name' => $g]);
        }

        // 1. Создаем админа
        $admin = User::create([
            'name' => 'Головний Адміністратор',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'gender' => 'male',
        ]);

        // 2. Создаем тестовых пользователей (постоянных)
        $user1 = User::create([
            'name' => 'Іван Петренко',
            'email' => 'user@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'telegram' => '@user1',
            'phone' => '+380991112233',
            'password_changed' => true,
            'gender' => 'male',
            'specialty' => 'КН',
            'course' => 2,
            'group' => '1',
        ]);

        $user2 = User::create([
            'name' => 'Олексій Сидоренко',
            'email' => 'user2@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'telegram' => '@alex_skipper',
            'phone' => '+380994445566',
            'password_changed' => true,
            'gender' => 'male',
            'specialty' => 'ГРС',
            'course' => 1,
            'group' => '1',
        ]);

        $user3 = User::create([
            'name' => 'Петро Кравченко',
            'email' => 'petro@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'telegram' => '@petro_krav',
            'phone' => '+380956667788',
            'password_changed' => true,
            'gender' => 'male',
            'specialty' => 'КН',
            'course' => 3,
            'group' => '2',
        ]);

        $user4 = User::create([
            'name' => 'Олена Шевченко',
            'email' => 'olena@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'telegram' => '@olena_shev',
            'phone' => '+380931234567',
            'password_changed' => true,
            'gender' => 'female',
            'specialty' => 'ГРС',
            'course' => 2,
            'group' => '1',
        ]);

        $user5 = User::create([
            'name' => 'Сергій Коваленко',
            'email' => 'sergiy@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'telegram' => '@sergiy_kov',
            'phone' => '+380509876543',
            'password_changed' => true,
            'gender' => 'male',
            'specialty' => 'КН',
            'course' => 4,
            'group' => '1',
        ]);

        // 3. Создаем временного пользователя (must_change_password = true)
        User::create([
            'name' => 'Студент-Новачок #1111',
            'email' => 'student1111@mnau.edu.ua',
            'password' => Hash::make('password'),
            'role' => 'user',
            'must_change_password' => true,
            'password_changed' => false,
            'gender' => 'male',
        ]);

        // 4. Создаем тестовые корпуса
        $buildingA = Building::create(['name' => 'Корпус А (Агрономічний)']);
        $buildingB = Building::create(['name' => 'Корпус Б (Інженерний)']);
        $buildingC = Building::create(['name' => 'Корпус В (Екологічний)']);

        // 4.1 Создаем комендантов
        User::create([
            'name' => 'Комендант Корпусу А (Агрономічний)',
            'email' => 'commandant_a@test.com',
            'password' => Hash::make('password'),
            'role' => 'commandant',
            'building_id' => $buildingA->id,
            'gender' => 'male',
            'phone' => '+380501112233',
            'password_changed' => true,
        ]);

        User::create([
            'name' => 'Комендант Корпусу Б (Інженерний)',
            'email' => 'commandant_b@test.com',
            'password' => Hash::make('password'),
            'role' => 'commandant',
            'building_id' => $buildingB->id,
            'gender' => 'female',
            'phone' => '+380504445566',
            'password_changed' => true,
        ]);

        // 5. Генерируем комнаты для Корпуса А
        $roomsA = [];
        for ($floor = 1; $floor <= 3; $floor++) {
            for ($r = 1; $r <= 4; $r++) {
                $roomsA[] = Room::create([
                    'building_id' => $buildingA->id,
                    'floor' => $floor,
                    'room_number' => $floor . '0' . $r,
                    'max_capacity' => ($floor === 1) ? 6 : 4,
                ]);
            }
        }

        // Генерируем комнаты для Корпуса Б
        $roomsB = [];
        for ($floor = 1; $floor <= 2; $floor++) {
            for ($r = 1; $r <= 3; $r++) {
                $roomsB[] = Room::create([
                    'building_id' => $buildingB->id,
                    'floor' => $floor,
                    'room_number' => $floor . '0' . $r,
                    'max_capacity' => 2,
                ]);
            }
        }

        // Встановлюємо спеціальні стани кімнат для тестування (Ремонт, Закритий набір, Прихована)
        if (isset($roomsA[2])) {
            $roomsA[2]->update([
                'status' => 'closed',
                'closure_reason' => 'Капітальний ремонт сантехніки',
                'closure_duration' => 'до 1 вересня',
            ]);
        }

        if (isset($roomsA[3])) {
            $roomsA[3]->update([
                'intake_closed' => true,
            ]);
        }

        if (isset($roomsA[4])) {
            $roomsA[4]->update([
                'hide_from_frontend' => true,
            ]);
        }

        // 6. Заселения (Bookings)
        $room101A = $roomsA[0];
        Booking::create([
            'user_id' => $user1->id,
            'room_id' => $room101A->id,
            'status' => 'approved',
        ]);
        Booking::create([
            'user_id' => $user2->id,
            'room_id' => $room101A->id,
            'status' => 'approved',
        ]);

        $room102A = $roomsA[1];
        Booking::create([
            'user_id' => $user4->id,
            'room_id' => $room102A->id,
            'status' => 'approved',
        ]);
        Booking::create([
            'user_id' => $user5->id,
            'room_id' => $room102A->id,
            'status' => 'approved',
        ]);

        $room101B = $roomsB[0];
        Booking::create([
            'user_id' => $user3->id,
            'room_id' => $room101B->id,
            'status' => 'pending',
        ]);

        // 7. Технические заявки (Tickets)
        Ticket::create([
            'user_id' => $user4->id,
            'room_id' => $room102A->id,
            'description' => 'Протікає змішувач у душовій кімнаті, вода капає на підлогу.',
            'status' => 'pending',
        ]);

        Ticket::create([
            'user_id' => $user5->id,
            'room_id' => $room102A->id,
            'description' => 'Зламалась електрична розетка біля ліжка.',
            'status' => 'resolved',
        ]);

        // 8. Логи действий (Audit Logs)
        AuditLog::log($admin->id, 'building_created', "Адміністратор створив корпус {$buildingA->name}");
        AuditLog::log($admin->id, 'building_created', "Адміністратор створив корпус {$buildingB->name}");
        AuditLog::log($admin->id, 'building_created', "Адміністратор створив корпус {$buildingC->name}");
        AuditLog::log($user1->id, 'booking_requested', "Користувач {$user1->name} надіслав запит на заселення в кімнату №{$room101A->room_number}");
        AuditLog::log($admin->id, 'booking_approved', "Адміністратор схвалив заселення користувача {$user1->name} в кімнату №{$room101A->room_number}");
    }
}
