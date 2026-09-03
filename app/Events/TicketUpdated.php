<?php

namespace App\Events;

use App\Models\Ticket;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class TicketUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $ticketId;
    public ?int $userId;
    public ?int $roomId;
    public ?int $buildingId;
    public string $action;
    public ?string $message;
    public ?array $ticketData;

    /**
     * Create a new event instance.
     */
    public function __construct(int $ticketId, string $action = 'updated', ?string $message = null)
    {
        $this->ticketId = $ticketId;
        $this->action = $action;
        $this->message = $message;

        $ticket = Ticket::with(['user', 'room.building'])->find($ticketId);

        if ($ticket) {
            $this->userId = $ticket->user_id;
            $this->roomId = $ticket->room_id;
            $this->buildingId = $ticket->room ? $ticket->room->building_id : null;
            $this->ticketData = [
                'id' => $ticket->id,
                'user_id' => $ticket->user_id,
                'room_id' => $ticket->room_id,
                'description' => $ticket->description,
                'status' => $ticket->status,
                'created_at' => $ticket->created_at ? $ticket->created_at->toISOString() : now()->toISOString(),
                'user' => $ticket->user ? [
                    'id' => $ticket->user->id,
                    'name' => $ticket->user->name,
                    'email' => $ticket->user->email,
                ] : null,
                'room' => $ticket->room ? [
                    'id' => $ticket->room->id,
                    'room_number' => $ticket->room->room_number,
                    'floor' => $ticket->room->floor,
                    'building_id' => $ticket->room->building_id,
                    'building_name' => $ticket->room->building ? $ticket->room->building->name : null,
                ] : null,
            ];
        } else {
            $this->userId = null;
            $this->roomId = null;
            $this->buildingId = null;
            $this->ticketData = null;
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
            new Channel('tickets'),
        ];

        if ($this->userId) {
            $channels[] = new Channel('user.' . $this->userId);
        }

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
        return 'TicketUpdated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'ticketId' => $this->ticketId,
            'userId' => $this->userId,
            'roomId' => $this->roomId,
            'buildingId' => $this->buildingId,
            'action' => $this->action,
            'message' => $this->message,
            'ticket' => $this->ticketData,
            'timestamp' => now()->toISOString(),
        ];
    }

    public static function dispatchSafe(int $ticketId, string $action = 'updated', ?string $message = null): void
    {
        try {
            event(new static($ticketId, $action, $message));
        } catch (\Throwable $e) {
            Log::warning("TicketUpdated broadcast skipped: " . $e->getMessage());
        }
    }
}
