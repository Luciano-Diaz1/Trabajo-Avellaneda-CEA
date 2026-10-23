# Avellaneda Filma

Portal del Centro de Experimentación Audiovisual de Avellaneda para consultar locaciones y gestionar solicitudes de rodaje.

## Iniciar el portal

Requiere Node.js. Desde `login-system`, instalá las dependencias e iniciá el servidor:

```powershell
npm install
$securePassword = Read-Host -AsSecureString "Elegí una contraseña de administración de al menos 12 caracteres"
$env:ADMIN_PASSWORD = (New-Object System.Net.NetworkCredential("", $securePassword)).Password
$env:SESSION_SECRET = node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"
npm start
```

La cuenta administradora se crea en el primer inicio con `ADMIN_PASSWORD`; su usuario es `admin@avellanedafilma.gob.ar`. La contraseña no se guarda en el repositorio. Si la variable no está configurada, el portal inicia sin crear la cuenta de administración.

`SESSION_SECRET` debe ser un valor aleatorio y privado. Si se omite, el servidor genera uno nuevo al iniciar; las sesiones existentes caducarán al reiniciarlo.

La base local de usuarios y solicitudes se guarda en `login-system/database/usuarios.db` y no se versiona.
