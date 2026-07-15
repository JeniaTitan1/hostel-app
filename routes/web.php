<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TicketController;
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
});

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
    
    // Создание корпуса
    Route::post('/buildings', [AdminController::class, 'storeBuilding'])->name('buildings.store');

    // Резолв заявки на ремонт
    Route::post('/tickets/{ticket}/resolve', [TicketController::class, 'resolve'])->name('tickets.resolve');

    // Генерация пользователей
    Route::post('/users/generate', [AdminController::class, 'generateUsers'])->name('users.generate');

    // Очистити журнал аудиту
    Route::post('/audit-logs/clear', [AdminController::class, 'clearAuditLogs'])->name('audit-logs.clear');

    // Перемкнути статус кімнати
    Route::post('/rooms/{room}/toggle-status', [AdminController::class, 'toggleRoomStatus'])->name('rooms.toggle-status');

    // Академічні опції
    Route::post('/specialties', [AdminController::class, 'storeSpecialty'])->name('specialties.store');
    Route::post('/specialties/{specialty}/delete', [AdminController::class, 'destroySpecialty'])->name('specialties.destroy');
    Route::post('/academic-courses', [AdminController::class, 'storeCourse'])->name('courses.store');
    Route::post('/academic-courses/{course}/delete', [AdminController::class, 'destroyCourse'])->name('courses.destroy');
    Route::post('/academic-groups', [AdminController::class, 'storeGroup'])->name('groups.store');
    Route::post('/academic-groups/{group}/delete', [AdminController::class, 'destroyGroup'])->name('groups.destroy');
});

// Заявка на ремонт от пользователя
Route::post('/tickets', [TicketController::class, 'store'])->middleware('auth')->name('tickets.store');


require __DIR__ . '/auth.php';
