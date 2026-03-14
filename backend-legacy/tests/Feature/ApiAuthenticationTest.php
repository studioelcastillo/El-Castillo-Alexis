<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiAuthenticationTest extends TestCase
{
    public function test_protected_api_routes_return_401_without_accept_header(): void
    {
        $this->artisan('passport:keys', ['--force' => true]);

        $response = $this->get('/api/livejasmin/current-period');

        $response
            ->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.',
            ]);
    }
}
