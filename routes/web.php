<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrderVerificationController;
use App\Http\Controllers\StudentContactController;
use App\Http\Controllers\AccessLogController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('guest')->group(function () {
    Route::get('/', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/', [AuthenticatedSessionController::class, 'store']);
});

Route::get('/dashboard', [BuildingController::class, 'index'])
    ->middleware(['auth'])
    ->name('dashboard');

// Роут для отправки заявки на бронирование (доступен только авторизованным юзерам)
Route::post('/bookings', [BuildingController::class, 'storeBooking'])
    ->middleware(['auth'])
    ->name('bookings.store');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/dismiss-reallocation', [ProfileController::class, 'dismissReallocation'])->name('profile.dismiss-reallocation');

    // Notifications routes
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.readAll');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');

    // Вихід з режиму перегляду іншого акаунту
    Route::post('/impersonate/leave', [AdminController::class, 'leaveImpersonate'])->name('impersonate.leave');
});

// Публічна перевірка справжності ордерів (за кодом або QR)
Route::get('/verify-order/{orderNumber?}', [OrderVerificationController::class, 'verify'])->name('verify-order');

Route::post('/bookings/{booking}/request-reallocate', [AdminController::class, 'requestReallocate'])->name('bookings.request-reallocate');

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    // Главная страница админки
    Route::get('/dashboard', [AdminController::class, 'index'])->name('dashboard');

    // Операции
    Route::post('/rooms/bulk', [AdminController::class, 'bulkCreateRooms'])->name('rooms.bulk');
    Route::post('/bookings/{booking}/approve', [AdminController::class, 'approveBooking'])->name('bookings.approve');
    Route::post('/bookings/{booking}/reject', [AdminController::class, 'rejectBooking'])->name('bookings.reject');
    Route::post('/bookings/manual', [AdminController::class, 'manualBooking'])->name('bookings.manual');

    Route::post('/bookings/{booking}/reallocate', [AdminController::class, 'reallocateBooking'])->name('bookings.reallocate');
    // Роут удаления должен находиться ЗДЕСЬ, внутри этой группы!
    // Меняем Route::delete на Route::post
    Route::post('/bookings/{id}/delete', [AdminController::class, 'deleteBooking'])->name('bookings.delete');
    
    // Керування корпусами, поверхами та кімнатами
    Route::post('/buildings', [AdminController::class, 'storeBuilding'])->name('buildings.store');
    Route::post('/buildings/{building}/delete', [AdminController::class, 'destroyBuilding'])->name('buildings.destroy');
    Route::post('/floors', [AdminController::class, 'storeFloor'])->name('floors.store');
    Route::post('/floors/delete', [AdminController::class, 'destroyFloor'])->name('floors.destroy');
    Route::post('/rooms', [AdminController::class, 'storeRoom'])->name('rooms.store');
    Route::post('/rooms/{room}/delete', [AdminController::class, 'destroyRoom'])->name('rooms.destroy');

    // Резолв заявки на ремонт
    Route::post('/tickets/{ticket}/resolve', [TicketController::class, 'resolve'])->name('tickets.resolve');

    // Генерация пользователей
    Route::post('/users/generate', [AdminController::class, 'generateUsers'])->name('users.generate');

    // Очистити журнал аудиту
    Route::post('/audit-logs/clear', [AdminController::class, 'clearAuditLogs'])->name('audit-logs.clear');

    // Перемкнути статус кімнати
    Route::post('/rooms/{room}/toggle-status', [AdminController::class, 'toggleRoomStatus'])->name('rooms.toggle-status');
    Route::post('/rooms/{room}/toggle-intake', [AdminController::class, 'toggleIntake'])->name('rooms.toggle-intake');
    Route::post('/rooms/{room}/toggle-visibility', [AdminController::class, 'toggleVisibility'])->name('rooms.toggle-visibility');
    Route::post('/rooms/{room}/toggle-accessibility', [AdminController::class, 'toggleAccessibility'])->name('rooms.toggle-accessibility');
    Route::post('/rooms/{room}/update-capacity', [AdminController::class, 'updateCapacity'])->name('rooms.update-capacity');
    Route::post('/settings', [AdminController::class, 'updateSettings'])->name('settings.update');

    // Академічні опції
    Route::post('/specialties', [AdminController::class, 'storeSpecialty'])->name('specialties.store');
    Route::post('/specialties/{specialty}/delete', [AdminController::class, 'destroySpecialty'])->name('specialties.destroy');
    Route::post('/academic-courses', [AdminController::class, 'storeCourse'])->name('courses.store');
    Route::post('/academic-courses/{course}/delete', [AdminController::class, 'destroyCourse'])->name('courses.destroy');
    Route::post('/academic-groups', [AdminController::class, 'storeGroup'])->name('groups.store');
    Route::post('/academic-groups/{group}/delete', [AdminController::class, 'destroyGroup'])->name('groups.destroy');

    // Керування комендантами
    Route::post('/commandants', [AdminController::class, 'storeCommandant'])->name('commandants.store');
    Route::post('/commandants/generate', [AdminController::class, 'generateCommandant'])->name('commandants.generate');
    Route::post('/commandants/{user}/delete', [AdminController::class, 'deleteCommandant'])->name('commandants.delete');

    // Модерація запитів на зміну електронної пошти
    Route::post('/email-requests/{emailRequest}/approve', [AdminController::class, 'approveEmailChange'])->name('email-requests.approve');
    Route::post('/email-requests/{emailRequest}/reject', [AdminController::class, 'rejectEmailChange'])->name('email-requests.reject');

    // Редагування та імперсонація користувача (студента/коменданта)
    Route::post('/users/{user}/update', [AdminController::class, 'updateUser'])->name('users.update');
    Route::post('/users/{user}/impersonate', [AdminController::class, 'impersonate'])->name('users.impersonate');

    // Прямий зв'язок зі студентом (відправка email)
    Route::post('/students/{user}/contact-email', [StudentContactController::class, 'sendEmail'])->name('students.contact-email');

    // Оголошення гуртожитку
    Route::post('/announcements', [AnnouncementController::class, 'store'])->name('announcements.store');
    Route::post('/announcements/{announcement}/delete', [AnnouncementController::class, 'destroy'])->name('announcements.destroy');

    // Журнал пропускного пункту (КПП) та сканування перепусток
    Route::get('/access-logs', [AccessLogController::class, 'index'])->name('access-logs.index');
    Route::post('/access-logs/scan', [AccessLogController::class, 'scan'])->name('access-logs.scan');
    Route::post('/access-logs/{accessLog}/update-direction', [AccessLogController::class, 'updateDirection'])->name('access-logs.update-direction');
});

// Окремий швидкий екран сканера для вахтера / коменданта
Route::get('/access-scanner', [AccessLogController::class, 'index'])->middleware(['auth', 'admin'])->name('access-scanner');

// Заявка на ремонт от пользователя
Route::post('/tickets', [TicketController::class, 'store'])->middleware('auth')->name('tickets.store');


require __DIR__ . '/auth.php';
