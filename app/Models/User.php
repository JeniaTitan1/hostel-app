<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'building_id', // Прив'язка коменданта до корпусу
        'telegram',
        'phone',
        'must_change_password',
        'password_changed',
        'gender',
        'is_inclusive',
        'allowed_buildings',
        'specialty',
        'course',
        'group',
        'email_changes_count',
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
            'is_inclusive' => 'boolean',
            'allowed_buildings' => 'array',
            'email_changes_count' => 'integer',
        ];
    }

    /**
     * Перевірка чи має студент доступ до поселення в корпус
     */
    public function canAccessBuilding($buildingId): bool
    {
        if (empty($this->allowed_buildings)) {
            return true;
        }
        return in_array((int)$buildingId, array_map('intval', $this->allowed_buildings));
    }

    /**
     * Связь с корпусом (для комендантов)
     */
    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    /**
     * Связь с бронированиями пользователя
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Сповіщення користувача
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Запити на зміну емейлу
     */
    public function emailChangeRequests(): HasMany
    {
        return $this->hasMany(EmailChangeRequest::class);
    }

    public function pendingEmailChangeRequest()
    {
        return $this->hasOne(EmailChangeRequest::class)->where('status', 'pending');
    }

    /**
     * Перевірка повної готовності профілю
     */
    public function isProfileSetupComplete(): bool
    {
        $nameTemp = str_starts_with($this->name, 'Тимчасовий') || str_starts_with($this->name, 'Temporary');

        return !$nameTemp && $this->password_changed && !empty($this->phone) && !empty($this->gender) && !empty($this->specialty) && !empty($this->course) && !empty($this->group);
    }
}
