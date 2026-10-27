import { crearEquipo, listarCategorias } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const $form = document.querySelector("#form-equipo");
const $selectCategoria = document.querySelector("#categoria_id");
const $btnGuardar = document.querySelector("#btn-guardar");

/**
 * TODO [F3] Formulario de registro de equipos.
 *
 * iniciarFormulario({ alGuardar }):
 *  1. Llene el <select id="categoria_id"> con listarCategorias()
 *     (cree cada <option> con createElement, value = id, texto = nombre).
 *  2. Al enviar el formulario (submit):
 *     - Evite el envío tradicional.
 *     - Limpie los errores anteriores: textContent de [data-error] y aria-invalid de los campos.
 *     - Construya el objeto con FormData. categoria_id y costo_interno deben ir como números.
 *     - Deshabilite #btn-guardar y cambie su texto a "Guardando…" mientras espera.
 *     - Llame a crearEquipo(datos).
 *     - Éxito: limpie el formulario, mostrarMensaje("exito", "Equipo <codigo> registrado.")
 *              y llame a alGuardar().
 *     - 422: por cada campo de error.datos.errors, escriba el PRIMER mensaje en
 *            el <p data-error="<campo>"> y marque el campo con aria-invalid="true".
 *     - Otro error: mostrarMensaje("error", ...).
 *     - Siempre (finally): rehabilite el botón y restaure su texto.
 */
export const iniciarFormulario = ({ alGuardar }) => {
  listarCategorias()
    .then((respuesta) => {
      (respuesta.data || []).forEach((cat) => {
        const $opcion = document.createElement("option");
        $opcion.value = cat.id;
        $opcion.textContent = cat.nombre;
        $selectCategoria.appendChild($opcion);
      });
    })
    .catch(() => {
      mostrarMensaje("error", "Error al cargar las categorías.");
    });

  $form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    $form.querySelectorAll("[data-error]").forEach(($p) => ($p.textContent = ""));
    $form.querySelectorAll("[aria-invalid]").forEach(($input) => $input.removeAttribute("aria-invalid"));

    const formData = new FormData($form);
    const datos = {
      codigo: formData.get("codigo")?.trim(),
      nombre: formData.get("nombre")?.trim(),
      categoria_id: Number(formData.get("categoria_id")),
      fecha_adquisicion: formData.get("fecha_adquisicion"),
      costo_interno: Number(formData.get("costo_interno")),
    };

    const textoOriginal = $btnGuardar.textContent;
    $btnGuardar.disabled = true;
    $btnGuardar.textContent = "Guardando…";

    try {
      await crearEquipo(datos);
      $form.reset();
      mostrarMensaje("exito", `Equipo ${datos.codigo} registrado.`);
      if (alGuardar) {
        alGuardar();
      }
    } catch (error) {
      if (error.status === 422 && error.datos?.errors) {
        for (const [campo, mensajes] of Object.entries(error.datos.errors)) {
          const $pError = $form.querySelector(`[data-error="${campo}"]`);
          const $input = $form.querySelector(`[name="${campo}"]`);

          if ($pError && mensajes.length > 0) {
            $pError.textContent = mensajes[0];
          }
          if ($input) {
            $input.setAttribute("aria-invalid", "true");
          }
        }
      } else {
        mostrarMensaje("error", error.message || "Error al registrar el equipo.");
      }
    } finally {
      $btnGuardar.disabled = false;
      $btnGuardar.textContent = textoOriginal;
    }
  });
};
