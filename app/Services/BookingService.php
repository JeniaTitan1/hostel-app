<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Room;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Exception;

class BookingService
{
    /**
     * Approve a booking and log the audit action.
     */
    public function approveBooking(Booking $booking, int $adminUserId): Booking
    {
        return DB::transaction(function () use ($booking, $adminUserId) {
            $booking->status = 'approved';
            $booking->save();

            AuditLog::create([
                'user_id' => $booking->user_id,
                'action' => 'booking_approved',
                'details' => "Бронювання #{$booking->id} схвалено адміністратором #{$adminUserId}",
            ]);

            return $booking;
        });
    }

    /**
     * Reject a booking with a reason.
     */
    public function rejectBooking(Booking $booking, ?string $reason, int $adminUserId): Booking
    {
        return DB::transaction(function () use ($booking, $reason, $adminUserId) {
            $booking->status = 'rejected';
            $booking->rejection_reason = $reason;
            $booking->save();

            AuditLog::create([
                'user_id' => $booking->user_id,
                'action' => 'booking_rejected',
                'details' => "Бронювання #{$booking->id} відхилено. Причина: " . ($reason ?: 'без вказання причини'),
            ]);

            return $booking;
        });
    }

    /**
     * Reallocate user to a new room.
     */
    public function reallocateBooking(Booking $booking, int $newRoomId, ?string $reason, int $adminUserId): Booking
    {
        return DB::transaction(function () use ($booking, $newRoomId, $reason, $adminUserId) {
            $oldRoomId = $booking->room_id;
            $booking->room_id = $newRoomId;
            $booking->new_room_id = null;
            $booking->status = 'approved';
            $booking->save();

            AuditLog::create([
                'user_id' => $booking->user_id,
                'action' => 'relocation_approved',
                'details' => "Переселення з кімнати #{$oldRoomId} у кімнату #{$newRoomId}. Причина: " . ($reason ?: 'не вказано'),
            ]);

            return $booking;
        });
    }
}
