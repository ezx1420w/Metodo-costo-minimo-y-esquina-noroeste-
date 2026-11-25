/* ==========================================================================
   PROBLEMA DE TRANSPORTE - 7° 3°
   Alumnos: Ezequiel, Veronica, Samaniego, Aguirre

   MÉTODOS IMPLEMENTADOS:
     - Esquina Noroeste   -> resolverEsquinaNoroeste()   (linea ~180)
     - Costo Mínimo       -> resolverCostoMinimo()       (linea ~270)
     - Metodo de Vogel    -> resolverVogel()             (linea ~360)

   ESTRUCTURA DEL ARCHIVO (secciones en orden):
     0. Inicialización y listeners (DOMContentLoaded)
     1. Armado dinámico de la tabla de entrada
     2. Validación de datos y balanceo automático (fila/columna ficticia)
     3. Función coordinadora: resolverProblema()
     ---- ALGORITMOS ----
     4. ESQUINA NOROESTE
     5. COSTO MÍNIMO
     6. MÉTODO DE VOGEL
     ---- VISUALIZACIÓN ----
     7. Renderizado de resultados (compartido por los 3 métodos)
     8. Funciones auxiliares (alertas, reinicio, utilidades)
   ========================================================================== */


/* ==========================================================================
   VARIABLES GLOBALES
   ========================================================================== */

// Dimensiones de la tabla que el usuario generó en pantalla
let totalFilas = 0;
let totalColumnas = 0;


/* ==========================================================================
   0. INICIALIZACIÓN — conectamos botones y teclas con addEventListener
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const inputFilas    = document.getElementById("input-filas");
    const inputColumnas = document.getElementById("input-columnas");
    const btnCrear          = document.getElementById("btn-crear");
    const btnEjemplo        = document.getElementById("btn-ejemplo");
    const btnDesbalanceado  = document.getElementById("btn-desbalanceado");
    const btnReiniciar      = document.getElementById("btn-reiniciar");
    const btnResolver       = document.getElementById("btn-resolver");

    // Usamos addEventListener en todos los botones (ningún onclick en el HTML)
    btnCrear.addEventListener("click", generarTabla);
    btnEjemplo.addEventListener("click", () => cargarEjemplo(false));
    btnDesbalanceado.addEventListener("click", () => cargarEjemplo(true));
    btnReiniciar.addEventListener("click", reiniciarTodo);
    btnResolver.addEventListener("click", resolverProblema);

    // Atajo de teclado: Enter en los campos de filas/columnas genera la tabla
    [inputFilas, inputColumnas].forEach((input) => {
        input.addEventListener("keydown", (evento) => {
            if (evento.key === "Enter") generarTabla();
        });
    });
});


/* ==========================================================================
   1. ARMADO DINÁMICO DE LA TABLA DE ENTRADA
   ========================================================================== */

function generarTabla() {
    const filas    = parseInt(document.getElementById("input-filas").value, 10);
    const columnas = parseInt(document.getElementById("input-columnas").value, 10);

    limpiarAlerta();
    limpiarResultado();

    if (isNaN(filas) || isNaN(columnas)) {
        mostrarAlerta("Ingresá la cantidad de orígenes y destinos.", "error");
        return;
    }
    if (filas < 1 || columnas < 1) {
        mostrarAlerta("Tiene que haber como mínimo 1 origen y 1 destino.", "error");
        return;
    }
    if (filas > 15 || columnas > 15) {
        mostrarAlerta("Se recomienda usar hasta 15 filas y 15 columnas para ver bien la tabla.", "warning");
    }

    totalFilas    = filas;
    totalColumnas = columnas;

    // Construimos el HTML de la tabla con for anidados
    let html = `
        <div class="tabla-scroll">
            <table>
                <thead>
                    <tr>
                        <th>Origenes \\ Destinos</th>
    `;

    for (let j = 0; j < columnas; j++) {
        html += `<th>D${j + 1}</th>`;
    }
    html += `<th>Oferta</th></tr></thead><tbody>`;

    // Una fila por cada origen (O1, O2...) con sus costos y su oferta al final
    for (let i = 0; i < filas; i++) {
        html += `<tr><th>O${i + 1}</th>`;

        for (let j = 0; j < columnas; j++) {
            // data-fila y data-col permiten recuperar cada costo con querySelector
            html += `
                <td>
                    <div class="celda-costo-wrap">
                        <span class="prefijo-peso">$</span>
                        <input type="number" min="0" step="any" class="input-celda input-costo"
                               data-fila="${i}" data-col="${j}" value="0">
                    </div>
                </td>
            `;
        }

        html += `
            <td>
                <input type="number" min="0" step="any" class="input-celda input-oferta"
                       id="oferta-${i}" placeholder="O${i + 1}">
            </td>
        </tr>`;
    }

    // Última fila: demandas de cada destino + celda de control de balance en vivo
    html += `<tr><th>Demanda</th>`;
    for (let j = 0; j < columnas; j++) {
        html += `
            <td>
                <input type="number" min="0" step="any" class="input-celda input-demanda"
                       id="demanda-${j}" placeholder="D${j + 1}">
            </td>
        `;
    }
    html += `
            <td id="celda-balance" class="celda-balance">O: 0<br>D: 0</td>
        </tr>
        </tbody>
        </table>
    </div>`;

    const contenedorTabla = document.getElementById("contenedor-tabla");
    contenedorTabla.innerHTML = html;

    // Mostramos el panel 2 (método + botón resolver)
    document.getElementById("panel-metodo").classList.remove("oculto");

    // Escuchamos el evento "input" en cada campo de oferta y demanda para actualizar el balance
    const inputsBalance = contenedorTabla.querySelectorAll(".input-oferta, .input-demanda");
    inputsBalance.forEach((inp) => {
        inp.addEventListener("input", actualizarBalanceEnVivo);
    });

    actualizarBalanceEnVivo();
}

// Suma oferta y demanda mientras el usuario escribe y muestra si están equilibradas
function actualizarBalanceEnVivo() {
    if (totalFilas === 0 || totalColumnas === 0) return;

    let sumaOferta  = 0;
    let sumaDemanda = 0;

    for (let i = 0; i < totalFilas; i++) {
        const v = parseFloat(document.getElementById(`oferta-${i}`).value);
        if (!isNaN(v) && v >= 0) sumaOferta = redondear(sumaOferta + v);
    }
    for (let j = 0; j < totalColumnas; j++) {
        const v = parseFloat(document.getElementById(`demanda-${j}`).value);
        if (!isNaN(v) && v >= 0) sumaDemanda = redondear(sumaDemanda + v);
    }

    const celdaBalance  = document.getElementById("celda-balance");
    const bannerBalance = document.getElementById("estado-balance");

    if (celdaBalance) {
        celdaBalance.innerHTML = `O: <b>${sumaOferta}</b><br>D: <b>${sumaDemanda}</b>`;
    }

    if (sumaOferta > 0 && sumaDemanda > 0) {
        bannerBalance.classList.remove("oculto");

        if (sumaOferta === sumaDemanda) {
            celdaBalance.className  = "celda-balance celda-balance-ok";
            bannerBalance.className = "estado-balance balance-ok";
            bannerBalance.textContent = `Tabla equilibrada: Oferta total (${sumaOferta}) = Demanda total (${sumaDemanda}).`;
        } else {
            const dif             = redondear(Math.abs(sumaOferta - sumaDemanda));
            const queSeAgrega     = sumaOferta > sumaDemanda ? "una columna ficticia" : "una fila ficticia";
            celdaBalance.className  = "celda-balance celda-balance-ajuste";
            bannerBalance.className = "estado-balance balance-ajuste";
            bannerBalance.textContent = `Tabla desbalanceada: Oferta (${sumaOferta}) y Demanda (${sumaDemanda}). Al resolver se agregará ${queSeAgrega} de ${dif} unidades con costo $0.`;
        }
    } else {
        if (celdaBalance) celdaBalance.className = "celda-balance";
        bannerBalance.classList.add("oculto");
    }
}

// Carga un caso 3x4 de prueba (equilibrado o desbalanceado) para usar en la exposición
function cargarEjemplo(desbalanceado) {
    document.getElementById("input-filas").value    = 3;
    document.getElementById("input-columnas").value = 4;
    generarTabla();

    const costosEj = [
        [10,  2, 20, 11],
        [12,  7,  9, 20],
        [ 4, 14, 16, 18]
    ];
    // Desbalanceado: Oferta = 65, Demanda = 50 -> se creará columna ficticia D5
    const ofertasEj  = desbalanceado ? [25, 25, 15] : [15, 25, 10];
    const demandasEj = [5, 15, 15, 15];

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
            const inp = document.querySelector(`.input-costo[data-fila="${i}"][data-col="${j}"]`);
            if (inp) inp.value = costosEj[i][j];
        }
        document.getElementById(`oferta-${i}`).value = ofertasEj[i];
    }
    for (let j = 0; j < 4; j++) {
        document.getElementById(`demanda-${j}`).value = demandasEj[j];
    }

    actualizarBalanceEnVivo();
    mostrarAlerta(
        desbalanceado
            ? "Ejemplo desbalanceado cargado (Oferta: 65, Demanda: 50). Al resolver se creara la columna ficticia D5."
            : "Ejemplo equilibrado cargado (3 origenes x 4 destinos, total 50 unidades).",
        "info"
    );
}


/* ==========================================================================
   2. VALIDACIÓN DE DATOS Y BALANCEO AUTOMÁTICO (FILA O COLUMNA FICTICIA)

   Esta función lee la tabla, valida todos los campos y, si la oferta y la
   demanda no coinciden, agrega automáticamente:
     - Columna ficticia (Dj extra) si Oferta > Demanda
     - Fila ficticia   (Oi extra) si Demanda > Oferta
   En ambos casos los costos de la fila/columna ficticia son $0.
   ========================================================================== */

function leerYBalancearDatos() {
    if (totalFilas <= 0 || totalColumnas <= 0) {
        return { valido: false, mensaje: "Primero tenes que crear la tabla." };
    }

    const oferta  = [];
    const demanda = [];
    const costos  = [];

    // --- Leer y validar ofertas ---
    for (let i = 0; i < totalFilas; i++) {
        const txt = document.getElementById(`oferta-${i}`).value.trim();
        if (txt === "" || isNaN(Number(txt))) {
            return { valido: false, mensaje: `Falta completar la oferta del origen O${i + 1}.` };
        }
        const v = parseFloat(txt);
        if (v < 0) return { valido: false, mensaje: `La oferta de O${i + 1} no puede ser negativa.` };
        oferta.push(v);
    }

    // --- Leer y validar demandas ---
    for (let j = 0; j < totalColumnas; j++) {
        const txt = document.getElementById(`demanda-${j}`).value.trim();
        if (txt === "" || isNaN(Number(txt))) {
            return { valido: false, mensaje: `Falta completar la demanda del destino D${j + 1}.` };
        }
        const v = parseFloat(txt);
        if (v < 0) return { valido: false, mensaje: `La demanda de D${j + 1} no puede ser negativa.` };
        demanda.push(v);
    }

    // --- Leer y validar matriz de costos ---
    for (let i = 0; i < totalFilas; i++) {
        const fila = [];
        for (let j = 0; j < totalColumnas; j++) {
            const inp = document.querySelector(`.input-costo[data-fila="${i}"][data-col="${j}"]`);
            const txt = inp.value.trim();
            if (txt === "" || isNaN(Number(txt))) {
                return { valido: false, mensaje: `Falta ingresar el costo en (O${i + 1}, D${j + 1}).` };
            }
            const v = parseFloat(txt);
            if (v < 0) return { valido: false, mensaje: `El costo de (O${i + 1}, D${j + 1}) no puede ser negativo.` };
            fila.push(v);
        }
        costos.push(fila);
    }

    let totalOferta  = 0;
    let totalDemanda = 0;
    for (const v of oferta)  totalOferta  = redondear(totalOferta  + v);
    for (const v of demanda) totalDemanda = redondear(totalDemanda + v);

    if (totalOferta === 0 && totalDemanda === 0) {
        return { valido: false, mensaje: "La oferta y la demanda totales tienen que ser mayores a cero." };
    }

    // Copiamos arreglos para no modificar los originales al agregar ficticio
    let filasFinal    = totalFilas;
    let columnasFinal = totalColumnas;
    const costosFinal  = costos.map((f) => [...f]);
    const ofertaFinal  = [...oferta];
    const demandaFinal = [...demanda];
    let ajusteFicticio = null;

    const diferencia = redondear(Math.abs(totalOferta - totalDemanda));

    if (diferencia > 0.000001) {
        if (totalOferta > totalDemanda) {
            // Oferta > Demanda -> agregar columna ficticia (nuevo destino con demanda = diferencia)
            columnasFinal = totalColumnas + 1;
            demandaFinal.push(diferencia);
            for (let i = 0; i < totalFilas; i++) costosFinal[i].push(0);

            ajusteFicticio = {
                tipo: "columna",
                indice: totalColumnas,          // indice 0-based de la columna ficticia
                nombre: `D${totalColumnas + 1}`,
                cantidad: diferencia,
                totalOfertaOriginal:  totalOferta,
                totalDemandaOriginal: totalDemanda,
                explicacion: `La oferta total (${totalOferta}) superaba a la demanda total (${totalDemanda}) por ${diferencia} unidades. Se agrego la columna ficticia D${totalColumnas + 1} con demanda ${diferencia} y costos en $0 para equilibrar la tabla.`
            };
        } else {
            // Demanda > Oferta -> agregar fila ficticia (nuevo origen con oferta = diferencia)
            filasFinal = totalFilas + 1;
            ofertaFinal.push(diferencia);
            const filaCeros = new Array(totalColumnas).fill(0);
            costosFinal.push(filaCeros);

            ajusteFicticio = {
                tipo: "fila",
                indice: totalFilas,             // indice 0-based de la fila ficticia
                nombre: `O${totalFilas + 1}`,
                cantidad: diferencia,
                totalOfertaOriginal:  totalOferta,
                totalDemandaOriginal: totalDemanda,
                explicacion: `La demanda total (${totalDemanda}) superaba a la oferta total (${totalOferta}) por ${diferencia} unidades. Se agrego la fila ficticia O${totalFilas + 1} con oferta ${diferencia} y costos en $0 para equilibrar la tabla.`
            };
        }
    }

    return {
        valido: true,
        filasFinal,
        columnasFinal,
        costos: costosFinal,
        oferta: ofertaFinal,
        demanda: demandaFinal,
        totalEquilibrado: Math.max(totalOferta, totalDemanda),
        ajusteFicticio
    };
}


/* ==========================================================================
   3. FUNCIÓN COORDINADORA: resolverProblema()
   Lee el radio seleccionado y llama al algoritmo correspondiente.
   ========================================================================== */

function resolverProblema() {
    limpiarAlerta();
    limpiarResultado();

    const datos = leerYBalancearDatos();
    if (!datos.valido) {
        mostrarAlerta(datos.mensaje, "error");
        return;
    }

    const radio  = document.querySelector('input[name="metodo"]:checked');
    const metodo = radio ? radio.value : "costominimo";

    let solucion;
    let nombreMetodo;

    if (metodo === "noroeste") {
        nombreMetodo = "Metodo de la Esquina Noroeste";
        solucion = resolverEsquinaNoroeste(
            datos.filasFinal, datos.columnasFinal,
            datos.costos, datos.oferta, datos.demanda,
            datos.ajusteFicticio
        );

    } else if (metodo === "vogel") {
        nombreMetodo = "Metodo de Vogel";
        solucion = resolverVogel(
            datos.filasFinal, datos.columnasFinal,
            datos.costos, datos.oferta, datos.demanda,
            datos.ajusteFicticio
        );

    } else {
        // Valor por defecto: "costominimo"
        nombreMetodo = "Metodo del Costo Minimo";
        solucion = resolverCostoMinimo(
            datos.filasFinal, datos.columnasFinal,
            datos.costos, datos.oferta, datos.demanda,
            datos.ajusteFicticio
        );
    }

    mostrarResultados(solucion, datos, nombreMetodo);
}


/* ==========================================================================
   4. ALGORITMO: ESQUINA NOROESTE
   --------------------------------------------------------------------------
   Idea:
     - Siempre empezamos en la celda superior izquierda (i=0, j=0).
     - Asignamos el mínimo entre la oferta restante de la fila y la demanda
       restante de la columna.
     - Si se agotó la fila, bajamos (i++).
       Si se agotó la columna, avanzamos a la derecha (j++).
       Si se agotaron las dos al mismo tiempo, avanzamos en diagonal (i++, j++).
     - Repetimos hasta haber asignado toda la tabla.

   Inicio del bloque ESQUINA NOROESTE
   ========================================================================== */

function resolverEsquinaNoroeste(filas, columnas, costos, oferta, demanda, ajusteFicticio) {
    const ofertaRest  = [...oferta];
    const demandaRest = [...demanda];
    const asignacion  = crearMatrizCeros(filas, columnas);
    const pasos       = [];

    let i = 0;   // fila actual (origen)
    let j = 0;   // columna actual (destino)
    let numeroPaso = 1;
    let costoTotal = 0;

    while (i < filas && j < columnas) {
        const dispO    = ofertaRest[i];
        const dispD    = demandaRest[j];
        const cantidad = Math.min(dispO, dispD);    // asignamos lo máximo posible
        const costoUnit = costos[i][j];
        const subtotal  = redondear(cantidad * costoUnit);

        asignacion[i][j] = cantidad;
        costoTotal = redondear(costoTotal + subtotal);
        ofertaRest[i]  = redondear(ofertaRest[i]  - cantidad);
        demandaRest[j] = redondear(demandaRest[j] - cantidad);

        const esFic = esCeldaFicticia(i, j, ajusteFicticio);
        const nO = `O${i + 1}`;
        const nD = `D${j + 1}`;
        let detalle = "";

        // Determinamos el siguiente movimiento según qué se agotó
        if (ofertaRest[i] === 0 && demandaRest[j] === 0) {
            if (i < filas - 1 && j < columnas - 1) {
                detalle = `Empate: se agotaron ${nO} y ${nD}; avanzamos en diagonal a (O${i+2}, D${j+2}).`;
                i++; j++;
            } else if (i < filas - 1) {
                detalle = `Se agotaron ${nO} y ${nD}; bajamos a O${i+2}.`;
                i++;
            } else if (j < columnas - 1) {
                detalle = `Se agotaron ${nO} y ${nD}; pasamos a D${j+2}.`;
                j++;
            } else {
                detalle = `Se completaron ${nO} y ${nD}. Fin del algoritmo.`;
                i++; j++;
            }
        } else if (ofertaRest[i] === 0) {
            detalle = `Se agoto la oferta de ${nO}; bajamos a O${i+2}.`;
            i++;
        } else {
            detalle = `Se cubrio la demanda de ${nD}; avanzamos a D${j+2}.`;
            j++;
        }

        if (esFic) detalle += " (Celda ficticia, costo $0)";

        pasos.push({
            paso: numeroPaso++,
            celda: `${nO} -> ${nD}${esFic ? " [Fic]" : ""}`,
            dispO, dispD, cantidad, costoUnit, subtotal,
            detalle
        });
    }

    return { asignacion, costoTotal, pasos };
}

/* Fin del bloque ESQUINA NOROESTE ========================================== */


/* ==========================================================================
   5. ALGORITMO: COSTO MÍNIMO
   --------------------------------------------------------------------------
   Idea:
     - En cada iteración recorremos TODA la matriz buscando la celda
       disponible con el menor costo unitario.
     - Solo consideramos celdas donde quede oferta en la fila Y demanda
       en la columna.
     - Asignamos el mínimo entre oferta y demanda de esa celda.
     - Eliminamos la fila o columna agotada y repetimos.

   Inicio del bloque COSTO MÍNIMO
   ========================================================================== */

function resolverCostoMinimo(filas, columnas, costos, oferta, demanda, ajusteFicticio) {
    const ofertaRest  = [...oferta];
    const demandaRest = [...demanda];
    const asignacion  = crearMatrizCeros(filas, columnas);
    const pasos       = [];
    let numeroPaso = 1;
    let costoTotal = 0;

    while (true) {
        // Buscamos la celda disponible con el menor costo
        let mejFila = -1;
        let mejCol  = -1;
        let minCosto = Infinity;

        for (let i = 0; i < filas; i++) {
            if (ofertaRest[i] <= 0) continue;
            for (let j = 0; j < columnas; j++) {
                if (demandaRest[j] <= 0) continue;
                if (costos[i][j] < minCosto) {
                    minCosto = costos[i][j];
                    mejFila  = i;
                    mejCol   = j;
                }
            }
        }

        // Si no encontramos ninguna celda disponible, terminamos
        if (mejFila === -1) break;

        const dispO    = ofertaRest[mejFila];
        const dispD    = demandaRest[mejCol];
        const cantidad = Math.min(dispO, dispD);
        const subtotal = redondear(cantidad * minCosto);

        asignacion[mejFila][mejCol] = cantidad;
        costoTotal = redondear(costoTotal + subtotal);
        ofertaRest[mejFila]  = redondear(ofertaRest[mejFila]  - cantidad);
        demandaRest[mejCol]  = redondear(demandaRest[mejCol]  - cantidad);

        const esFic = esCeldaFicticia(mejFila, mejCol, ajusteFicticio);
        const nO = `O${mejFila + 1}`;
        const nD = `D${mejCol  + 1}`;
        let detalle = `Menor costo disponible ($${minCosto}). `;

        if (ofertaRest[mejFila] === 0 && demandaRest[mejCol] === 0) {
            detalle += `Se agotaron ${nO} y ${nD}.`;
        } else if (ofertaRest[mejFila] === 0) {
            detalle += `Se agoto la oferta de ${nO}.`;
        } else {
            detalle += `Se cubrio la demanda de ${nD}.`;
        }
        if (esFic) detalle += " (Celda ficticia)";

        pasos.push({
            paso: numeroPaso++,
            celda: `${nO} -> ${nD}${esFic ? " [Fic]" : ""}`,
            dispO, dispD, cantidad, costoUnit: minCosto, subtotal,
            detalle
        });
    }

    return { asignacion, costoTotal, pasos };
}

/* Fin del bloque COSTO MÍNIMO ============================================= */


/* ==========================================================================
   6. ALGORITMO: MÉTODO DE VOGEL (VAM - Vogel's Approximation Method)
   --------------------------------------------------------------------------
   Idea:
     - En cada iteración calculamos la PENALIDAD de cada fila y columna.
       La penalidad es la diferencia entre el menor y el segundo menor
       costo disponible en esa fila o columna.
       (Si solo hay un costo disponible, la penalidad es ese mismo costo.)
     - Elegimos la fila o columna con la mayor penalidad.
     - En esa fila/columna asignamos el máximo posible a la celda de menor costo.
     - Eliminamos la fila o columna que se agotó y repetimos.
     Esta estrategia tiende a dar una solución inicial más cercana al óptimo
     que los otros dos métodos.

   Inicio del bloque VOGEL
   ========================================================================== */

function resolverVogel(filas, columnas, costos, oferta, demanda, ajusteFicticio) {
    const ofertaRest  = [...oferta];
    const demandaRest = [...demanda];
    const asignacion  = crearMatrizCeros(filas, columnas);
    const pasos       = [];

    // filasActivas[i] = true  mientras la fila i todavía tiene oferta > 0
    // colsActivas[j]  = true  mientras la columna j todavía tiene demanda > 0
    const filasActivas = new Array(filas).fill(true);
    const colsActivas  = new Array(columnas).fill(true);

    let numeroPaso = 1;
    let costoTotal = 0;

    /*
     * calcularPenalidades():
     * Para cada fila y columna activa, buscamos el primer y segundo menor costo.
     * La penalidad = segundo_menor - primer_menor.
     * Si la fila/columna tiene solo una celda disponible, la penalidad = ese costo.
     * Devolvemos un arreglo de objetos { tipo, indice, penalidad, mejorCelda }.
     */
    function calcularPenalidades() {
        const lista = [];

        // Penalidades de filas
        for (let i = 0; i < filas; i++) {
            if (!filasActivas[i]) continue;

            const costosDisponibles = [];
            for (let j = 0; j < columnas; j++) {
                if (colsActivas[j]) costosDisponibles.push({ costo: costos[i][j], col: j });
            }
            if (costosDisponibles.length === 0) continue;

            costosDisponibles.sort((a, b) => a.costo - b.costo);
            const menor        = costosDisponibles[0];
            const segundoMenor = costosDisponibles[1] || menor; // si solo hay uno, penalidad = ese costo
            const penalidad    = redondear(segundoMenor.costo - menor.costo);

            lista.push({
                tipo:       "fila",
                indice:     i,
                penalidad,
                mejorFila:  i,
                mejorCol:   menor.col,
                mejorCosto: menor.costo,
                // Texto descriptivo para mostrar en el paso a paso
                descripcion: `Fila O${i+1}: penalidad = $${segundoMenor.costo} - $${menor.costo} = $${penalidad}`
            });
        }

        // Penalidades de columnas
        for (let j = 0; j < columnas; j++) {
            if (!colsActivas[j]) continue;

            const costosDisponibles = [];
            for (let i = 0; i < filas; i++) {
                if (filasActivas[i]) costosDisponibles.push({ costo: costos[i][j], fila: i });
            }
            if (costosDisponibles.length === 0) continue;

            costosDisponibles.sort((a, b) => a.costo - b.costo);
            const menor        = costosDisponibles[0];
            const segundoMenor = costosDisponibles[1] || menor;
            const penalidad    = redondear(segundoMenor.costo - menor.costo);

            lista.push({
                tipo:       "columna",
                indice:     j,
                penalidad,
                mejorFila:  menor.fila,
                mejorCol:   j,
                mejorCosto: menor.costo,
                descripcion: `Col D${j+1}: penalidad = $${segundoMenor.costo} - $${menor.costo} = $${penalidad}`
            });
        }

        return lista;
    }

    // Bucle principal de Vogel
    while (true) {
        const penalidades = calcularPenalidades();
        if (penalidades.length === 0) break;

        // Elegimos la fila o columna con la mayor penalidad
        // En caso de empate, priorizamos la que tenga el menor costo de asignación
        penalidades.sort((a, b) => {
            if (b.penalidad !== a.penalidad) return b.penalidad - a.penalidad;
            return a.mejorCosto - b.mejorCosto;
        });
        const elegida = penalidades[0];

        const fi = elegida.mejorFila;
        const fj = elegida.mejorCol;

        // Si por alguna razón la celda elegida ya no tiene oferta/demanda, salimos
        if (ofertaRest[fi] <= 0 || demandaRest[fj] <= 0) break;

        const dispO    = ofertaRest[fi];
        const dispD    = demandaRest[fj];
        const cantidad = Math.min(dispO, dispD);
        const costoUnit = costos[fi][fj];
        const subtotal  = redondear(cantidad * costoUnit);

        asignacion[fi][fj] = cantidad;
        costoTotal = redondear(costoTotal + subtotal);
        ofertaRest[fi]  = redondear(ofertaRest[fi]  - cantidad);
        demandaRest[fj] = redondear(demandaRest[fj] - cantidad);

        // Desactivamos la fila o columna agotada
        if (ofertaRest[fi] <= 0)  filasActivas[fi] = false;
        if (demandaRest[fj] <= 0) colsActivas[fj]  = false;

        const esFic = esCeldaFicticia(fi, fj, ajusteFicticio);
        const nO = `O${fi + 1}`;
        const nD = `D${fj + 1}`;

        // Construimos el detalle para mostrar en el paso a paso
        // Incluimos la penalidad que motivó la elección
        const todasLasPenalidades = penalidades.map((p) => p.descripcion).join(" | ");
        let detalle = `Mayor penalidad: ${elegida.descripcion}. Asignacion en celda de menor costo ($${costoUnit}). `;

        if (ofertaRest[fi] === 0 && demandaRest[fj] === 0) {
            detalle += `Se agotaron ${nO} y ${nD}.`;
        } else if (ofertaRest[fi] === 0) {
            detalle += `Se agoto la oferta de ${nO}; esa fila queda inactiva.`;
        } else {
            detalle += `Se cubrio la demanda de ${nD}; esa columna queda inactiva.`;
        }
        if (esFic) detalle += " (Celda ficticia, costo $0)";

        pasos.push({
            paso: numeroPaso++,
            celda: `${nO} -> ${nD}${esFic ? " [Fic]" : ""}`,
            dispO, dispD, cantidad, costoUnit, subtotal,
            detalle,
            // Campo extra solo para Vogel: guardamos todas las penalidades calculadas en este paso
            penalidades: todasLasPenalidades
        });
    }

    return { asignacion, costoTotal, pasos };
}

/* Fin del bloque VOGEL ===================================================== */


/* ==========================================================================
   7. RENDERIZADO DE RESULTADOS
   Función compartida por los 3 métodos. Recibe la solución y genera el HTML
   con: resumen de métricas, matriz de asignaciones, fórmula Z y paso a paso.
   ========================================================================== */

function mostrarResultados(solucion, datos, nombreMetodo) {
    const { asignacion, costoTotal, pasos } = solucion;
    const { filasFinal, columnasFinal, costos, oferta, demanda, totalEquilibrado, ajusteFicticio } = datos;

    // Contamos las celdas usadas y armamos la suma de la fórmula Z
    let enviosRealizados = 0;
    const terminosZ = [];
    for (let i = 0; i < filasFinal; i++) {
        for (let j = 0; j < columnasFinal; j++) {
            if (asignacion[i][j] > 0) {
                enviosRealizados++;
                terminosZ.push(`(${asignacion[i][j]} x $${costos[i][j]})`);
            }
        }
    }

    // --- Encabezado con las tres tarjetas de métricas ---
    let html = `
        <section class="panel-resultado">
            <h2>Resultado - ${nombreMetodo}</h2>

            <div class="resumen-resultado">
                <div class="dato-resumen dato-destacado">
                    <span>Costo total (Z)</span>
                    <strong>$${costoTotal.toLocaleString("es-AR")}</strong>
                </div>
                <div class="dato-resumen">
                    <span>Total de unidades</span>
                    <strong>${totalEquilibrado.toLocaleString("es-AR")}</strong>
                </div>
                <div class="dato-resumen">
                    <span>Celdas con envio</span>
                    <strong>${enviosRealizados}</strong>
                </div>
            </div>
    `;

    // --- Matriz de asignaciones ---
    html += `<h3>Matriz de asignaciones</h3><div class="tabla-scroll"><table><thead><tr><th>Origenes \\ Destinos</th>`;

    for (let j = 0; j < columnasFinal; j++) {
        const esFicCol = ajusteFicticio && ajusteFicticio.tipo === "columna" && j === ajusteFicticio.indice;
        html += `
            <th class="${esFicCol ? "th-ficticio" : ""}">
                D${j + 1}${esFicCol ? '<br><span class="etiqueta-ficticio">(Ficticio)</span>' : ""}
            </th>
        `;
    }
    html += `<th>Oferta</th></tr></thead><tbody>`;

    for (let i = 0; i < filasFinal; i++) {
        const esFicFila = ajusteFicticio && ajusteFicticio.tipo === "fila" && i === ajusteFicticio.indice;
        let sumaFila = 0;

        html += `
            <tr>
                <th class="${esFicFila ? "th-ficticio" : ""}">
                    O${i + 1}${esFicFila ? '<br><span class="etiqueta-ficticio">(Ficticio)</span>' : ""}
                </th>
        `;

        for (let j = 0; j < columnasFinal; j++) {
            const cant    = asignacion[i][j];
            sumaFila = redondear(sumaFila + cant);
            const esFic   = esCeldaFicticia(i, j, ajusteFicticio);

            if (cant > 0) {
                const sub = redondear(cant * costos[i][j]);
                html += `
                    <td class="${esFic ? "celda-asignada-ficticia" : "celda-asignada"}">
                        <div class="cant-asignada">${cant}</div>
                        <div class="detalle-celda">$${costos[i][j]} c/u (Sub: $${sub})</div>
                    </td>
                `;
            } else {
                html += `
                    <td class="celda-vacia">
                        -<br>($${costos[i][j]})
                    </td>
                `;
            }
        }
        html += `<td class="celda-total">${sumaFila} / ${oferta[i]}</td></tr>`;
    }

    // Fila de totales de demanda
    html += `<tr><th>Demanda</th>`;
    for (let j = 0; j < columnasFinal; j++) {
        let sumaCol = 0;
        for (let i = 0; i < filasFinal; i++) sumaCol = redondear(sumaCol + asignacion[i][j]);
        html += `<td class="celda-total">${sumaCol} / ${demanda[j]}</td>`;
    }
    html += `<td class="celda-balance-final">${totalEquilibrado}</td></tr>`;
    html += `</tbody></table></div>`;

    // --- Fórmula del costo total ---
    html += `
        <h3>Calculo del costo total (Z)</h3>
        <div class="caja-formula">
            <div class="formula-texto">Z = ${terminosZ.length > 0 ? terminosZ.join(" + ") : "0"}</div>
            <div class="formula-total">Z = $${costoTotal.toLocaleString("es-AR")}</div>
        </div>
    `;

    // --- Tabla paso a paso ---
    html += `
        <h3>Paso a paso</h3>
        <div class="tabla-scroll">
            <table class="tabla-pasos">
                <thead>
                    <tr>
                        <th>Paso</th>
                        <th>Celda</th>
                        <th>Oferta disp.</th>
                        <th>Demanda disp.</th>
                        <th>Asignado</th>
                        <th>Costo unit.</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
    `;

    pasos.forEach((p) => {
        html += `
            <tr>
                <td>${p.paso}</td>
                <td><b>${p.celda}</b></td>
                <td>${p.dispO}</td>
                <td>${p.dispD}</td>
                <td><b>${p.cantidad}</b></td>
                <td>$${p.costoUnit}</td>
                <td>$${p.subtotal}</td>
            </tr>
        `;
    });

    html += `</tbody></table></div></section>`;

    const contenedorResultado = document.getElementById("resultado");
    contenedorResultado.innerHTML = html;
    contenedorResultado.scrollIntoView({ behavior: "smooth", block: "start" });
}


/* ==========================================================================
   8. FUNCIONES AUXILIARES
   ========================================================================== */

// Evita errores de coma flotante (ej: 0.1 + 0.2 = 0.30000000000000004)
function redondear(numero) {
    return Math.round(numero * 1000000) / 1000000;
}

// Crea una matriz de 'filas' x 'columnas' con todos los valores en 0
function crearMatrizCeros(filas, columnas) {
    const m = [];
    for (let i = 0; i < filas; i++) {
        m.push(new Array(columnas).fill(0));
    }
    return m;
}

// Devuelve true si la coordenada (fila, col) pertenece a la fila o columna ficticia
function esCeldaFicticia(fila, col, ajusteFicticio) {
    if (!ajusteFicticio) return false;
    if (ajusteFicticio.tipo === "fila"    && fila === ajusteFicticio.indice) return true;
    if (ajusteFicticio.tipo === "columna" && col  === ajusteFicticio.indice) return true;
    return false;
}

function mostrarAlerta(mensaje, tipo) {
    const caja = document.getElementById("mensaje-alerta");
    if (!caja) return;
    caja.className   = `alerta alerta-${tipo}`;
    caja.textContent = mensaje;
}

function limpiarAlerta() {
    const caja = document.getElementById("mensaje-alerta");
    if (!caja) return;
    caja.textContent = "";
    caja.className   = "alerta oculto";
}

function limpiarResultado() {
    const contenedor = document.getElementById("resultado");
    if (contenedor) contenedor.innerHTML = "";
}

function reiniciarTodo() {
    document.getElementById("input-filas").value    = "";
    document.getElementById("input-columnas").value = "";
    document.getElementById("contenedor-tabla").innerHTML = "";
    document.getElementById("panel-metodo").classList.add("oculto");
    document.getElementById("estado-balance").classList.add("oculto");

    totalFilas    = 0;
    totalColumnas = 0;

    limpiarAlerta();
    limpiarResultado();
    mostrarAlerta("Formulario reiniciado. Ingresá nuevas dimensiones para empezar.", "info");
}
