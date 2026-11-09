<?php

namespace Tests\Feature;

use App\Mail\Transport\MailjetApiTransport;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Exception\TransportException;
use Tests\TestCase;

class MailjetApiTransportTest extends TestCase
{
    public function test_mailjet_transport_sends_email_via_https_api_successfully(): void
    {
        Http::fake([
            'https://api.mailjet.com/v3.1/send' => Http::response([
                'Messages' => [
                    [
                        'Status' => 'success',
                        'CustomID' => '',
                        'To' => [
                            [
                                'Email' => 'recipient@example.com',
                                'MessageUUID' => 'test-uuid-1234',
                                'MessageID' => 987654321,
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        config([
            'mail.default' => 'mailjet',
            'mail.mailers.mailjet' => [
                'transport' => 'mailjet',
                'key' => 'test-api-key',
                'secret' => 'test-api-secret',
                'timeout' => 5,
            ],
            'mail.from.address' => 'eduspace@school.example',
            'mail.from.name' => 'EduSpace Test',
        ]);

        Mail::raw('Corps du message de test', function ($message) {
            $message->to('recipient@example.com', 'Recipient Name')
                ->subject('Objet de test');
        });

        Http::assertSent(function ($request) {
            $data = $request->data();

            return $request->url() === 'https://api.mailjet.com/v3.1/send'
                && $request->hasHeader('Authorization')
                && isset($data['Messages'][0]['From']['Email'])
                && $data['Messages'][0]['From']['Email'] === 'eduspace@school.example'
                && $data['Messages'][0]['To'][0]['Email'] === 'recipient@example.com'
                && $data['Messages'][0]['Subject'] === 'Objet de test'
                && $data['Messages'][0]['TextPart'] === 'Corps du message de test';
        });
    }

    public function test_mailjet_transport_throws_transport_exception_on_http_error(): void
    {
        Http::fake([
            'https://api.mailjet.com/v3.1/send' => Http::response([
                'StatusCode' => 401,
                'ErrorMessage' => 'Unauthorized: Invalid API key',
            ], 401),
        ]);

        config([
            'mail.default' => 'mailjet',
            'mail.mailers.mailjet' => [
                'transport' => 'mailjet',
                'key' => 'invalid-key',
                'secret' => 'invalid-secret',
            ],
        ]);

        $this->expectException(TransportException::class);
        $this->expectExceptionMessage('Mailjet API error: Unauthorized: Invalid API key');

        Mail::raw('Test body', function ($message) {
            $message->to('recipient@example.com')->subject('Subject');
        });
    }

    public function test_mailjet_transport_throws_transport_exception_on_message_error_status(): void
    {
        Http::fake([
            'https://api.mailjet.com/v3.1/send' => Http::response([
                'Messages' => [
                    [
                        'Status' => 'error',
                        'Errors' => [
                            [
                                'ErrorMessage' => 'Sender is not allowed to send from this address.',
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        config([
            'mail.default' => 'mailjet',
            'mail.mailers.mailjet' => [
                'transport' => 'mailjet',
                'key' => 'key',
                'secret' => 'secret',
            ],
        ]);

        $this->expectException(TransportException::class);
        $this->expectExceptionMessage('Mailjet Send error: Sender is not allowed to send from this address.');

        Mail::raw('Test body', function ($message) {
            $message->to('recipient@example.com')->subject('Subject');
        });
    }
}
