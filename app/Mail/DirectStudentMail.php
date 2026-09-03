<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DirectStudentMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $student;
    public User $sender;
    public string $emailSubject;
    public string $emailMessage;

    /**
     * Create a new message instance.
     */
    public function __construct(User $student, User $sender, string $emailSubject, string $emailMessage)
    {
        $this->student = $student;
        $this->sender = $sender;
        $this->emailSubject = $emailSubject;
        $this->emailMessage = $emailMessage;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[МНАУ Гуртожитки] {$this->emailSubject}",
            replyTo: [
                $this->sender->email => $this->sender->name,
            ],
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.direct_student',
            with: [
                'student' => $this->student,
                'sender' => $this->sender,
                'emailSubject' => $this->emailSubject,
                'emailMessage' => $this->emailMessage,
                'senderRole' => $this->sender->role === 'commandant' ? 'Комендант гуртожитку' : 'Адміністрація студентського містечка',
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
