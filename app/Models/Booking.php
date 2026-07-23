<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    protected $fillable = [
        'room_id',
        'user_id',
        'status',
        'order_number',
        'new_room_id',
        'rejection_reason',
    ];

    public static function generateUniqueOrderNumber(): string
    {
        do {
            $code = 'ORD-2026-' . strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 6));
        } while (static::where('order_number', $code)->exists());

        return $code;
    }

    protected static function booted(): void
    {
        static::creating(function ($booking) {
            if ($booking->status === 'approved' && empty($booking->order_number)) {
                $booking->order_number = static::generateUniqueOrderNumber();
            }
        });

        static::updating(function ($booking) {
            if ($booking->status === 'approved' && empty($booking->order_number)) {
                $booking->order_number = static::generateUniqueOrderNumber();
            }
        });
    }

    /**
     * Связь с комнатой
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Связь с пользователем
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function newRoom()
    {
        return $this->belongsTo(Room::class, 'new_room_id');
    }
}
