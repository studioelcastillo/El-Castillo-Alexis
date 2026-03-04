param(
  [string]$ServiceName = 'ElCastilloADMS',
  [string]$NssmPath = 'C:\nssm\nssm.exe'
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

$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
  if ($existing.Status -ne 'Stopped') {
    Stop-Service -Name $ServiceName -Force
  }
  & $NssmPath remove $ServiceName confirm | Out-Null
}

netsh advfirewall firewall delete rule name="El Castillo ADMS" | Out-Null

Write-Host "Servicio $ServiceName eliminado." -ForegroundColor Yellow
