<?php

namespace App\Http\Controllers;

use App\Models\BotView;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class BotViewController extends Controller
{
    /**
     * Display a listing of bot views.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $botViews = BotView::orderBy('created_at', 'desc')->paginate(20);
        return response()->json(['data' => $botViews], 200);
    }

    /**
     * Store a newly created bot view.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'model_identifier' => 'required|string|max:255',
            'website' => 'required|string|max:255',
            'view_at' => 'date|nullable',
            'ip_address' => 'ip|nullable',
            'user_agent' => 'string|nullable|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $botView = BotView::create($request->all());
        return response()->json(['data' => $botView, 'message' => 'Bot view created successfully'], 201);
    }

    /**
     * Display the specified bot view.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $botView = BotView::find($id);
        if (!$botView) {
            return response()->json(['message' => 'Bot view not found'], 404);
        }
        return response()->json(['data' => $botView], 200);
    }

    /**
     * Filter bot views by model identifier.
     *
     * @param  string  $identifier
     * @return \Illuminate\Http\Response
     */
    public function getByModel($identifier)
    {
        $botViews = BotView::where('model_identifier', $identifier)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json(['data' => $botViews], 200);
    }

    /**
     * Get statistics for bot views.
     *
     * @return \Illuminate\Http\Response
     */
    public function getStats()
    {
        $totalViews = BotView::count();
        $viewsByWebsite = BotView::selectRaw('website, count(*) as count')
            ->groupBy('website')
            ->get();
        $viewsByModel = BotView::selectRaw('model_identifier, count(*) as count')
            ->groupBy('model_identifier')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'total_views' => $totalViews,
            'views_by_website' => $viewsByWebsite,
            'top_models' => $viewsByModel
        ], 200);
    }

    /**
     * Remove the specified bot view.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $botView = BotView::find($id);
        if (!$botView) {
            return response()->json(['message' => 'Bot view not found'], 404);
        }

        $botView->delete();
        return response()->json(['message' => 'Bot view deleted successfully'], 200);
    }

    /**
     * Store a batch of bot views in the database
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function storeBatch(Request $request)
    {
        try {
            $validated = $request->validate([
                'views' => 'required|array',
                'views.*.model_identifier' => 'required|string',
                'views.*.website' => 'required|string',
                'views.*.view_at' => 'required|date',
                'views.*.ip_address' => 'nullable|string',
                'views.*.user_agent' => 'nullable|string',
            ]);

            $createdCount = 0;
            $failed = 0;

            foreach ($validated['views'] as $viewData) {
                try {
                    $botView = new BotView();
                    $botView->model_identifier = $viewData['model_identifier'];
                    $botView->website = $viewData['website'];
                    $botView->view_at = $viewData['view_at'];
                    $botView->ip_address = $viewData['ip_address'] ?? null;
                    $botView->user_agent = $viewData['user_agent'] ?? null;
                    $botView->save();

                    $createdCount++;
                } catch (\Exception $e) {
                    Log::error('Error creating bot view: ' . $e->getMessage());
                    $failed++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Successfully registered $createdCount bot views. Failed: $failed",
                'count' => $createdCount
            ]);
        } catch (\Exception $e) {
            Log::error('Error processing batch of bot views: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error processing views: ' . $e->getMessage()
            ], 500);
        }
    }
}
