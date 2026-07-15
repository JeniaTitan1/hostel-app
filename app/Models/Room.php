<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    protected $fillable = [
        'building_id',
        'floor',
        'room_number',
        'max_capacity',
        'status',
    ];

    protected $attributes = [
        'status' => 'active',
    ];

    /**
     * Связь с корпусом
     */
    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    /**
     * Связь с бронированиями этой комнаты
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Вспомогательный атрибут для получения только ПОДТВЕРЖДЕННЫХ жильцов
     */
    public function activeBookings()
    {
        return $this->bookings()->where('status', 'approved');
    }
}
