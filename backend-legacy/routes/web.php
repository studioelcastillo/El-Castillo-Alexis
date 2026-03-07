<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// PDF resumen por plataforma (con autenticación mediante access_token)
Route::middleware(['addAccessToken', 'auth:api'])->group(function () {
    Route::get('liquidation/summary-pdf', [App\Http\Controllers\LiquidationModelController::class, 'getLiquidationSummaryPdf']);
    Route::get('liquidation/studios/summary-pdf', [App\Http\Controllers\LiquidationStudioController::class, 'getLiquidationSummaryPdf']);
});
