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
use App\Models\Setting;
use App\Models\Notification;
use App\Models\EmailChangeRequest;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Запуск початкового наповнення бази даних
     */
    public function run(): void
    {
        $this->seedAcademicOptions();
        $this->seedSystemSettings();
        $buildings = $this->seedBuildingsAndRooms();
        $staff = $this->seedAdministratorsAndCommandants($buildings);
        $this->seedStudentsAndScenarios($buildings, $staff['admin']);
    }

    /**
     * 1. Створення академічних опцій (Спеціальності, Курси, Групи)
     */
    protected function seedAcademicOptions(): void
    {
        $specs = [
            'КН',    // Комп'ютерні науки
            'АГР',   // Агрономія
            'ГРС',   // Готельно-ресторанна справа
            'МЕН',   // Менеджмент
            'ПВ',    // Право
            'ФІН',   // Фінанси, банківська справа та страхування
            'АІ',    // Агроінженерія
            'ЕТ',    // Електроенергетика, електротехніка та електромеханіка
            'ВМ',    // Ветеринарна медицина
            'ТВППЖ', // Технологія виробництва та переробки продукції тваринництва
        ];

        foreach ($specs as $spec) {
            Specialty::firstOrCreate(['name' => $spec]);
        }

        foreach ([1, 2, 3, 4, 5, 6] as $courseNum) {
            AcademicCourse::firstOrCreate(['number' => $courseNum]);
        }

        foreach (['1', '2', '3', '4', '5'] as $groupName) {
            AcademicGroup::firstOrCreate(['name' => $groupName]);
        }
    }

    /**
     * 2. Системні налаштування
     */
    protected function seedSystemSettings(): void
    {
        Setting::set('min_beds_per_room', '1');
        Setting::set('max_beds_per_room', '6');
        Setting::set('global_intake_closed', '0');
    }

    /**
     * 3. Створення гуртожитків та номерного фонду кімнат
     */
    protected function seedBuildingsAndRooms(): array
    {
        // 3.1 Гуртожиток №1 (Агрономічний корпус) - Основний демонстраційний корпус
        $buildingA = Building::create(['name' => 'Гуртожиток №1 (Агрономічний корпус)']);

        $roomsA = [];
        for ($floor = 1; $floor <= 3; $floor++) {
            for ($r = 1; $r <= 4; $r++) {
                $roomNumber = $floor . '0' . $r;
                // Різноманітна місткість кімнат: 1 поверх - 3-місні, 2 поверх - 2 та 3-місні, 3 поверх - 4-місні
                $capacity = ($floor === 3) ? 4 : (($floor === 1) ? 3 : (($r % 2 === 0) ? 2 : 3));

                $room = Room::create([
                    'building_id' => $buildingA->id,
                    'floor' => $floor,
                    'room_number' => $roomNumber,
                    'max_capacity' => $capacity,
                    'status' => 'active',
                ]);

                $roomsA[$roomNumber] = $room;
            }
        }

        // Спеціальні стани кімнат для Гуртожитку №1:
        // Кімната 104 - На капітальному ремонті
        $roomsA['104']->update([
            'status' => 'closed',
            'closure_reason' => 'Плановий ремонт сантехніки та заміна склопакетів',
            'closure_duration' => 'до 15 жовтня',
        ]);

        // Кімната 204 - Закритий набір
        $roomsA['204']->update([
            'intake_closed' => true,
        ]);

        // Кімната 303 - Прихована з фронтенду (Службовий резерв)
        $roomsA['303']->update([
            'hide_from_frontend' => true,
        ]);

        // 3.2 Гуртожиток №2 (Інженерно-енергетичний корпус)
        $buildingB = Building::create(['name' => 'Гуртожиток №2 (Інженерно-енергетичний корпус)']);

        $roomsB = [];
        for ($floor = 1; $floor <= 2; $floor++) {
            for ($r = 1; $r <= 3; $r++) {
                $roomNumber = $floor . '0' . $r;
                $capacity = ($r === 3) ? 3 : 2;

                $room = Room::create([
                    'building_id' => $buildingB->id,
                    'floor' => $floor,
                    'room_number' => $roomNumber,
                    'max_capacity' => $capacity,
                    'status' => 'active',
                ]);

                $roomsB[$roomNumber] = $room;
            }
        }

        // 3.3 Гуртожиток №3 (Обліково-фінансовий корпус)
        $buildingC = Building::create(['name' => 'Гуртожиток №3 (Обліково-фінансовий корпус)']);

        $roomsC = [];
        for ($floor = 1; $floor <= 2; $floor++) {
            for ($r = 1; $r <= 3; $r++) {
                $roomNumber = $floor . '0' . $r;
                $capacity = ($floor === 2 && $r === 1) ? 4 : 3;

                $room = Room::create([
                    'building_id' => $buildingC->id,
                    'floor' => $floor,
                    'room_number' => $roomNumber,
                    'max_capacity' => $capacity,
                    'status' => 'active',
                ]);

                $roomsC[$roomNumber] = $room;
            }
        }

        return [
            'A' => ['building' => $buildingA, 'rooms' => $roomsA],
            'B' => ['building' => $buildingB, 'rooms' => $roomsB],
            'C' => ['building' => $buildingC, 'rooms' => $roomsC],
        ];
    }

    /**
     * 4. Створення адміністраторів та комендантів
     */
    protected function seedAdministratorsAndCommandants(array $buildings): array
    {
        // 4.1 Головний Адміністратор (Суперадмін)
        $admin = User::create([
            'name' => 'Олександр Володимирович Коваль',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'gender' => 'male',
            'phone' => '+380512580590',
            'telegram' => '@mnau_admin',
            'password_changed' => true,
        ]);

        // 4.2 Комендант Гуртожитку №1 (Агрономічний корпус)
        $commandantA = User::create([
            'name' => 'Василь Григорович Бондаренко',
            'email' => 'commandant_a@test.com',
            'password' => Hash::make('password'),
            'role' => 'commandant',
            'building_id' => $buildings['A']['building']->id,
            'gender' => 'male',
            'phone' => '+380501112233',
            'telegram' => '@commandant_dorm1',
            'password_changed' => true,
        ]);

        // 4.3 Комендант Гуртожитку №2 (Інженерно-енергетичний корпус)
        $commandantB = User::create([
            'name' => 'Олена Василівна Мельник',
            'email' => 'commandant_b@test.com',
            'password' => Hash::make('password'),
            'role' => 'commandant',
            'building_id' => $buildings['B']['building']->id,
            'gender' => 'female',
            'phone' => '+380504445566',
            'telegram' => '@commandant_dorm2',
            'password_changed' => true,
        ]);

        // 4.4 Комендант Гуртожитку №3 (Обліково-фінансовий корпус)
        $commandantC = User::create([
            'name' => 'Михайло Іванович Ткаченко',
            'email' => 'commandant_c@test.com',
            'password' => Hash::make('password'),
            'role' => 'commandant',
            'building_id' => $buildings['C']['building']->id,
            'gender' => 'male',
            'phone' => '+380507778899',
            'telegram' => '@commandant_dorm3',
            'password_changed' => true,
        ]);

        AuditLog::log($admin->id, 'system_initialized', 'Систему успішно ініціалізовано. Створено академічні напрямки та базову конфігурацію.');
        AuditLog::log($admin->id, 'building_created', "Створено корпус \"{$buildings['A']['building']->name}\"");
        AuditLog::log($admin->id, 'building_created', "Створено корпус \"{$buildings['B']['building']->name}\"");
        AuditLog::log($admin->id, 'building_created', "Створено корпус \"{$buildings['C']['building']->name}\"");
        AuditLog::log($admin->id, 'commandant_created', "Призначено коменданта {$commandantA->name} для {$buildings['A']['building']->name}");
        AuditLog::log($admin->id, 'commandant_created', "Призначено коменданта {$commandantB->name} для {$buildings['B']['building']->name}");
        AuditLog::log($admin->id, 'commandant_created', "Призначено коменданта {$commandantC->name} для {$buildings['C']['building']->name}");

        return [
            'admin' => $admin,
            'commandantA' => $commandantA,
            'commandantB' => $commandantB,
            'commandantC' => $commandantC,
        ];
    }

    /**
     * 5. Створення студентів та тестових сценаріїв
     */
    protected function seedStudentsAndScenarios(array $buildings, User $admin): void
    {
        $roomsA = $buildings['A']['rooms'];
        $roomsB = $buildings['B']['rooms'];
        $roomsC = $buildings['C']['rooms'];

        // -------------------------------------------------------------
        // СЦЕНАРІЙ 1: Поселений студент (Хлопець, Кімната 101, Корпус А)
        // -------------------------------------------------------------
        $user1 = User::create([
            'name' => 'Іван Петренко',
            'email' => 'user@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'telegram' => '@ivan_petrenko',
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
            'telegram' => '@alex_sydorenko',
            'phone' => '+380994445566',
            'password_changed' => true,
            'gender' => 'male',
            'specialty' => 'КН',
            'course' => 2,
            'group' => '1',
        ]);

        $booking1 = Booking::create([
            'user_id' => $user1->id,
            'room_id' => $roomsA['101']->id,
            'status' => 'approved',
            'order_number' => 'ORD-2026-A10101',
        ]);

        $booking2 = Booking::create([
            'user_id' => $user2->id,
            'room_id' => $roomsA['101']->id,
            'status' => 'approved',
            'order_number' => 'ORD-2026-A10102',
        ]);

        Notification::create([
            'user_id' => $user1->id,
            'title' => 'Ордер на поселення успішно сформовано',
            'message' => "Ваш ордер №{$booking1->order_number} у кімнату №101 ({$buildings['A']['building']->name}) готовий. Збережіть його для пред'явлення коменданту.",
            'is_read' => true,
        ]);

        Notification::create([
            'user_id' => $user1->id,
            'title' => 'Ласкаво просимо до гуртожитку!',
            'message' => 'Ознайомтеся з правилами внутрішнього розпорядку гуртожитку МНАУ у своєму особистому кабінеті.',
            'is_read' => false,
        ]);

        AuditLog::log($user1->id, 'booking_requested', "Студент {$user1->name} надіслав запит на заселення в кімнату №101");
        AuditLog::log($admin->id, 'booking_approved', "Адміністратор схвалив заселення студента {$user1->name} в кімнату №101 (Ордер: {$booking1->order_number})");

        // -------------------------------------------------------------
        // СЦЕНАРІЙ 2: Поселена студентка (Дівчина, Кімната 102, Корпус А)
        // -------------------------------------------------------------
        $userOlena = User::create([
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

        $userAnastasiya = User::create([
            'name' => 'Анастасія Ковальчук',
            'email' => 'anastasiya@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'telegram' => '@anastasiya_kov',
            'phone' => '+380937654321',
            'password_changed' => true,
            'gender' => 'female',
            'specialty' => 'ГРС',
            'course' => 2,
            'group' => '1',
        ]);

        $bookingOlena = Booking::create([
            'user_id' => $userOlena->id,
            'room_id' => $roomsA['102']->id,
            'status' => 'approved',
            'order_number' => 'ORD-2026-F10201',
        ]);

        $bookingAnastasiya = Booking::create([
            'user_id' => $userAnastasiya->id,
            'room_id' => $roomsA['102']->id,
            'status' => 'approved',
            'order_number' => 'ORD-2026-F10202',
        ]);

        Notification::create([
            'user_id' => $userOlena->id,
            'title' => 'Ордер на поселення успішно сформовано',
            'message' => "Ваш ордер №{$bookingOlena->order_number} у кімнату №102 ({$buildings['A']['building']->name}) успішно сформовано.",
            'is_read' => true,
        ]);

        AuditLog::log($userOlena->id, 'booking_requested', "Студентка {$userOlena->name} надіслала запит на заселення в кімнату №102");
        AuditLog::log($admin->id, 'booking_approved', "Адміністратор схвалив заселення студентки {$userOlena->name} в кімнату №102 (Ордер: {$bookingOlena->order_number})");

        // -------------------------------------------------------------
        // СЦЕНАРІЙ 3: Заявка на розгляд (Pending Booking, Хлопець)
        // -------------------------------------------------------------
        $userPending = User::create([
            'name' => 'Петро Кравченко',
            'email' => 'pending@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'telegram' => '@petro_krav',
            'phone' => '+380956667788',
            'password_changed' => true,
            'gender' => 'male',
            'specialty' => 'АІ',
            'course' => 1,
            'group' => '2',
        ]);

        Booking::create([
            'user_id' => $userPending->id,
            'room_id' => $roomsA['201']->id,
            'status' => 'pending',
        ]);

        AuditLog::log($userPending->id, 'booking_requested', "Студент {$userPending->name} надіслав запит на заселення в кімнату №201 ({$buildings['A']['building']->name})");

        // -------------------------------------------------------------
        // СЦЕНАРІЙ 4: Запит на переселення (Relocation Request, Хлопець)
        // -------------------------------------------------------------
        $userReallocate = User::create([
            'name' => 'Сергій Коваленко',
            'email' => 'reallocate@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'telegram' => '@sergiy_kov',
            'phone' => '+380509876543',
            'password_changed' => true,
            'gender' => 'male',
            'specialty' => 'КН',
            'course' => 3,
            'group' => '1',
        ]);

        $bookingReallocate = Booking::create([
            'user_id' => $userReallocate->id,
            'room_id' => $roomsA['103']->id,
            'new_room_id' => $roomsA['202']->id,
            'status' => 'pending',
            'order_number' => 'ORD-2026-R10301',
        ]);

        Notification::create([
            'user_id' => $userReallocate->id,
            'title' => 'Заявку на переселення прийнято до розгляду',
            'message' => "Вашу заявку на переселення з кімнати №103 до кімнати №202 надіслано на розгляд адміністрації.",
            'is_read' => false,
        ]);

        AuditLog::log($userReallocate->id, 'relocation_requested', "Студент {$userReallocate->name} подав заявку на переселення з кімнати №103 до №202");

        // -------------------------------------------------------------
        // СЦЕНАРІЙ 5: Вільний студент-хлопець (Без кімнати, готовий профіль)
        // -------------------------------------------------------------
        User::create([
            'name' => 'Андрій Мельничук',
            'email' => 'free@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'telegram' => '@andriy_melnychuk',
            'phone' => '+380671112244',
            'password_changed' => true,
            'gender' => 'male',
            'specialty' => 'ФІН',
            'course' => 1,
            'group' => '1',
        ]);

        // -------------------------------------------------------------
        // СЦЕНАРІЙ 6: Вільна студентка-дівчина (Без кімнати, готовий профіль)
        // -------------------------------------------------------------
        User::create([
            'name' => 'Марина Коваленко',
            'email' => 'maryna@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'telegram' => '@maryna_kovalenko',
            'phone' => '+380672223355',
            'password_changed' => true,
            'gender' => 'female',
            'specialty' => 'МЕН',
            'course' => 2,
            'group' => '2',
        ]);

        // -------------------------------------------------------------
        // СЦЕНАРІЙ 7: Студент із запитом на зміну Email
        // -------------------------------------------------------------
        $userEmailChange = User::create([
            'name' => 'Дмитро Мороз',
            'email' => 'emailchange@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'telegram' => '@dmitro_moroz',
            'phone' => '+380963334455',
            'password_changed' => true,
            'gender' => 'male',
            'specialty' => 'ЕТ',
            'course' => 3,
            'group' => '1',
        ]);

        Booking::create([
            'user_id' => $userEmailChange->id,
            'room_id' => $roomsA['103']->id,
            'status' => 'approved',
            'order_number' => 'ORD-2026-E10302',
        ]);

        EmailChangeRequest::create([
            'user_id' => $userEmailChange->id,
            'old_email' => 'emailchange@test.com',
            'new_email' => 'dmitro.moroz.new@gmail.com',
            'status' => 'pending',
        ]);

        AuditLog::log($userEmailChange->id, 'email_change_requested', "Студент {$userEmailChange->name} надіслав запит на зміну пошти на dmitro.moroz.new@gmail.com");

        // -------------------------------------------------------------
        // СЦЕНАРІЙ 8: Студент-Новачок (Тимчасовий акаунт, перший вхід)
        // -------------------------------------------------------------
        User::create([
            'name' => 'Студент-Новачок #1111',
            'email' => 'newbie@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'must_change_password' => true,
            'password_changed' => false,
            'gender' => 'male',
        ]);

        // -------------------------------------------------------------
        // ДОДАТКОВІ СТУДЕНТИ ДЛЯ ПОВНОТИ КАРТИНИ (Гуртожитки 1, 2, 3)
        // -------------------------------------------------------------
        // Гуртожиток 1: Кімната 202 (Хлопець)
        $userVlad = User::create([
            'name' => 'Владислав Мельник',
            'email' => 'vlad@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'telegram' => '@vlad_melnyk',
            'phone' => '+380971239876',
            'password_changed' => true,
            'gender' => 'male',
            'specialty' => 'КН',
            'course' => 3,
            'group' => '2',
        ]);
        Booking::create([
            'user_id' => $userVlad->id,
            'room_id' => $roomsA['202']->id,
            'status' => 'approved',
            'order_number' => 'ORD-2026-V20201',
        ]);

        // Гуртожиток 1: Кімната 203 (Жіноча 4-місна кімната: 3/4 зайнято)
        $femaleStudents = [
            ['name' => 'Катерина Поліщук', 'email' => 'kateryna@test.com', 'phone' => '+380981110011', 'spec' => 'АГР'],
            ['name' => 'Юлія Дмитренко', 'email' => 'yuliya@test.com', 'phone' => '+380982220022', 'spec' => 'АГР'],
            ['name' => 'Вікторія Лисенко', 'email' => 'viktoriya@test.com', 'phone' => '+380983330033', 'spec' => 'МЕН'],
        ];
        foreach ($femaleStudents as $idx => $f) {
            $u = User::create([
                'name' => $f['name'],
                'email' => $f['email'],
                'password' => Hash::make('password'),
                'role' => 'user',
                'phone' => $f['phone'],
                'password_changed' => true,
                'gender' => 'female',
                'specialty' => $f['spec'],
                'course' => 2,
                'group' => '1',
            ]);
            Booking::create([
                'user_id' => $u->id,
                'room_id' => $roomsA['203']->id,
                'status' => 'approved',
                'order_number' => 'ORD-2026-F2030' . ($idx + 1),
            ]);
        }

        // Гуртожиток 1: Кімната 304 (Чоловіча кімната: 1/3 зайнято)
        $userBohdan = User::create([
            'name' => 'Богдан Савченко',
            'email' => 'bohdan@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'telegram' => '@bohdan_sav',
            'phone' => '+380631234599',
            'password_changed' => true,
            'gender' => 'male',
            'specialty' => 'ВМ',
            'course' => 4,
            'group' => '1',
        ]);
        Booking::create([
            'user_id' => $userBohdan->id,
            'room_id' => $roomsA['304']->id,
            'status' => 'approved',
            'order_number' => 'ORD-2026-B30401',
        ]);

        // Гуртожиток 2 (Інженерно-енергетичний): Заселення
        $userArtem = User::create([
            'name' => 'Артем Гриценко',
            'email' => 'artem@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'phone' => '+380661112288',
            'password_changed' => true,
            'gender' => 'male',
            'specialty' => 'ЕТ',
            'course' => 1,
            'group' => '1',
        ]);
        Booking::create([
            'user_id' => $userArtem->id,
            'room_id' => $roomsB['101']->id,
            'status' => 'approved',
            'order_number' => 'ORD-2026-B10101',
        ]);

        $userDaryna = User::create([
            'name' => 'Дарина Ткаченко',
            'email' => 'daryna@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'phone' => '+380662223399',
            'password_changed' => true,
            'gender' => 'female',
            'specialty' => 'АІ',
            'course' => 2,
            'group' => '1',
        ]);
        Booking::create([
            'user_id' => $userDaryna->id,
            'room_id' => $roomsB['102']->id,
            'status' => 'approved',
            'order_number' => 'ORD-2026-B10201',
        ]);

        // Гуртожиток 3 (Обліково-фінансовий): Заселення
        $userRoman = User::create([
            'name' => 'Роман Кушнір',
            'email' => 'roman@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'phone' => '+380674445511',
            'password_changed' => true,
            'gender' => 'male',
            'specialty' => 'ФІН',
            'course' => 3,
            'group' => '1',
        ]);
        Booking::create([
            'user_id' => $userRoman->id,
            'room_id' => $roomsC['101']->id,
            'status' => 'approved',
            'order_number' => 'ORD-2026-C10101',
        ]);

        $userAlina = User::create([
            'name' => 'Аліна Гончар',
            'email' => 'alina@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'phone' => '+380675556622',
            'password_changed' => true,
            'gender' => 'female',
            'specialty' => 'ПВ',
            'course' => 2,
            'group' => '1',
        ]);
        Booking::create([
            'user_id' => $userAlina->id,
            'room_id' => $roomsC['102']->id,
            'status' => 'approved',
            'order_number' => 'ORD-2026-C10201',
        ]);

        // -------------------------------------------------------------
        // 6. СТВОРЕННЯ ЗАЯВОК НА РЕМОНТ (TICKETS)
        // -------------------------------------------------------------
        $ticket1 = Ticket::create([
            'user_id' => $userOlena->id,
            'room_id' => $roomsA['102']->id,
            'description' => 'Необхідно замінити лампу основного освітлення та перевірити роботу вимикача.',
            'status' => 'pending',
        ]);

        $ticket2 = Ticket::create([
            'user_id' => $user1->id,
            'room_id' => $roomsA['101']->id,
            'description' => 'Підтікає змішувач в умивальнику кімнати №101.',
            'status' => 'pending',
        ]);

        $ticket3 = Ticket::create([
            'user_id' => $userVlad->id,
            'room_id' => $roomsA['202']->id,
            'description' => 'Ремонт дверної ручки та регулювання замка шафи.',
            'status' => 'resolved',
        ]);

        Notification::create([
            'user_id' => $userOlena->id,
            'title' => 'Заявку на обслуговування зареєстровано',
            'message' => 'Вашу заявку щодо заміни лампи освітлення у кімнаті №102 прийнято черговим комендантом.',
            'is_read' => false,
        ]);

        Notification::create([
            'user_id' => $userVlad->id,
            'title' => 'Заявку на обслуговування виконано',
            'message' => 'Роботи з регулювання замка у кімнаті №202 успішно завершено майстром.',
            'is_read' => true,
        ]);

        AuditLog::log($userOlena->id, 'ticket_created', "Студентка {$userOlena->name} створила заявку на ремонт для кімнати №102: {$ticket1->description}");
        AuditLog::log($user1->id, 'ticket_created', "Студент {$user1->name} створив заявку на ремонт для кімнати №101: {$ticket2->description}");
        AuditLog::log($userVlad->id, 'ticket_created', "Студент {$userVlad->name} створив заявку на ремонт для кімнати №202: {$ticket3->description}");
        AuditLog::log($admin->id, 'ticket_resolved', "Адміністратор позначив заявку №{$ticket3->id} як виконану");
    }
}
