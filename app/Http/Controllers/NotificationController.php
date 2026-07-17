<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;

class NotificationController extends Controller
{
    /**
     * Mark a single notification as read (delete it).
     */
    public function read(Notification $notification): RedirectResponse
    {
        // Ensure user owns this notification
        if ($notification->user_id === auth()->id()) {
            $notification->delete();
        }

        return redirect()->back();
    }

    /**
     * Mark all notifications as read (delete them).
     */
    public function readAll(Request $request): RedirectResponse
    {
        Notification::where('user_id', auth()->id())->delete();

        return redirect()->back();
    }
}
