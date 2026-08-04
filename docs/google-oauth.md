# Configurar el login con Google · guía paso a paso

> **Lo primero, para quitarte el miedo:** no hay que programar nada. Supabase
> gestiona todo el flujo OAuth por ti. Tu único trabajo es copiar tres valores
> de un sitio a otro y pegar una URL en el lugar correcto.

Vas a necesitar dos pestañas abiertas:

- [Google Cloud Console](https://console.cloud.google.com)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

## Paso 0 · Consigue tu Project Ref de Supabase

1. Supabase Dashboard → tu proyecto.
2. `Settings` → `API`.
3. Copia el **Project URL**:

   ```
   https://abcdefghijklmnop.supabase.co
                ^^^^^^^^^^^^^^^^
                este trozo es tu "Project Ref"
   ```

4. Apunta esta URL, que es la que pegarás en Google en el paso 3:

   ```
   https://TU-PROJECT-REF.supabase.co/auth/v1/callback
   ```

---

## Paso 1 · Crea el proyecto en Google Cloud

1. Entra en <https://console.cloud.google.com>.
2. Desplegable de proyecto (arriba, junto al logo) → `Proyecto nuevo`.
3. Nombre: `football-career-simulator` → `Crear`.
4. **Verifica que el desplegable de arriba muestra el proyecto recién creado.**
   Configurar todo en el proyecto equivocado es el error más común.

---

## Paso 2 · Pantalla de consentimiento (Google Auth Platform)

Google renombró esta sección, por eso las guías antiguas no cuadran con lo que
ves en pantalla.

1. Busca **`Google Auth Platform`** en la barra de búsqueda superior.
2. Si aparece un botón `Comenzar` / `Get started`, púlsalo.
3. Rellena:
   - **Nombre de la app**: `Football Career Simulator`
   - **Correo de asistencia**: tu Gmail
   - **Público / Audience**: `Externo`
   - **Datos de contacto**: tu Gmail
4. Acepta y crea.

### ⚠️ El modo "Prueba" bloquea a todo el mundo menos a ti

Al crearse, la app queda en modo **Testing**: solo pueden iniciar sesión los
correos que añadas a mano. Si no lo tocas, cualquier otra cuenta recibirá un
error de acceso bloqueado.

- **Opción A — solo para probar:** `Público` → **Usuarios de prueba** →
  `Add users` → añade tu Gmail (máximo 100 cuentas).
- **Opción B — recomendada:** en esa misma pantalla, **`Publicar aplicación`**.
  Como la app solo pide datos básicos (nombre y email), Google **no exige
  proceso de verificación**. El aviso que sale es alarmante pero no aplica aquí.

---

## Paso 3 · Crea las credenciales OAuth

1. Menú izquierdo → **`Clientes`** / `Clients`.
2. **`Crear cliente`** / `Create client`.
3. **Tipo de aplicación**: `Aplicación web`.
4. **Nombre**: `Supabase`.
5. En **`URIs de redireccionamiento autorizados`** → `+ Añadir URI`, pega:

   ```
   https://TU-PROJECT-REF.supabase.co/auth/v1/callback
   ```

   Dos avisos importantes:

   - Debe coincidir **carácter por carácter**: sin barra final, sin espacios.
     Cualquier diferencia produce el error `redirect_uri_mismatch`.
   - **Aquí NO va tu dominio de Vercel.** Google se comunica con Supabase, no
     con tu aplicación. La URL de Vercel se configura en el paso 5.

6. `Crear`. Copia y guarda los dos valores que aparecen:
   - **ID de cliente** → `1234567-abc.apps.googleusercontent.com`
   - **Secreto del cliente** → `GOCSPX-xxxxxxxxxxxx`

---

## Paso 4 · Activa el proveedor en Supabase

1. Supabase → `Authentication` → **`Sign In / Providers`**.
2. Abre **Google** en la lista.
3. Activa **`Enable Sign in with Google`**.
4. Pega el `Client ID` y el `Client Secret` del paso anterior.
5. `Save`.

> 💡 **Verificación rápida:** esa misma pantalla muestra un campo
> **"Callback URL (for OAuth)"**. Cópiala y compárala con la URI que pusiste en
> Google. Si no son idénticas, corrígelo en Google Cloud. Es la forma más fiable
> de descartar el `redirect_uri_mismatch`.

---

## Paso 5 · URLs de redirección en Supabase

Supabase → `Authentication` → **`URL Configuration`**.

1. **Site URL**:

   ```
   https://TU-DOMINIO.vercel.app
   ```

2. **Redirect URLs** → añade estas dos:

   ```
   https://TU-DOMINIO.vercel.app/**
   http://localhost:3000/**
   ```

   El comodín `/**` cubre `/auth/callback` y cualquier ruta futura. Si además
   quieres que funcione en los deploys de preview de Vercel, añade también un
   patrón del tipo `https://*-TU-CUENTA.vercel.app/**`.

3. `Save`.

---

## Paso 6 · Variables de entorno en Vercel

1. Vercel → tu proyecto → `Settings` → `Environment Variables`.
2. Comprueba que existen las tres y que **cada una tiene marcados los tres
   entornos**: `Production`, `Preview` y `Development`.

   | Variable | Valor |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://TU-REF.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la clave `anon public` de `Settings → API` |
   | `NEXT_PUBLIC_SITE_URL` | `https://TU-DOMINIO.vercel.app` |

3. Pestaña `Deployments` → menú `⋯` del último deploy → **`Redeploy`**.
4. **Desmarca `Use existing Build Cache`.**

> **Por qué el paso 4 es obligatorio:** las variables `NEXT_PUBLIC_*` se
> incrustan en el bundle de JavaScript durante el build, no se leen en tiempo de
> ejecución. Si las añades después de un deploy, el servidor las ve pero el
> navegador no, y la app se queda en modo invitado hasta que reconstruyes sin
> caché.

---

## Paso 7 · Comprueba que funciona

1. Abre tu web. El botón superior derecho debe decir **`Entrar con Google`**.
   Si dice `Modo invitado`, las variables no llegaron al bundle → repite el
   paso 6 sin caché.
2. Pulsa, elige tu cuenta y confirma que vuelves a la web con tu nombre arriba.
3. Crea una carrera y pulsa `Guardar en la nube` desde el panel.
4. Menú → `Mis carreras guardadas`: la carrera debe aparecer en la lista.

---

## Diagnóstico de errores

| Síntoma | Causa | Dónde se arregla |
| --- | --- | --- |
| `Error 400: redirect_uri_mismatch` | La URI de Google no coincide con el callback de Supabase | Paso 3 |
| `Acceso bloqueado` / `App no verificada` | La app sigue en modo Prueba y tu correo no está autorizado | Paso 2, opción B |
| El botón dice `Modo invitado` | Las variables no llegaron al bundle de cliente | Paso 6, sin caché |
| `Unsupported provider: provider is not enabled` | El proveedor Google no está activado en Supabase | Paso 4 |
| Login correcto pero vuelve sin sesión | Falta la URL en `Redirect URLs` | Paso 5 |
| Funciona en producción pero no en preview | Las variables no están marcadas para `Preview` | Paso 6 |

---

## Modo invitado

Si no configuras nada de esto, la aplicación **sigue funcionando**: se juega en
modo invitado y la partida se guarda en el `localStorage` del navegador. Lo que
no estará disponible es el guardado en la nube, compartir por enlace y comparar
carreras entre usuarios.
