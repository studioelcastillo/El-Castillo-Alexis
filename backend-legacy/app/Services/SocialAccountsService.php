<?php

namespace App\Services;

use App\Models\User;
use App\Models\SocialAccount;
use Laravel\Socialite\Two\User as ProviderUser;

class SocialAccountsService
{
    /**
     * Find or create user instance by provider user instance and provider name.
     * 
     * @param ProviderUser $providerUser
     * @param string $provider
     * 
     * @return User
     */
    public function findOrCreate(ProviderUser $providerUser, string $provider): User
    {
        $linkedSocialAccount = SocialAccount::where('provider_name', $provider)
            ->where('provider_id', $providerUser->getId())
            ->first();

        if ($linkedSocialAccount) {
            return $linkedSocialAccount->user;
        } else {
            $user = null;

            if ($email = $providerUser->getEmail()) {
                $user = User::where('user_email', $email)->first();
            }

            if (! $user) {
                $user = User::create([
                    'user_name' => $providerUser->getName(),
                    'user_email' => $providerUser->getEmail(),
                    'prof_id' => 1
                ]);
            }

            $user->linkedSocialAccounts()->create([
                'provider_id' => $providerUser->getId(),
                'provider_name' => $provider,
                'soac_name' => $providerUser->getName(),
                'soac_email' => $providerUser->getEmail(),
                'soac_avatar' => $providerUser->getAvatar(),
                'user_id' => $user->user_id,
            ]);

            return $user;
        }
    }
}