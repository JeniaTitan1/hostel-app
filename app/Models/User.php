<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    // В Laravel 11 вместо атрибута PHP 8.2 #[Fillable]
    // надежнее использовать стандартное свойство класса:
    protected $fillable = [
        'name',
        'email',
        'password',
        'role', // Добавили роль
        'telegram',
        'phone',
        'must_change_password',
        'password_changed',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
            'password_changed' => 'boolean',
        ];
    }

    /**
     * Связь с бронированиями пользователя
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Перевірка повної готовності профілю
     */
    public function isProfileSetupComplete(): bool
    {
        $nameTemp = str_starts_with($this->name, 'Тимчасовий') || str_starts_with($this->name, 'Temporary');
        $emailTemp = str_starts_with($this->email, 'student') && str_ends_with($this->email, '@mnau.edu.ua');

        return !$nameTemp && !$emailTemp && $this->password_changed && !empty($this->phone);
    }
}
