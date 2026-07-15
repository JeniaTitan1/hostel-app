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
        'new_room_id',
    ];

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
