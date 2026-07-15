<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'details',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function log($userId, $action, $details)
    {
        return self::create([
            'user_id' => $userId,
            'action' => $action,
            'details' => $details,
        ]);
    }
}
