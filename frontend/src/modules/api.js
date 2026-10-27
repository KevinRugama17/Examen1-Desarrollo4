import { BASE_URL, TIEMPO_MAXIMO_MS } from "./config.js";
import { ErrorApi } from "./errores.js";
import { obtenerToken, olvidarSesion } from "./auth.js";

/**
 * TODO [F1] Cliente HTTP único de la aplicación.
 *
 * request(ruta, opciones) debe:
 *  1. Construir la URL como BASE_URL + ruta   (ej. request("/equipos?page=2"))
 *  2. Enviar siempre "Accept: application/json".
 *  3. Si hay token, enviar "Authorization: Bearer <token>" (nunca en la URL).
 *  4. Si opciones.body es un objeto, enviarlo como JSON
 *     ("Content-Type: application/json" + JSON.stringify).
 *  5. Cancelar la petición si tarda más de TIEMPO_MAXIMO_MS (AbortController).
 *  6. Si la respuesta es 204, devolver null.
 *  7. Si response.ok es false, lanzar new ErrorApi(response.status, cuerpoJson).
 *     Si el estado es 401, además llamar a olvidarSesion() y recargar la página.
 *  8. En cualquier otro caso, devolver el cuerpo JSON.
 *
 * Ningún otro archivo debe llamar a fetch directamente (salvo auth.js, ya hecho).
 */
export const request = async (ruta, opciones = {}) => {
  const url = `${BASE_URL}${ruta}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIEMPO_MAXIMO_MS);

  const headers = {
    Accept: "application/json",
    ...opciones.headers,
  };

  const token = obtenerToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body = opciones.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  try {
    const respuesta = await fetch(url, {
      ...opciones,
      headers,
      body,
      signal: controller.signal,
    });

    if (respuesta.status === 204) {
      return null;
    }

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        olvidarSesion();
        location.reload();
        return;
      }
      throw new ErrorApi(respuesta.status, datos);
    }

    return datos;
  } finally {
    clearTimeout(timer);
  }
};
