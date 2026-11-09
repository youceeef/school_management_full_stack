<?php

namespace App\Mail\Transport;

use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\MessageConverter;

class MailjetApiTransport extends AbstractTransport
{
    private const API_URL = 'https://api.mailjet.com/v3.1/send';

    public function __construct(
        private readonly string $key,
        private readonly string $secret,
        private readonly int $timeout = 10,
    ) {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $payload = [
            'Messages' => [
                $this->buildMessagePayload($email),
            ],
        ];

        try {
            $response = Http::withBasicAuth($this->key, $this->secret)
                ->timeout($this->timeout)
                ->acceptJson()
                ->asJson()
                ->post(self::API_URL, $payload);
        } catch (\Throwable $e) {
            throw new TransportException('Mailjet API connection failed: '.$e->getMessage(), 0, $e);
        }

        if (! $response->successful()) {
            $errorMessage = $response->json('ErrorMessage')
                ?? $response->json('Messages.0.Errors.0.ErrorMessage')
                ?? ('Mailjet HTTP error '.$response->status());

            throw new TransportException('Mailjet API error: '.$errorMessage);
        }

        $messageResult = $response->json('Messages.0');
        if (isset($messageResult['Status']) && $messageResult['Status'] === 'error') {
            $errorDetails = $messageResult['Errors'][0]['ErrorMessage'] ?? 'Unknown error';

            throw new TransportException('Mailjet Send error: '.$errorDetails);
        }
    }

    private function buildMessagePayload(Email $email): array
    {
        $from = $email->getFrom();
        $fromAddress = $from[0] ?? new Address(config('mail.from.address', 'hello@example.com'), config('mail.from.name', 'EduSpace'));

        $msg = [
            'From' => [
                'Email' => $fromAddress->getAddress(),
                'Name' => $fromAddress->getName() ?: config('mail.from.name', 'EduSpace'),
            ],
            'To' => array_map(fn (Address $addr) => [
                'Email' => $addr->getAddress(),
                'Name' => $addr->getName() ?: $addr->getAddress(),
            ], $email->getTo()),
            'Subject' => $email->getSubject() ?: '(Sans objet)',
        ];

        if ($email->getCc()) {
            $msg['Cc'] = array_map(fn (Address $addr) => [
                'Email' => $addr->getAddress(),
                'Name' => $addr->getName() ?: $addr->getAddress(),
            ], $email->getCc());
        }

        if ($email->getBcc()) {
            $msg['Bcc'] = array_map(fn (Address $addr) => [
                'Email' => $addr->getAddress(),
                'Name' => $addr->getName() ?: $addr->getAddress(),
            ], $email->getBcc());
        }

        if ($text = $email->getTextBody()) {
            $msg['TextPart'] = $text;
        }

        if ($html = $email->getHtmlBody()) {
            $msg['HTMLPart'] = $html;
        }

        if (empty($msg['TextPart']) && empty($msg['HTMLPart'])) {
            $msg['TextPart'] = ' ';
        }

        if ($attachments = $email->getAttachments()) {
            $msg['Attachments'] = [];
            foreach ($attachments as $attachment) {
                $msg['Attachments'][] = [
                    'ContentType' => $attachment->getMediaType().'/'.$attachment->getMediaSubtype(),
                    'Filename' => $attachment->getFilename() ?: 'attachment',
                    'Base64Content' => base64_encode($attachment->getBody()),
                ];
            }
        }

        return $msg;
    }

    public function __toString(): string
    {
        return 'mailjet-api';
    }
}
