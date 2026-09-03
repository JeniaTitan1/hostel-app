<?php

namespace App\Mail;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AnnouncementMail extends Mailable
{
    use Queueable, SerializesModels;

    public Announcement $announcement;
    public User $student;

    /**
     * Create a new message instance.
     */
    public function __construct(Announcement $announcement, User $student)
    {
        $this->announcement = $announcement;
        $this->student = $student;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $priorityPrefix = match ($this->announcement->priority) {
            'important' => '[ВАЖЛИВО]',
            'event' => '[ЗАХІД]',
            default => '[ІНФОРМАЦІЯ]',
        };

        return new Envelope(
            subject: "{$priorityPrefix} Оголошення МНАУ: {$this->announcement->title}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.announcement',
            with: [
                'announcement' => $this->announcement,
                'student' => $this->student,
                'buildingName' => $this->announcement->building?->name ?? 'Усі гуртожитки МНАУ',
            ],
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
