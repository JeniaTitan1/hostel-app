<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class NotificationCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $userId;
    public ?array $notificationData;
    public ?string $message;

    /**
     * Create a new event instance.
     */
    public function __construct(int $userId, $notification = null, ?string $message = null)
    {
        $this->userId = $userId;
        $this->message = $message;

        if ($notification instanceof Notification) {
            $this->notificationData = [
                'id' => $notification->id,
                'user_id' => $notification->user_id,
                'title' => $notification->title,
                'message' => $notification->message,
                'type' => $notification->type ?? 'general',
                'created_at' => $notification->created_at ? $notification->created_at->toISOString() : now()->toISOString(),
            ];
            if (!$this->message) {
                $this->message = $notification->message;
            }
        } elseif (is_array($notification)) {
            $this->notificationData = $notification;
            if (!$this->message && isset($notification['message'])) {
                $this->message = $notification['message'];
            }
        } else {
            $this->notificationData = [
                'id' => 'temp-' . time(),
                'user_id' => $userId,
                'title' => 'Нове сповіщення',
                'message' => $message ?? '',
                'type' => 'general',
                'created_at' => now()->toISOString(),
            ];
        }
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('user.' . $this->userId),
            new Channel('notifications'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'NotificationCreated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'userId' => $this->userId,
            'notification' => $this->notificationData,
            'message' => $this->message,
            'timestamp' => now()->toISOString(),
        ];
    }

    public static function dispatchSafe(int $userId, $notification = null, ?string $message = null): void
    {
        try {
            event(new static($userId, $notification, $message));
        } catch (\Throwable $e) {
            Log::warning("NotificationCreated broadcast skipped: " . $e->getMessage());
        }
    }
}
