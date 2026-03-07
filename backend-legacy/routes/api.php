<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PassportController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\LoginHistoryController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\BankAccountController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ExchangeRateController;
use App\Http\Controllers\ModelAccountController;
use App\Http\Controllers\PetitionController;
use App\Http\Controllers\ModelGoalController;
use App\Http\Controllers\ModelStreamController;
use App\Http\Controllers\ModelStreamCustomerController;
use App\Http\Controllers\ModelStreamFileController;
use App\Http\Controllers\ModelTransactionController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PaymentFileController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StudioController;
use App\Http\Controllers\StudioAccountController;
use App\Http\Controllers\StudioModelController;
use App\Http\Controllers\StudioRoomController;
use App\Http\Controllers\StudioShiftController;
use App\Http\Controllers\TransactionTypeController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\LiquidationModelController;
use App\Http\Controllers\LiquidationStudioController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\PeriodController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\AppController;
use App\Http\Controllers\BotController;
use App\Http\Controllers\Api\LivejasminController;
use App\Http\Controllers\Api\LivejasminBonusController;
use App\Http\Controllers\DynamicBonusController;
use App\Http\Controllers\BotViewController;
use App\Http\Controllers\CommissionController;
use App\Http\Controllers\SetupCommissionController;
use App\Http\Controllers\PaysheetController;
use App\Http\Controllers\PayrollLiquidationController;
use App\Http\Controllers\PayrollAdditionalConceptsController;
use App\Http\Controllers\ScraperErrorController;
use App\Http\Controllers\SignatureController;
use App\Http\Controllers\ParticipationBonusController;
use App\Http\Controllers\DispenserController;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::group(['middleware' => ['internal.service']], function () {
    Route::post('app/ip-report', [AppController::class, 'reportIpAddress']);
    Route::get('app/proxy', [AppController::class, 'getProxyConfig']);
    Route::post('app/proxy', [AppController::class, 'updateProxyConfig']);
    Route::post('app/platform', [AppController::class, 'updatePlatformConfig']);

    Route::post('bots/sync', [BotController::class, 'sync']);
    Route::get('bots', [BotController::class, 'index']);
    Route::get('bots/random', [BotController::class, 'getRandomBots']);

    Route::get('bot-views', [BotViewController::class, 'index']);
    Route::post('bot-views', [BotViewController::class, 'store']);
    Route::post('bot-views/batch', [BotViewController::class, 'storeBatch']);
    Route::get('bot-views/{id}', [BotViewController::class, 'show']);
    Route::get('bot-views/model/{identifier}', [BotViewController::class, 'getByModel']);
    Route::get('bot-views/stats', [BotViewController::class, 'getStats']);
    Route::delete('bot-views/{id}', [BotViewController::class, 'destroy']);
});

Route::get('app/version', [AppController::class, 'checkVersion']);
Route::get('version/check', [AppController::class, 'checkVersion']);
Route::get('app/connectivity', [AppController::class, 'checkConnectivity']);

// Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//     return $request->user();
// });

// Route::get('phpinfo', function () {
//     phpinfo();
// });

Route::group(['prefix' => 'auth'], function () {
    Route::get('policy/{type}', [AuthController::class, 'getPolicy']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('recoveryPassword', [AuthController::class, 'recoveryPassword']);
    Route::put('newPassword', [AuthController::class, 'newPassword']);

    // social login
    Route::get('redirect/{provider}', [AuthController::class, 'redirectToProvider'])->where('provider', '[A-Za-z]+');
    Route::get('{provider}/callback', [AuthController::class, 'handleProviderCallback'])->where('provider', '[A-Za-z]+');

    Route::group(['middleware' => ['auth:api']], function () {
        Route::put('changePassword', [AuthController::class, 'changePassword']);
        Route::put('setToken', [AuthController::class, 'setToken']);
        Route::get('user', [AuthController::class, 'user']);
        Route::post('logout', [AuthController::class, 'logout']);
    });

    Route::group(['middleware' => ['auth:api', 'updateLastLogin', 'isActive']], function () {
        Route::get('checkSession', [AuthController::class, 'checkSession']);
    });
});

Route::group(['middleware' => ['extendSessionToken', 'addAccessToken', 'auth:api', 'isActive', 'resolveTenant']], function () {

    // users
    Route::get('users', [UserController::class, 'show']);
    Route::get('users/stdmods', [UserController::class, 'getUserStdmods']);
    Route::get('users/datatable', [UserController::class, 'showDatatable']);
    Route::get('users/models/owner', [UserController::class, 'showModelsByOwner']);
    Route::get('users/owner', [UserController::class, 'showUsersByOwner']);
    Route::post('users', [UserController::class, 'store']);
    Route::put('users/{id}', [UserController::class, 'update']);
    Route::put('users/overwrite/{id}', [UserController::class, 'overwriteUser']);
    Route::delete('users/{id}', [UserController::class, 'destroy']);
    Route::get('users/export', [UserController::class, 'export']);
    Route::put('users/active/{id}', [UserController::class, 'active']);
    Route::put('users/inactive/{id}', [UserController::class, 'inactive']);
    Route::put('users/changePassword/{id}', [UserController::class, 'changePassword']);
    Route::post('users/image/{id}', [UserController::class, 'uploadImage']);
    Route::get('user/permissions', [UserController::class, 'getUserWithPermissions']);
    Route::post('users/coincide', [UserController::class, 'getUserCoincide']);
    Route::put('users/myprofile/{id}', [UserController::class, 'updateMyProfile']);


    // locations
    Route::get('countries', [LocationController::class, 'countries']);
    Route::get('departments/{country_id}', [LocationController::class, 'departments']);
    Route::get('cities/{dpto_id}', [LocationController::class, 'cities']);
    Route::get('locations', [LocationController::class, 'getLocations']);
    Route::post('locations/country', [LocationController::class, 'storeCountry']);
    Route::post('locations/department', [LocationController::class, 'storeDepartment']);
    Route::post('locations/city', [LocationController::class, 'storeCity']);
    Route::put('locations/country/{id}', [LocationController::class, 'updateCountry']);
    Route::put('locations/department/{id}', [LocationController::class, 'updateDepartment']);
    Route::put('locations/city/{id}', [LocationController::class, 'updateCity']);
    Route::delete('locations/country/{id}', [LocationController::class, 'destroyCountry']);
    Route::delete('locations/department/{id}', [LocationController::class, 'destroyDepartment']);
    Route::delete('locations/city/{id}', [LocationController::class, 'destroyCity']);

    // documents
    Route::post('document/image', [DocumentController::class, 'uploadImageDocument']);
    Route::get('document/download/images', [DocumentController::class, 'downloadUserImages']);
    Route::post('document/video', [DocumentController::class, 'uploadVideoDocument']);
    Route::get('document/videos', [DocumentController::class, 'getUserVideos']);
    Route::delete('document/{id}/{type}', [DocumentController::class, 'destroy']);
    Route::post('document/image_multimedia', [DocumentController::class, 'uploadImageMultimediaDocument']);
    Route::get('document/images_multimedia', [DocumentController::class, 'getUserImagesMultimedia']);
    Route::get('document/profile_picture', [DocumentController::class, 'getProfilePictureOfUser']);

    // profiles
    Route::get('profiles', [ProfileController::class, 'show']);
    Route::post('profiles', [ProfileController::class, 'store']);
    Route::put('profiles/{id}', [ProfileController::class, 'update']);
    Route::delete('profiles/{id}', [ProfileController::class, 'destroy']);

    // logs
    Route::get('logs', [LogController::class, 'show']);
    Route::get('logs/datatable', [LogController::class, 'showToDatatable']);
    Route::get('logs/export', [LogController::class, 'export']);

    // notifications
    Route::get('notifications', [NotificationController::class, 'show']);
    Route::get('notifications/data', [NotificationController::class, 'showToDatatable']);
    Route::put('notifications/read/{id}', [NotificationController::class, 'read']);

    // dashboard
    Route::get('dashboard/indicators', [DashboardController::class, 'indicators']);
    Route::get('dashboard/tasks', [DashboardController::class, 'tasks']);
    Route::get('dashboard/charts', [DashboardController::class, 'charts']);

    // banks_accounts
    Route::get('banks_accounts', [BankAccountController::class, 'show']);
    Route::post('banks_accounts', [BankAccountController::class, 'store']);
    Route::put('banks_accounts/{id}', [BankAccountController::class, 'update']);
    Route::delete('banks_accounts/{id}', [BankAccountController::class, 'destroy']);
    Route::get('banks_accounts/export', [BankAccountController::class, 'export']);

    // categories
    Route::get('categories', [CategoryController::class, 'show']);
    Route::post('categories', [CategoryController::class, 'store']);
    Route::put('categories/{id}', [CategoryController::class, 'update']);
    Route::delete('categories/{id}', [CategoryController::class, 'destroy']);
    Route::get('categories/export', [CategoryController::class, 'export']);

    // exchanges_rates
    Route::get('exchanges_rates', [ExchangeRateController::class, 'show']);
    Route::post('exchanges_rates', [ExchangeRateController::class, 'store']);
    Route::put('exchanges_rates/{id}', [ExchangeRateController::class, 'update']);
    Route::delete('exchanges_rates/{id}', [ExchangeRateController::class, 'destroy']);
    Route::get('exchanges_rates/export', [ExchangeRateController::class, 'export']);

    // models_accounts
    Route::get('models_accounts', [ModelAccountController::class, 'show']);
    Route::get('models_accounts/bymodel', [ModelAccountController::class, 'showByModel']);
    Route::post('models_accounts', [ModelAccountController::class, 'store']);
    Route::put('models_accounts/change_contract', [ModelAccountController::class, 'changeContract']);
    Route::post('models_accounts/platforms', [ModelAccountController::class, 'getPlatforms']);
    Route::put('models_accounts/{id}', [ModelAccountController::class, 'update']);
    Route::delete('models_accounts/{id}', [ModelAccountController::class, 'destroy']);
    Route::get('models_accounts/export', [ModelAccountController::class, 'export']);
    Route::put('models_accounts/active/{id}', [ModelAccountController::class, 'active']);
    Route::put('models_accounts/inactive/{id}', [ModelAccountController::class, 'inactive']);
    Route::put('models_accounts/massive/inactive', [ModelAccountController::class, 'inactiveMassiveRequest']);
    Route::post('models_accounts/change_contract', [ModelAccountController::class, 'changeContract']);

    Route::get('models_accounts/afiliate_username/{user_id}', [ModelAccountController::class, 'getAfiliateUsernameByUserID']);

    //petitions
    Route::get('petitions', [PetitionController::class, 'show']);
    Route::get('petitions/dynamic/conditions', [PetitionController::class, 'showPetitions']);
    Route::post('petitions', [PetitionController::class, 'store']);
    Route::post('petition/state', [PetitionController::class, 'store_state']);
    Route::get('petitions/account_creations', [PetitionController::class, 'pending_petitions']);
    Route::get('petitions/check_model_studio', [PetitionController::class, 'check_model_associated_studio']);
    Route::get('petitions/studios_models', [PetitionController::class, 'getStudiosModelsByModel']);
    Route::get('petitions/observations/previous', [PetitionController::class, 'getPreviousObservations']);

    // models_goals
    Route::get('models_goals', [ModelGoalController::class, 'show']);
    Route::post('models_goals', [ModelGoalController::class, 'store']);
    Route::put('models_goals/{id}', [ModelGoalController::class, 'update']);
    Route::delete('models_goals/{id}', [ModelGoalController::class, 'destroy']);
    Route::get('models_goals/export', [ModelGoalController::class, 'export']);

    // models_streams
    Route::get('models_streams', [ModelStreamController::class, 'show']);
    Route::get('models_streams/model', [ModelStreamController::class, 'showByModel']);
    Route::post('models_streams', [ModelStreamController::class, 'store']);
    Route::put('models_streams/{id}', [ModelStreamController::class, 'update']);
    Route::delete('models_streams/{id}', [ModelStreamController::class, 'destroy']);
    Route::get('models_streams/export', [ModelStreamController::class, 'export']);
    Route::post('models_streams/populate-from-api', [ModelStreamController::class, 'populateStreams']);
    Route::post('models_streams/import', [ModelStreamController::class, 'import']);

    // models_streams_customers
    Route::get('models_streams_customers', [ModelStreamCustomerController::class, 'show']);
    Route::post('models_streams_customers', [ModelStreamCustomerController::class, 'store']);
    Route::put('models_streams_customers/{id}', [ModelStreamCustomerController::class, 'update']);
    Route::delete('models_streams_customers/{id}', [ModelStreamCustomerController::class, 'destroy']);
    Route::get('models_streams_customers/export', [ModelStreamCustomerController::class, 'export']);

    // models_streams_files
    Route::get('models_streams_files', [ModelStreamFileController::class, 'show']);
    Route::post('models_streams_files', [ModelStreamFileController::class, 'store']);
    Route::put('models_streams_files/{id}', [ModelStreamFileController::class, 'update']);
    Route::delete('models_streams_files/{id}', [ModelStreamFileController::class, 'destroy']);
    Route::get('models_streams_files/export', [ModelStreamFileController::class, 'export']);
    Route::get('models_streams_files/download/{id}', [ModelStreamFileController::class, 'download']);

    // models_transactions
    Route::get('models_transactions', [ModelTransactionController::class, 'show']);
    Route::post('models_transactions', [ModelTransactionController::class, 'store']);
    Route::put('models_transactions/{id}', [ModelTransactionController::class, 'update']);
    Route::delete('models_transactions/{id}', [ModelTransactionController::class, 'destroy']);
    Route::get('models_transactions/export', [ModelTransactionController::class, 'export']);

    //transactions
    Route::get('transactions', [TransactionController::class, 'show']);
    Route::post('transactions', [TransactionController::class, 'store']);
    Route::put('transactions/{id}', [TransactionController::class, 'update']);
    Route::delete('transactions/{id}', [TransactionController::class, 'destroy']);
    Route::get('transactions/export', [TransactionController::class, 'export']);

    // dispenser (cargue de máquina dispensadora)
    Route::get('dispenser', [DispenserController::class, 'index']);
    Route::post('dispenser/preview', [DispenserController::class, 'preview']);
    Route::post('dispenser/confirm', [DispenserController::class, 'confirm']);
    Route::post('dispenser/import', [DispenserController::class, 'import']); // legacy
    Route::delete('dispenser/{id}', [DispenserController::class, 'destroy']);
    Route::get('dispenser/periods/models', [DispenserController::class, 'getModelPeriods']);
    Route::get('dispenser/periods/payroll', [DispenserController::class, 'getPayrollPeriods']);

    // payments
    Route::get('payments', [PaymentController::class, 'show']);
    Route::post('payments', [PaymentController::class, 'store']);
    Route::put('payments/{id}', [PaymentController::class, 'update']);
    Route::delete('payments/{id}', [PaymentController::class, 'destroy']);
    Route::get('payments/export', [PaymentController::class, 'export']);

    // payments_files
    Route::get('payments_files', [PaymentFileController::class, 'show']);
    Route::post('payments_files', [PaymentFileController::class, 'store']);
    Route::put('payments_files/{id}', [PaymentFileController::class, 'update']);
    Route::delete('payments_files/{id}', [PaymentFileController::class, 'destroy']);
    Route::get('payments_files/export', [PaymentFileController::class, 'export']);
    Route::get('payments_files/download/{id}', [PaymentFileController::class, 'download']);

    // products
    Route::get('products', [ProductController::class, 'show']);
    Route::post('products', [ProductController::class, 'store']);
    Route::put('products/{id}', [ProductController::class, 'update']);
    Route::delete('products/{id}', [ProductController::class, 'destroy']);
    Route::get('products/export', [ProductController::class, 'export']);

    // studios
    Route::get('studios', [StudioController::class, 'show']);
    Route::post('studios', [StudioController::class, 'store']);
    Route::put('studios/{id}', [StudioController::class, 'update']);
    Route::delete('studios/{id}', [StudioController::class, 'destroy']);
    Route::get('studios/export', [StudioController::class, 'export']);
    Route::post('studios/image/{id}', [StudioController::class, 'uploadImage']);
    Route::put('studios/active/{id}', [StudioController::class, 'active']);
    Route::put('studios/inactive/{id}', [StudioController::class, 'inactive']);

    // studios_accounts
    Route::get('studios_accounts', [StudioAccountController::class, 'show']);
    Route::post('studios_accounts', [StudioAccountController::class, 'store']);
    Route::put('studios_accounts/{id}', [StudioAccountController::class, 'update']);
    Route::delete('studios_accounts/{id}', [StudioAccountController::class, 'destroy']);
    Route::get('studios_accounts/export', [StudioAccountController::class, 'export']);
    Route::put('studios_accounts/active/{id}', [StudioAccountController::class, 'active']);
    Route::put('studios_accounts/inactive/{id}', [StudioAccountController::class, 'inactive']);

    // studios_models
    Route::get('studios_models', [StudioModelController::class, 'show']);
    Route::post('studios_models', [StudioModelController::class, 'store']);
    Route::put('studios_models/{id}', [StudioModelController::class, 'update']);
    Route::delete('studios_models/{id}', [StudioModelController::class, 'destroy']);
    Route::get('studios_models/export', [StudioModelController::class, 'export']);
    Route::put('studios_models/active/{id}', [StudioModelController::class, 'active']);
    Route::put('studios_models/inactive/{id}', [StudioModelController::class, 'inactive']);
    Route::get('studios_models/model', [StudioModelController::class, 'showStudioModelFromModelByStudioModel']);
    Route::get('studios_models/model', [StudioModelController::class, 'showStudioModelFromModelByStudioModel']);
    Route::get('studios_models/pdf/{type}/{id}', [StudioModelController::class, 'printDocumentPdf']);

    // signatures
    Route::post('signatures/user', [SignatureController::class, 'storeUserSignature']);
    Route::get('signatures/user/current', [SignatureController::class, 'getCurrentUserSignature']);
    Route::get('signatures/documents/available', [SignatureController::class, 'getAvailableDocuments']);
    Route::get('signatures/documents/signed', [SignatureController::class, 'getSignedDocuments']);
    Route::post('signatures/documents/sign', [SignatureController::class, 'signDocument']);
    Route::get('signatures/documents/{stdmod_id}/{type}/status', [SignatureController::class, 'getDocumentSignatureStatus']);
    Route::post('signatures/owner/sign', [SignatureController::class, 'signAsOwner']);
    Route::post('signatures/owner/sign-multiple', [SignatureController::class, 'signMultipleAsOwner']);
    Route::get('signatures/owner/pending', [SignatureController::class, 'getOwnerPendingDocuments']);

    // studios_rooms
    Route::get('studios_rooms', [StudioRoomController::class, 'show']);
    Route::post('studios_rooms', [StudioRoomController::class, 'store']);
    Route::put('studios_rooms/{id}', [StudioRoomController::class, 'update']);
    Route::delete('studios_rooms/{id}', [StudioRoomController::class, 'destroy']);
    Route::get('studios_rooms/export', [StudioRoomController::class, 'export']);

    // studios_shifts
    Route::get('studios_shifts', [StudioShiftController::class, 'show']);
    Route::post('studios_shifts', [StudioShiftController::class, 'store']);
    Route::put('studios_shifts/{id}', [StudioShiftController::class, 'update']);
    Route::delete('studios_shifts/{id}', [StudioShiftController::class, 'destroy']);
    Route::get('studios_shifts/export', [StudioShiftController::class, 'export']);
    Route::get('studios_shifts-distinct', [StudioShiftController::class, 'showDistinct']);

    // transactions_types
    Route::get('transactions_types', [TransactionTypeController::class, 'show']);
    Route::post('transactions_types', [TransactionTypeController::class, 'store']);
    Route::put('transactions_types/{id}', [TransactionTypeController::class, 'update']);
    Route::delete('transactions_types/{id}', [TransactionTypeController::class, 'destroy']);
    Route::get('transactions_types/export', [TransactionTypeController::class, 'export']);

    // liquidations (models)
    Route::get('liquidations/models', [LiquidationModelController::class, 'getLiquidation']);
    Route::get('liquidations/models/export', [LiquidationModelController::class, 'getLiquidationPaymentExport']);
    Route::get('liquidations/models/payment_plain', [LiquidationModelController::class, 'getLiquidationPaymentPlain']);
    Route::get('liquidations/models/source', [LiquidationModelController::class, 'getLiquidationBySource']);
    Route::get('liquidations/models/pdf/{id}/{type}', [LiquidationModelController::class, 'getLiquidationPdf']);
    Route::get('liquidations/models/certification/pdf/{id}', [LiquidationModelController::class, 'getCertificationPdf']);
    Route::get('liquidations/models/payment_note/pdf/{id}', [LiquidationModelController::class, 'getPaymentNotePdf']);

    // liquidations (studios)
    Route::get('liquidations/studios', [LiquidationStudioController::class, 'getLiquidation']);
    Route::get('liquidations/studios/export', [LiquidationStudioController::class, 'getLiquidationPaymentExport']);
    Route::get('liquidations/studios/payment_plain', [LiquidationStudioController::class, 'getLiquidationPaymentPlain']);
    Route::get('liquidations/studios/source', [LiquidationStudioController::class, 'getLiquidationBySource']);
    Route::get('liquidations/studios/pdf/{id}', [LiquidationStudioController::class, 'getLiquidationPdf']);
    Route::get('liquidations/studios/certification/pdf/{id}', [LiquidationStudioController::class, 'getCertificationPdf']);
    Route::get('liquidations/studios/payment_note/pdf/{id}', [LiquidationStudioController::class, 'getPaymentNotePdf']);

    // reports
    Route::get('reports/studio_periods', [ReportController::class, 'getStudioPeriods']);
    Route::get('reports/consecutive/{report_number}', [ReportController::class, 'getReportConsecutive']);
    Route::get('reports/models_payments_report/report', [ReportController::class, 'modelsPaymentExport']);
    Route::get('reports/models_retefuente_report/report', [ReportController::class, 'modelsRetefuenteExport']);
    Route::get('reports/studios_payments_report/report', [ReportController::class, 'studiosPaymentExport']);
    Route::get('reports/studios_retefuente_report/report', [ReportController::class, 'studiosRetefuenteExport']);

    // periods (terms)
    Route::get('periods', [PeriodController::class, 'show']);
    Route::get('periods/closed', [PeriodController::class, 'getClosedPeriods']);
    Route::post('periods/sync-livejasmin', [PeriodController::class, 'syncLivejasminPeriods']);
    Route::get('periods/with-auto-sync', [PeriodController::class, 'getPeriodsWithAutoSync']);
    Route::put('period/close/{id}', [PeriodController::class, 'closePeriod']);
    Route::put('period/open/{id}', [PeriodController::class, 'openPeriod']);

    //accounts
    Route::get('accounts', [AccountController::class, 'show']);
    Route::put('accounts/{id}', [AccountController::class, 'update']);

    //login history
    Route::get('login/history', [LoginHistoryController::class, 'showToDatatable']);

    //monitors
    Route::get('monitorsrelations', [UserController::class, 'getChiefMonitorsRelations']);
    Route::get('monitorsrelations/{id}', [UserController::class, 'getMonitorsOfChiefMonitor']);
    Route::post('monitorsrelations', [UserController::class, 'storeMonitorsRelations']);
    Route::delete('monitorsrelations/{userParentId}/{userChidlId}', [UserController::class, 'deleteMonitorsRelations']);

    // commissions relations
    Route::get('commissionsrelations', [CommissionController::class, 'getCommissionsRelations']);
    Route::post('commissionsrelations', [CommissionController::class, 'storeCommissionsRelations']);
    Route::put('commissionsrelations/{id}', [CommissionController::class, 'updateCommissionsRelations']);
    Route::delete('commissionsrelations/{id}', [CommissionController::class, 'deleteCommissionsRelations']);

    // SetupCommissions API
    Route::get('setup_commissions/select/options', [SetupCommissionController::class, 'selectOptions']);
    Route::get('setup_commissions', [SetupCommissionController::class, 'index']);
    Route::get('setup_commissions/{id}', [SetupCommissionController::class, 'show']);
    Route::post('setup_commissions', [SetupCommissionController::class, 'store']);
    Route::put('setup_commissions/{id}', [SetupCommissionController::class, 'update']);
    Route::delete('setup_commissions/{id}', [SetupCommissionController::class, 'destroy']);
    // SetupCommission Items API
    Route::post('setup_commissions_item', [SetupCommissionController::class, 'storeItem']);
    Route::put('setup_commissions_item/{id}', [SetupCommissionController::class, 'updateItem']);
    Route::delete('setup_commissions_item/{id}', [SetupCommissionController::class, 'destroyItem']);

    // paysheet
    Route::get('paysheet', [PaysheetController::class, 'getPaysheet']);
    Route::get('paysheet/pdf/{id}', [PaysheetController::class, 'getPaysheetPdf']);

    // payroll periods management
    Route::prefix('payroll')->group(function () {
        Route::get('/periods', [PaysheetController::class, 'getPayrollPeriods']);
        Route::post('/periods', [PaysheetController::class, 'createPayrollPeriod']);
        Route::post('/periods/bulk', [PaysheetController::class, 'createBulkPeriods']);
        Route::post('/periods/auto-generate', [PaysheetController::class, 'autoGeneratePeriod']);
        Route::post('/periods/auto-generate-next', [PaysheetController::class, 'autoGenerateNextPeriods']);
        Route::put('/periods/{id}/close', [PaysheetController::class, 'closePeriod']);
        Route::put('/periods/{id}/open', [PaysheetController::class, 'openPeriod']);
        Route::delete('/periods/{id}', [PaysheetController::class, 'destroy']);
        Route::get('/periods/{id}/commission-periods', [PaysheetController::class, 'getAvailableCommissionPeriods']);
        Route::post('/periods/by-ids', [PaysheetController::class, 'getPeriodsByIds']);

        // payroll liquidation
        Route::post('/liquidation/preview', [PayrollLiquidationController::class, 'generatePayrollPreview']);
        Route::post('/liquidation/process', [PayrollLiquidationController::class, 'processPayrollLiquidation']);
        Route::get('/liquidation/employees/{studio_id}', [PayrollLiquidationController::class, 'getStudioEmployeesForPayroll']);
        Route::get('/liquidation/transactions/{period_id}', [PayrollLiquidationController::class, 'getPayrollTransactionsByPeriod']);
        Route::get('/liquidation/configuration', [PayrollLiquidationController::class, 'getPayrollConfiguration']);
        Route::get('/liquidation/pdf/{transaction_id}', [PayrollLiquidationController::class, 'getPayrollTransactionPdf']);

        // payroll additional concepts (horas extras, bonos, etc.)
        Route::get('/periods/{period_id}/concepts', [PayrollAdditionalConceptsController::class, 'index']);
        Route::post('/periods/{period_id}/concepts', [PayrollAdditionalConceptsController::class, 'store']);
        Route::put('/concepts/{id}', [PayrollAdditionalConceptsController::class, 'update']);
        Route::delete('/concepts/{id}', [PayrollAdditionalConceptsController::class, 'destroy']);
    });

    // Scraper errors - Estado de errores del scraper
    Route::get('scraper-errors/users', [ScraperErrorController::class, 'getUsersWithErrors']);
    Route::get('scraper-errors/users/{userId}', [ScraperErrorController::class, 'getUserErrors']);
    Route::get('scraper-errors/map', [ScraperErrorController::class, 'getErrorsMap']);
});


Route::group(['middleware' => ['extendSessionToken', 'addAccessToken', 'auth:api', 'isActive', 'resolveTenant'], 'prefix' => 'livejasmin'], function () {
    Route::get('periods', [LivejasminController::class, 'getAvailablePeriods']);
    Route::get('period', [LivejasminController::class, 'getCurrentPeriod']);
    Route::get('performance', [LivejasminController::class, 'getAllModelsPerformance']);
    Route::get('performance/{modaccId}', [LivejasminController::class, 'getModelPerformance']);
    Route::post('update/all', [LivejasminController::class, 'updateAllModelsPerformance']);
    Route::post('update/{modaccId}', [LivejasminController::class, 'updateModelPerformance']);
    Route::post('sync/api', [LivejasminController::class, 'syncApiForPeriod']);

    // Monitor specific routes
    Route::get('monitor/{monitorId}/models', [LivejasminController::class, 'getMonitorModelsPerformance']);
    Route::get('monitor/{monitorId}/stats', [LivejasminController::class, 'getMonitorAccumulatedStats']);

    // Model account lookup
    Route::get('user/{userId}/account', [LivejasminController::class, 'getModelAccountByUserId']);

    // Manual bonus approval
    Route::post('approve-bonus/{modaccId}', [LivejasminController::class, 'approveBonus']);

    // Manual data upload routes
    Route::get('manual-data/template', [LivejasminController::class, 'downloadTemplate']);
    Route::post('manual-data/upload', [LivejasminController::class, 'uploadManualData']);

    // Dynamic Bonus Management Routes
    Route::apiResource('bonuses', LivejasminBonusController::class);
    Route::get('bonuses-api-structure', [LivejasminBonusController::class, 'getApiStructure']);
    Route::post('bonuses-sync-period', [LivejasminBonusController::class, 'syncBonusesForPeriod']);

    // Bonus Criteria Management Routes
    Route::get('bonuses/{bonusId}/criteria', [LivejasminBonusController::class, 'getCriteria']);
    Route::post('bonuses/{bonusId}/criteria', [LivejasminBonusController::class, 'addCriteria']);
    Route::put('bonuses/{bonusId}/criteria/{criteriaId}', [LivejasminBonusController::class, 'updateCriteria']);
    Route::delete('bonuses/{bonusId}/criteria/{criteriaId}', [LivejasminBonusController::class, 'deleteCriteria']);
    Route::post('bonuses/{bonusId}/criteria/reorder', [LivejasminBonusController::class, 'reorderCriteria']);
});

// Dynamic Bonus Evaluation Routes
Route::group(['middleware' => ['extendSessionToken', 'addAccessToken', 'auth:api', 'isActive', 'resolveTenant']], function () {
    Route::get('dynamic-bonuses/model/{modelId}', [DynamicBonusController::class, 'getBonusesForModel']);
    Route::get('dynamic-bonuses/stats', [DynamicBonusController::class, 'getDynamicBonusStats']);
    Route::get('dynamic-bonuses/dashboard-summary', [DynamicBonusController::class, 'getBonusDashboardSummary']);
    Route::get('dynamic-bonuses/evaluation/{scoreId}', [DynamicBonusController::class, 'getBonusEvaluationDetails']);

    // LiveJasmin Dashboard routes
    Route::get('/livejasmin/current-period', [LivejasminController::class, 'getCurrentPeriod']);
    Route::get('/models-livejasmin', [LivejasminController::class, 'getModelsWithLiveJasmin']);
    Route::get('/models-livejasmin/{id}/stats', [LivejasminController::class, 'getModelStats']);
    Route::get('/models-livejasmin/{id}/bonuses', [LivejasminController::class, 'calculateModelBonuses']);
});


// Internal service endpoints (called by ms-wscrap scheduler)
Route::group(['middleware' => ['internal.service']], function () {
    Route::post('streams/populate-from-studios-scheduled', [ModelStreamController::class, 'populateFromStudiosScheduled']);
    Route::post('streams/populate-from-models-scheduled', [ModelStreamController::class, 'populateFromModelsScheduled']);
});

// Participation Bonus Routes (Gold Line new bonus system)
Route::group(['middleware' => ['extendSessionToken', 'addAccessToken', 'auth:api', 'isActive', 'resolveTenant'], 'prefix' => 'participation'], function () {
    Route::get('evaluate/{modaccId}', [ParticipationBonusController::class, 'evaluateModel']);
    Route::get('dashboard', [ParticipationBonusController::class, 'getDashboard']);
    Route::get('models', [ParticipationBonusController::class, 'getModelsList']);
    Route::get('model/{modaccId}', [ParticipationBonusController::class, 'getModelDetail']);
    Route::get('types', [ParticipationBonusController::class, 'getBonusTypes']);
});
