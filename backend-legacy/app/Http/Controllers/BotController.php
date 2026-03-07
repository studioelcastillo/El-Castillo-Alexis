<?php

namespace App\Http\Controllers;

use App\Models\Bot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BotController extends Controller
{
    /**
     * Sync or create bot data
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sync(Request $request)
    {
        try {
            $validated = $request->validate([
                'bots' => 'required|array',
                'bots.*.website' => 'required|string',
                'bots.*.email' => 'required|string|email',
                'bots.*.password' => 'required|string',
                'bots.*.likes' => 'nullable|array',
                'bots.*.follows' => 'nullable|array',
                'bots.*.verified' => 'nullable|boolean',
                'bots.*.createdAt' => 'nullable|date',
            ]);

            $syncedCount = 0;
            foreach ($validated['bots'] as $botData) {
                // Find existing bot by email and website or create new one
                $bot = Bot::firstOrNew([
                    'email' => $botData['email'],
                    'website' => $botData['website'],
                ]);

                $bot->password = $botData['password'];
                $bot->likes = $botData['likes'] ?? [];
                $bot->follows = $botData['follows'] ?? [];
                $bot->verified = $botData['verified'] ?? false;

                // Set created_at timestamp if it's a new bot
                if (!$bot->exists && isset($botData['createdAt'])) {
                    $bot->bot_created_at = $botData['createdAt'];
                }

                $bot->save();
                $syncedCount++;
            }

            return response()->json([
                'success' => true,
                'message' => "Successfully synced $syncedCount bots",
                'count' => $syncedCount
            ]);
        } catch (\Exception $e) {
            Log::error('Error syncing bots: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error syncing bots: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all bots
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $bots = Bot::all();
            return response()->json([
                'success' => true,
                'data' => $bots
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving bots: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving bots: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get random verified bots for a specific website
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRandomBots(Request $request)
    {
        try {
            $validated = $request->validate([
                'website' => 'required|string|in:kwiky,sex',
                'limit' => 'nullable|integer|min:1|max:10'
            ]);

            $website = $validated['website'];
            $limit = $validated['limit'] ?? 5;

            // Get random verified bots for the requested website
            $bots = Bot::where('website', $website)
                ->where('verified', true)
                ->inRandomOrder()
                ->limit($limit)
                ->get();

            return response()->json([
                'success' => true,
                'message' => count($bots) . " random verified {$website} bots retrieved",
                'data' => $bots
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving random bots: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving random bots: ' . $e->getMessage()
            ], 500);
        }
    }
}
