<?php

namespace App\Http\Middleware;

use App\Services\TurnstileService;
use Closure;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyTurnstile
{
    public function __construct(private TurnstileService $turnstile)
    {
    }

    /**
     * Token CAPTCHA (field 'turnstile_token') diverifikasi ke Cloudflare.
     * Ini terpisah dari token Sanctum: yang satu membuktikan "bukan bot",
     * yang lain membuktikan "siapa pengguna".
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->input('turnstile_token');

        if (!is_string($token) || $token === '') {
            return $this->reject('Verifikasi CAPTCHA wajib diselesaikan.');
        }

        try {
            $valid = $this->turnstile->verify($token, $request->ip());
        } catch (ConnectionException) {
            return response()->json([
                'success' => false,
                'message' => 'Layanan verifikasi CAPTCHA tidak dapat dihubungi. Coba lagi.',
                'errors' => (object) [],
            ], 503);
        }

        if (!$valid) {
            return $this->reject('Verifikasi CAPTCHA tidak valid atau sudah kedaluwarsa.');
        }

        return $next($request);
    }

    private function reject(string $message): Response
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => ['turnstile_token' => [$message]],
        ], 422);
    }
}