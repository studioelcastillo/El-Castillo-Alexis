# ADMS en Windows (guia rapida)

## Requisitos
- Node.js instalado en el servidor.
- NSSM instalado en `C:\nssm\nssm.exe`.
- Puerto TCP 4370 libre y abierto.

## Instalacion del servicio
Ejecuta PowerShell como Administrador y corre:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-adms-service.ps1 `
  -SupabaseUrl "https://ysorlqfwqccsgxxkpzdx.supabase.co" `
  -SupabaseServiceKey "TU_SERVICE_ROLE_KEY" `
  -Port 4370 `
  -NssmPath "C:\nssm\nssm.exe"
```

## Desinstalar servicio
```powershell
powershell -ExecutionPolicy Bypass -File scripts/uninstall-adms-service.ps1 `
  -NssmPath "C:\nssm\nssm.exe"
```

## Configuracion en el software
En el dashboard: Asistencia -> Integracion ZK.

Valores recomendados:
- Modo: PUSH_ADMS
- Servidor: livstre.com
- Puerto TCP: 4370
- Clave: 0
- ID dispositivo: 1
- Intervalo de envio: 120 seg
- Intervalo de guardado: 120 seg
- Tamano de lote: 200

## Configuracion en el biometrico
- Modo: Servidor ADMS
- Servidor: livstre.com
- Puerto TCP: 4370
- Clave de comunicacion: 0
- ID del dispositivo: 1
- DHCP: OFF si usas IP fija
- IP fija: 192.60.5.120
- Mascara: 255.255.255.0
- Gateway: 192.60.5.3
- DNS: 1.1.1.1
- Baudios: 115200
- Puerto serial: IMPRIMIR

## Notas
- Si cambias el puerto, debes abrirlo en el firewall.
- El receptor ADMS guarda marcaciones por lotes para reducir costos.
