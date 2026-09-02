<?php

namespace App\Events;

use App\Models\Room;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RoomOccupancyUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $roomId;
    public int $buildingId;
    public int $floor;
    public string $action;
    public ?string $message;
    public ?array $roomData;

    /**
     * Create a new event instance.
     */
    public function __construct(int $roomId, string $action = 'updated', ?string $message = null)
    {
        $this->roomId = $roomId;
        $this->action = $action;
        $this->message = $message;

        $room = Room::with(['bookings.user', 'building'])
            ->withCount(['bookings as approved_bookings_count' => function ($query) {
                $query->where(function ($q) {
                    $q->where('status', 'approved')
                      ->orWhere(function ($sq) {
                          $sq->where('status', 'pending')
                            ->whereNotNull('new_room_id');
                      });
                });
            }])
            ->find($roomId);

        if ($room) {
            $this->buildingId = $room->building_id;
            $this->floor = (int) $room->floor;
            $this->roomData = $room->toArray();
        } else {
            $this->buildingId = 0;
            $this->floor = 0;
            $this->roomData = null;
        }
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new Channel('rooms'),
        ];

        if ($this->buildingId > 0) {
            $channels[] = new Channel('building.' . $this->buildingId);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'RoomOccupancyUpdated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'roomId' => $this->roomId,
            'buildingId' => $this->buildingId,
            'floor' => $this->floor,
            'action' => $this->action,
            'message' => $this->message,
            'room' => $this->roomData,
            'timestamp' => now()->toISOString(),
        ];
    }
}
