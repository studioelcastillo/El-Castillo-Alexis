param(
  [string]$SupabaseUrl,
  [string]$SupabaseServiceKey,
  [int]$Port = 4370,
  [string]$AdmsToken,
  [string]$AllowedIps,
  [int]$MaxBodyBytes,
  [string]$ServiceName = 'ElCastilloADMS',
  [string]$NssmPath = 'C:\nssm\nssm.exe',
  [string]$RepoPath = $(Resolve-Path "$PSScriptRoot\.." | Select-Object -ExpandProperty Path)
)

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Error 'Ejecuta este script como Administrador.'
  exit 1
}

if (-not (Test-Path $NssmPath)) {
  Write-Error "No se encontro NSSM en $NssmPath. Descarga NSSM y ajusta la ruta."
  exit 1
}

if (-not $SupabaseUrl -or -not $SupabaseServiceKey) {
  Write-Error 'Faltan parametros: SupabaseUrl y SupabaseServiceKey.'
  exit 1
}

$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodePath) {
  Write-Error 'Node.js no esta instalado o no esta en PATH.'
  exit 1
}

$scriptPath = Join-Path $RepoPath 'scripts\adms-receiver.mjs'
if (-not (Test-Path $scriptPath)) {
  Write-Error "No se encontro el receptor ADMS en $scriptPath."
  exit 1
}

$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
  if ($existing.Status -ne 'Stopped') {
    Stop-Service -Name $ServiceName -Force
  }
  & $NssmPath remove $ServiceName confirm | Out-Null
}

$logDir = Join-Path $RepoPath 'logs'
if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir | Out-Null
}

$stdoutPath = Join-Path $logDir 'adms-receiver.log'
$stderrPath = Join-Path $logDir 'adms-receiver.error.log'

& $NssmPath install $ServiceName $nodePath $scriptPath
& $NssmPath set $ServiceName AppDirectory $RepoPath
& $NssmPath set $ServiceName AppStdout $stdoutPath
& $NssmPath set $ServiceName AppStderr $stderrPath
$envVars = @(
  "SUPABASE_URL=$SupabaseUrl",
  "SUPABASE_SERVICE_KEY=$SupabaseServiceKey",
  "ADMS_PORT=$Port"
)
if ($AdmsToken) { $envVars += "ADMS_TOKEN=$AdmsToken" }
if ($AllowedIps) { $envVars += "ADMS_ALLOWED_IPS=$AllowedIps" }
if ($MaxBodyBytes -gt 0) { $envVars += "ADMS_MAX_BODY_BYTES=$MaxBodyBytes" }
& $NssmPath set $ServiceName AppEnvironmentExtra $envVars
& $NssmPath set $ServiceName Start SERVICE_AUTO_START
& $NssmPath set $ServiceName AppExit Default Restart
& $NssmPath set $ServiceName AppRestartDelay 5000
& $NssmPath set $ServiceName Description "Receptor ADMS para El Castillo"

netsh advfirewall firewall delete rule name="El Castillo ADMS" | Out-Null
$firewallArgs = @(
  'advfirewall',
  'firewall',
  'add',
  'rule',
  'name=El Castillo ADMS',
  'dir=in',
  'action=allow',
  'protocol=TCP',
  "localport=$Port"
)
if ($AllowedIps) { $firewallArgs += "remoteip=$AllowedIps" }
netsh @firewallArgs | Out-Null

Start-Service -Name $ServiceName

Write-Host "Servicio $ServiceName instalado y en ejecucion. Puerto TCP $Port habilitado." -ForegroundColor Green
