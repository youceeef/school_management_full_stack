<?php

namespace App\Services;

use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorAuthenticationService
{
    protected Google2FA $engine;

    public function __construct(?Google2FA $engine = null)
    {
        $this->engine = $engine ?? new Google2FA;
    }

    /**
     * Generate a random 32-character base32 secret key.
     */
    public function generateSecretKey(): string
    {
        return $this->engine->generateSecretKey(32);
    }

    /**
     * Generate 8 single-use recovery codes.
     */
    public function generateRecoveryCodes(int $amount = 8): array
    {
        return Collection::times($amount, function () {
            return Str::random(10).'-'.Str::random(10);
        })->all();
    }

    /**
     * Get the OTPAuth URL for QR code scanners.
     */
    public function qrCodeUrl(string $companyName, string $companyEmail, string $secret): string
    {
        return $this->engine->getQRCodeUrl($companyName, $companyEmail, $secret);
    }

    /**
     * Generate an inline SVG QR code.
     */
    public function qrCodeSvg(string $companyName, string $companyEmail, string $secret): string
    {
        $url = $this->qrCodeUrl($companyName, $companyEmail, $secret);

        $renderer = new ImageRenderer(
            new RendererStyle(192, 1),
            new SvgImageBackEnd
        );

        $writer = new Writer($renderer);

        return $writer->writeString($url);
    }

    /**
     * Verify a 6-digit TOTP code against the secret key.
     * Allows 1 window (30 seconds) drift before/after.
     */
    public function verify(string $secret, string $code): bool
    {
        $code = trim($code);

        if (strlen($code) !== 6 || ! ctype_digit($code)) {
            return false;
        }

        return (bool) $this->engine->verifyKey($secret, $code, 1);
    }
}
