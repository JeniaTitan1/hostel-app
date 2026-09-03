<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AccessPassScanned implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $userId;
    public string $status; // 'granted' | 'denied'
    public string $type; // 'entry' | 'exit'
    public ?int $bookingId;
    public ?string $timestamp;

    /**
     * Create a new event instance.
     */
    public function __construct(int $userId, string $status = 'granted', string $type = 'entry', ?int $bookingId = null)
    {
        $this->userId = $userId;
        $this->status = $status;
        $this->type = $type;
        $this->bookingId = $bookingId;
        $this->timestamp = now()->toISOString();
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
            new Channel('access-passes'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'AccessPassScanned';
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
            'status' => $this->status,
            'type' => $this->type,
            'bookingId' => $this->bookingId,
            'timestamp' => $this->timestamp,
        ];
    }

    public static function dispatchSafe(int $userId, string $status = 'granted', string $type = 'entry', ?int $bookingId = null): void
    {
        try {
            event(new static($userId, $status, $type, $bookingId));
        } catch (\Throwable $e) {
            Log::warning("AccessPassScanned broadcast skipped: " . $e->getMessage());
        }
    }
}
