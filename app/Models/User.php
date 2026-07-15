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
        ];
    }

    /**
     * Связь с бронированиями пользователя
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
