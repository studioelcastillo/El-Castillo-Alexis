<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\App;
use App\Models\AppClient;

class AppController extends Controller
{
    /**
     * Record client information from desktop app
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function reportIpAddress(Request $request)
    {
        try {
            $validated = $request->validate([
                'app_name' => 'required|string',
                'app_version' => 'required|string',
                'ip_address' => 'required|string|ip',
                'hostname' => 'nullable|string',
                'os_name' => 'nullable|string',
                'os_version' => 'nullable|string',
                'os_arch' => 'nullable|string',
                'cpu_model' => 'nullable|string',
                'cpu_cores' => 'nullable|integer',
                'total_memory' => 'nullable|integer',
                'screen_resolution' => 'nullable|string',
                'user_agent' => 'nullable|string'
            ]);

            // Find existing client with the same IP or create a new one
            $client = AppClient::firstOrNew(['ip_address' => $validated['ip_address']]);

            // Update client information
            $client->app_name = $validated['app_name'];
            $client->app_version = $validated['app_version'];
            $client->hostname = $validated['hostname'] ?? null;
            $client->os_name = $validated['os_name'] ?? null;
            $client->os_version = $validated['os_version'] ?? null;
            $client->os_arch = $validated['os_arch'] ?? null;
            $client->cpu_model = $validated['cpu_model'] ?? null;
            $client->cpu_cores = $validated['cpu_cores'] ?? null;
            $client->total_memory = $validated['total_memory'] ?? null;
            $client->screen_resolution = $validated['screen_resolution'] ?? null;
            $client->user_agent = $validated['user_agent'] ?? null;
            $client->last_reported_at = now();
            $client->save();

            Log::info('Client information reported from desktop app', [
                'app_name' => $validated['app_name'],
                'ip_address' => $validated['ip_address'],
                'os' => $validated['os_name'] ?? 'unknown'
            ]);

            return response()->json([
                'status' => 'Success',
                'message' => 'Client information recorded successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error recording client information', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'Error',
                'message' => 'Error recording client information: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get proxy configuration for apps
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getProxyConfig(Request $request)
    {
        try {
            $appName = $request->input('app_name');
            $app = App::where('app_name', $appName)->first();

            if (!$app) {
                return response()->json([
                    'status' => 'Error',
                    'message' => 'App not found'
                ], 404);
            }

            Log::info('Proxy config requested', [
                'app_name' => $appName,
                'ip' => $app->app_ip,
                'port' => $app->app_port,
                'platform_sex_enabled' => $app->platform_sex_enabled ?? true,
                'platform_kwiky_enabled' => $app->platform_kwiky_enabled ?? false
            ]);

            return response()->json([
                'status' => 'Success',
                'app_ip' => $app->app_ip,
                'app_port' => $app->app_port,
                'bright_data_proxy' => $app->bright_data_proxy,
                'bright_data_username' => $app->bright_data_username,
                'bright_data_password' => $app->bright_data_password,
                'platform_sex_enabled' => $app->platform_sex_enabled ?? true,
                'platform_kwiky_enabled' => $app->platform_kwiky_enabled ?? false,
                'platform_mode' => $app->platform_mode ?? 'sex'
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting proxy config', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'Error',
                'message' => 'Error getting proxy config: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update proxy configuration for apps
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateProxyConfig(Request $request)
    {
        try {
            $validated = $request->validate([
                'app_name' => 'required|string',
                'app_ip' => 'required|string',
                'app_port' => 'required|integer',
                'bright_data_proxy' => 'nullable|string',
                'bright_data_username' => 'nullable|string',
                'bright_data_password' => 'nullable|string'
            ]);

            $app = App::where('app_name', $validated['app_name'])->first();

            if (!$app) {
                return response()->json([
                    'status' => 'Error',
                    'message' => 'App not found'
                ], 404);
            }

            $app->app_ip = $validated['app_ip'];
            $app->app_port = $validated['app_port'];

            // Update Bright Data proxy information if provided
            if (isset($validated['bright_data_proxy'])) {
                $app->bright_data_proxy = $validated['bright_data_proxy'];
            }
            if (isset($validated['bright_data_username'])) {
                $app->bright_data_username = $validated['bright_data_username'];
            }
            if (isset($validated['bright_data_password'])) {
                $app->bright_data_password = $validated['bright_data_password'];
            }

            $app->save();

            return response()->json([
                'status' => 'Success',
                'message' => 'Proxy configuration updated successfully',
                'app_ip' => $app->app_ip,
                'app_port' => $app->app_port,
                'bright_data_proxy' => $app->bright_data_proxy,
                'bright_data_username' => $app->bright_data_username,
                'bright_data_password' => $app->bright_data_password
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'Error',
                'message' => 'Error updating proxy config: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update platform configuration for apps
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updatePlatformConfig(Request $request)
    {
        try {
            $validated = $request->validate([
                'app_name' => 'required|string',
                'platform_sex_enabled' => 'boolean',
                'platform_kwiky_enabled' => 'boolean',
                'platform_mode' => 'nullable|string|in:sex,kwiky,all'
            ]);

            $app = App::where('app_name', $validated['app_name'])->first();

            if (!$app) {
                return response()->json([
                    'status' => 'Error',
                    'message' => 'App not found'
                ], 404);
            }

            // Update platform configuration
            if (isset($validated['platform_sex_enabled'])) {
                $app->platform_sex_enabled = $validated['platform_sex_enabled'];
            }
            if (isset($validated['platform_kwiky_enabled'])) {
                $app->platform_kwiky_enabled = $validated['platform_kwiky_enabled'];
            }
            if (isset($validated['platform_mode'])) {
                $app->platform_mode = $validated['platform_mode'];
            }

            $app->save();

            Log::info('Platform configuration updated', [
                'app_name' => $validated['app_name'],
                'platform_sex_enabled' => $app->platform_sex_enabled,
                'platform_kwiky_enabled' => $app->platform_kwiky_enabled,
                'platform_mode' => $app->platform_mode
            ]);

            return response()->json([
                'status' => 'Success',
                'message' => 'Platform configuration updated successfully',
                'platform_sex_enabled' => $app->platform_sex_enabled,
                'platform_kwiky_enabled' => $app->platform_kwiky_enabled,
                'platform_mode' => $app->platform_mode
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating platform config', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'Error',
                'message' => 'Error updating platform config: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Simple endpoint for connectivity checking
     * Desktop app can use this to verify internet connection
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkConnectivity()
    {
        try {
            return response()->json([
                'status' => 'Success',
                'timestamp' => now()->timestamp,
                'message' => 'Connection successful'
            ]);
        } catch (\Exception $e) {
            Log::error('Error in connectivity check', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'Error',
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if a new version is available
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkVersion(Request $request)
    {
        try {
            $appName = $request->input('app_name', 'el-castillo-desktop-app');
            $currentVersion = $request->input('current', '0.1.5');

            $app = App::where('app_name', $appName)->first();

            if (!$app) {
                return response()->json([
                    'status' => 'Error',
                    'message' => 'App not found'
                ], 404);
            }

            Log::info('Version check requested', [
                'app_name' => $appName,
                'currentVersion' => $currentVersion,
                'latestVersion' => $app->app_version
            ]);

            $updateAvailable = version_compare($currentVersion, $app->app_version, '<');

            return response()->json([
                'status' => 'Success',
                'updateAvailable' => $updateAvailable,
                'currentVersion' => $currentVersion,
                'latestVersion' => $app->app_version,
                'downloadUrl' => $app->app_dwnl_link,
                'releaseNotes' => $app->release_notes ?? 'Nueva versión disponible',
                'forceUpdate' => $app->force_update ?? false
            ]);
        } catch (\Exception $e) {
            Log::error('Error checking version', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'Error',
                'message' => 'Error checking version: ' . $e->getMessage()
            ], 500);
        }
    }
}
