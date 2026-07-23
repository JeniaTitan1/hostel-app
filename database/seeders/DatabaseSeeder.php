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
        // 0. Створюємо академічні опції
        $specs = ['КН', 'ГРС', 'МЕН', 'ПВ', 'ФІН'];
        foreach ($specs as $s) {
            \App\Models\Specialty::create(['name' => $s]);
        }

        $courses = [1, 2, 3, 4, 5, 6];
        foreach ($courses as $c) {
            \App\Models\AcademicCourse::create(['number' => $c]);
        }

        $groups = ['1', '2', '3', '4', '5'];
        foreach ($groups as $g) {
            \App\Models\AcademicGroup::create(['name' => $g]);
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
            'name' => 'user1',
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
            'name' => 'user2',
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
            'name' => 'Temporary Active Student #1111',
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
                $roomsA[] = \App\Models\Room::create([
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
                $roomsB[] = \App\Models\Room::create([
                    'building_id' => $buildingB->id,
                    'floor' => $floor,
                    'room_number' => $floor . '0' . $r,
                    'max_capacity' => 2,
                ]);
            }
        }

        // 6. Заселения (Bookings)
        // Иван и Лёха живут в одной комнате (101 в Корпусе А) - Roommates!
        $room101A = $roomsA[0];
        \App\Models\Booking::create([
            'user_id' => $user1->id,
            'room_id' => $room101A->id,
            'status' => 'approved',
        ]);
        \App\Models\Booking::create([
            'user_id' => $user2->id,
            'room_id' => $room101A->id,
            'status' => 'approved',
        ]);

        // Олена и Сергій живут в комнате 102 в Корпусе А
        $room102A = $roomsA[1];
        \App\Models\Booking::create([
            'user_id' => $user4->id,
            'room_id' => $room102A->id,
            'status' => 'approved',
        ]);
        \App\Models\Booking::create([
            'user_id' => $user5->id,
            'room_id' => $room102A->id,
            'status' => 'approved',
        ]);

        // Петро отправил заявку на заселение в Корпус Б комната 101, ожидает одобрения
        $room101B = $roomsB[0];
        \App\Models\Booking::create([
            'user_id' => $user3->id,
            'room_id' => $room101B->id,
            'status' => 'pending',
        ]);

        // 7. Технические заявки (Tickets)
        // Олена жалуется на протечку крана (Активная)
        \App\Models\Ticket::create([
            'user_id' => $user4->id,
            'room_id' => $room102A->id,
            'description' => 'Протікає змішувач у душовій кімнаті, вода капає на підлогу.',
            'status' => 'pending',
        ]);

        // Сергій жаловался на розетку (Решена)
        \App\Models\Ticket::create([
            'user_id' => $user5->id,
            'room_id' => $room102A->id,
            'description' => 'Зламалась електрична розетка біля ліжка.',
            'status' => 'resolved',
        ]);

        // 8. Логи действий (Audit Logs)
        \App\Models\AuditLog::log($admin->id, 'building_created', "Адміністратор створив корпус {$buildingA->name}");
        \App\Models\AuditLog::log($admin->id, 'building_created', "Адміністратор створив корпус {$buildingB->name}");
        \App\Models\AuditLog::log($admin->id, 'building_created', "Адміністратор створив корпус {$buildingC->name}");
        \App\Models\AuditLog::log($user1->id, 'booking_requested', "Користувач {$user1->name} надіслав запит на заселення в кімнату №{$room101A->room_number}");
        \App\Models\AuditLog::log($admin->id, 'booking_approved', "Адміністратор схвалив заселення користувача {$user1->name} в кімнату №{$room101A->room_number}");
        \App\Models\AuditLog::log($user2->id, 'booking_requested', "Користувач {$user2->name} надіслав запит на заселення в кімнату №{$room101A->room_number}");
        \App\Models\AuditLog::log($admin->id, 'booking_approved', "Адміністратор схвалив заселення користувача {$user2->name} в кімнату №{$room101A->room_number}");
        \App\Models\AuditLog::log($user4->id, 'booking_requested', "Користувач {$user4->name} надіслав запит на заселення в кімнату №{$room102A->room_number}");
        \App\Models\AuditLog::log($admin->id, 'booking_approved', "Адміністратор схвалив заселення користувача {$user4->name} в кімнату №{$room102A->room_number}");
        \App\Models\AuditLog::log($user5->id, 'booking_requested', "Користувач {$user5->name} надіслав запит на заселення в кімнату №{$room102A->room_number}");
        \App\Models\AuditLog::log($admin->id, 'booking_approved', "Адміністратор схвалив заселення користувача {$user5->name} в кімнату №{$room102A->room_number}");
        \App\Models\AuditLog::log($user3->id, 'booking_requested', "Користувач {$user3->name} надіслав запит на заселення в кімнату №{$room101B->room_number}");
    }
}
