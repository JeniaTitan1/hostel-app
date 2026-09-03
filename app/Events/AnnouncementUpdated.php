<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AnnouncementUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $action;
    public ?string $message;
    public ?int $buildingId;

    /**
     * Create a new event instance.
     */
    public function __construct(string $action = 'updated', ?string $message = null, ?int $buildingId = null)
    {
        $this->action = $action;
        $this->message = $message;
        $this->buildingId = $buildingId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new Channel('announcements'),
        ];

        if ($this->buildingId) {
            $channels[] = new Channel('building.' . $this->buildingId);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'AnnouncementUpdated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'action' => $this->action,
            'message' => $this->message,
            'buildingId' => $this->buildingId,
            'timestamp' => now()->toISOString(),
        ];
    }

    public static function dispatchSafe(string $action = 'updated', ?string $message = null, ?int $buildingId = null): void
    {
        try {
            event(new static($action, $message, $buildingId));
        } catch (\Throwable $e) {
            Log::warning("AnnouncementUpdated broadcast skipped: " . $e->getMessage());
        }
    }
}
