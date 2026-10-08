/**
 * RESOLUCIÓN DE PROBLEMAS DE TRANSPORTE
 * Método de la Esquina Noroeste (con Balanceo Automático por Fila/Columna Ficticia)
 * Asignatura: Investigación Operativa / Modelos de Transporte
 * Curso: 7º 3º
 * Autores: Ezequiel, Veronica, Samaniego, Aguirre
 */

// Estado global de la aplicación
const AppState = {
    rows: 0,
    cols: 0,
    costos: [],
    oferta: [],
    demanda: []
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    const inputRows = document.getElementById('rows');
    const inputCols = document.getElementById('cols');

    [inputRows, inputCols].forEach(input => {
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') generarTabla();
            });
        }
    });
});

/**
 * Genera dinámicamente la tabla interactiva de costos, oferta y demanda
 */
function generarTabla() {
    const inputRows = document.getElementById('rows');
    const inputCols = document.getElementById('cols');
    const R = parseInt(inputRows.value);
    const C = parseInt(inputCols.value);

    limpiarAlerta();
    limpiarResultado();

    // Validaciones de dimensiones
    if (isNaN(R) || isNaN(C)) {
        mostrarAlerta('Por favor, ingresa tanto la cantidad de orígenes como de destinos.', 'error');
        return;
    }

    if (R < 1 || C < 1) {
        mostrarAlerta('La cantidad de orígenes y destinos debe ser como mínimo 1.', 'error');
        return;
    }

    if (R > 15 || C > 15) {
        mostrarAlerta('Por razones de legibilidad, el límite sugerido es de hasta 15 orígenes y 15 destinos.', 'warning');
    }

    AppState.rows = R;
    AppState.cols = C;

    // Estructura de la tabla
    let html = `
        <div class="tabla-responsiva">
            <table class="matriz-datos">
                <thead>
                    <tr>
                        <th class="th-esquina">Orígenes \\ Destinos</th>
    `;

    for (let j = 0; j < C; j++) {
        html += `<th class="th-destino">D${j + 1}</th>`;
    }
    html += `<th class="th-oferta">Oferta ($S_i$)</th></tr></thead><tbody>`;

    // Filas de orígenes con costos y oferta
    for (let i = 0; i < R; i++) {
        html += `<tr><th class="th-origen">O${i + 1}</th>`;
        for (let j = 0; j < C; j++) {
            html += `
                <td class="td-costo">
                    <div class="input-grupo-costo">
                        <span class="costo-prefijo">$</span>
                        <input type="number" min="0" step="any" class="input-celda input-costo" 
                               data-r="${i}" data-c="${j}" placeholder="0" value="0">
                    </div>
                </td>
            `;
        }
        html += `
            <td class="td-oferta">
                <input type="number" min="0" step="any" class="input-celda input-supply" 
                       id="s${i}" data-r="${i}" placeholder="Oferta ${i + 1}" oninput="actualizarBalanceEnVivo()">
            </td>
        </tr>`;
    }

    // Fila inferior de demandas
    html += `<tr><th class="th-demanda-label">Demanda ($D_j$)</th>`;
    for (let j = 0; j < C; j++) {
        html += `
            <td class="td-demanda">
                <input type="number" min="0" step="any" class="input-celda input-demand" 
                       id="d${j}" data-c="${j}" placeholder="Demanda ${j + 1}" oninput="actualizarBalanceEnVivo()">
            </td>
        `;
    }

    // Celda de resumen de balance en vivo
    html += `
            <td class="td-balance-resumen" id="balance-live-celda" title="Total Oferta / Total Demanda">
                <span id="txt-balance-live">Σ = 0 / 0</span>
            </td>
        </tr>
        </tbody>
        </table>
    </div>`;

    document.getElementById('contenedor-tabla').innerHTML = html;
    document.getElementById('controles-solucion').style.display = 'block';

    document.getElementById('contenedor-tabla').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    actualizarBalanceEnVivo();
}

/**
 * Calcula y muestra el estado de balance en vivo mientras el usuario teclea
 */
function actualizarBalanceEnVivo() {
    const R = AppState.rows;
    const C = AppState.cols;
    if (R === 0 || C === 0) return;

    let totalO = 0;
    let totalD = 0;

    for (let i = 0; i < R; i++) {
        const val = parseFloat(document.getElementById(`s${i}`)?.value);
        if (!isNaN(val) && val >= 0) totalO += val;
    }

    for (let j = 0; j < C; j++) {
        const val = parseFloat(document.getElementById(`d${j}`)?.value);
        if (!isNaN(val) && val >= 0) totalD += val;
    }

    const celda = document.getElementById('balance-live-celda');
    const txt = document.getElementById('txt-balance-live');
    const banner = document.getElementById('banner-balance');

    if (celda && txt) {
        txt.innerHTML = `O: <b>${totalO}</b><br>D: <b>${totalD}</b>`;

        if (totalO > 0 && totalD > 0) {
            if (totalO === totalD) {
                celda.className = 'td-balance-resumen balance-ok';
                if (banner) {
                    banner.className = 'banner-status banner-ok';
                    banner.innerHTML = `✓ Problema Equilibrado: Oferta Total (${totalO}) = Demanda Total (${totalD})`;
                    banner.style.display = 'block';
                }
            } else {
                celda.className = 'td-balance-resumen balance-info-ajuste';
                if (banner) {
                    const dif = Math.abs(totalO - totalD);
                    const elemento = totalO > totalD ? 'Columna Ficticia (Destino Ficticio)' : 'Fila Ficticia (Origen Ficticio)';
                    banner.className = 'banner-status banner-info-ficticio';
                    banner.innerHTML = `ℹ Falta de Coincidencia: Oferta (${totalO}) ≠ Demanda (${totalD}) | Al resolver, se creará automáticamente una <b>${elemento}</b> de <b>${dif} unidades</b> con costo $0.`;
                    banner.style.display = 'block';
                }
            }
        } else {
            celda.className = 'td-balance-resumen';
            if (banner) banner.style.display = 'none';
        }
    }
}

/**
 * Carga un ejemplo típico de prueba
 * @param {boolean} desbalanceado - Si es true, carga un caso desbalanceado para demostrar la creación de elementos ficticios
 */
function cargarEjemplo(desbalanceado = false) {
    document.getElementById('rows').value = 3;
    document.getElementById('cols').value = 4;
    generarTabla();

    // Costos de ejemplo
    const matrizEjemplo = [
        [10, 2, 20, 11],
        [12, 7,  9, 20],
        [ 4, 14, 16, 18]
    ];

    let ofertasEjemplo = [15, 25, 10]; // Suma = 50
    let demandasEjemplo = [5, 15, 15, 15]; // Suma = 50

    if (desbalanceado) {
        // Caso desbalanceado: Oferta = 65, Demanda = 50 (Exceso de 15 unidades en Oferta -> Creará Columna Ficticia)
        ofertasEjemplo = [25, 25, 15]; // Suma = 65
    }

    // Rellenar costos
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
            const input = document.querySelector(`.input-costo[data-r="${i}"][data-c="${j}"]`);
            if (input) input.value = matrizEjemplo[i][j];
        }
        const sInput = document.getElementById(`s${i}`);
        if (sInput) sInput.value = ofertasEjemplo[i];
    }

    // Rellenar demandas
    for (let j = 0; j < 4; j++) {
        const dInput = document.getElementById(`d${j}`);
        if (dInput) dInput.value = demandasEjemplo[j];
    }

    actualizarBalanceEnVivo();

    if (desbalanceado) {
        mostrarAlerta('Ejemplo Desbalanceado cargado (Oferta: 65, Demanda: 50). Al hacer clic en "Resolver", se creará automáticamente una Columna Ficticia de 15 unidades con costo $0.', 'info');
    } else {
        mostrarAlerta('Ejemplo Equilibrado cargado (3 orígenes × 4 destinos, 50 unidades). Haz clic en "Resolver" para ver los resultados.', 'info');
    }
}

/**
 * Obtiene y valida los datos de la matriz.
 * Si la oferta y la demanda no coinciden, genera automáticamente la fila o columna ficticia correspondiente.
 */
function obtenerYValidarDatos() {
    const R = AppState.rows;
    const C = AppState.cols;

    if (R <= 0 || C <= 0) {
        return { valido: false, mensaje: 'Primero debes generar la tabla de datos ingresando las dimensiones.' };
    }

    let costos = [];
    let oferta = [];
    let demanda = [];

    // Validar y leer ofertas
    for (let i = 0; i < R; i++) {
        const raw = document.getElementById(`s${i}`)?.value.trim();
        if (raw === '' || isNaN(Number(raw))) {
            return { valido: false, mensaje: `Falta ingresar un valor numérico para la oferta del Origen O${i + 1}.` };
        }
        const val = parseFloat(raw);
        if (val < 0) {
            return { valido: false, mensaje: `La oferta del Origen O${i + 1} no puede ser un número negativo (${val}).` };
        }
        oferta.push(val);
    }

    // Validar y leer demandas
    for (let j = 0; j < C; j++) {
        const raw = document.getElementById(`d${j}`)?.value.trim();
        if (raw === '' || isNaN(Number(raw))) {
            return { valido: false, mensaje: `Falta ingresar un valor numérico para la demanda del Destino D${j + 1}.` };
        }
        const val = parseFloat(raw);
        if (val < 0) {
            return { valido: false, mensaje: `La demanda del Destino D${j + 1} no puede ser un número negativo (${val}).` };
        }
        demanda.push(val);
    }

    // Validar y leer matriz de costos
    for (let i = 0; i < R; i++) {
        let filaCostos = [];
        for (let j = 0; j < C; j++) {
            const input = document.querySelector(`.input-costo[data-r="${i}"][data-c="${j}"]`);
            const raw = input?.value.trim();
            if (raw === '' || isNaN(Number(raw))) {
                return { valido: false, mensaje: `Falta ingresar un costo válido en la celda (O${i + 1}, D${j + 1}).` };
            }
            const val = parseFloat(raw);
            if (val < 0) {
                return { valido: false, mensaje: `El costo de transporte de (O${i + 1}, D${j + 1}) no puede ser negativo (${val}).` };
            }
            filaCostos.push(val);
        }
        costos.push(filaCostos);
    }

    const totalO = oferta.reduce((acc, curr) => acc + curr, 0);
    const totalD = demanda.reduce((acc, curr) => acc + curr, 0);

    if (totalO === 0 && totalD === 0) {
        return { valido: false, mensaje: 'La oferta y demanda totales deben ser mayores que cero.' };
    }

    // =========================================================================
    // GESTIÓN DE BALANCEO AUTOMÁTICO (FILA O COLUMNA FICTICIA)
    // =========================================================================
    let ajusteFicticio = null;
    let matrizCostosFinal = costos.map(fila => [...fila]);
    let ofertaFinal = [...oferta];
    let demandaFinal = [...demanda];
    let filasFinales = R;
    let colsFinales = C;

    const diferencia = Math.abs(totalO - totalD);

    if (diferencia > 0.000001) {
        if (totalO > totalD) {
            // Oferta mayor que Demanda: Se crea COLUMNA FICTICIA (Destino Ficticio)
            colsFinales = C + 1;
            demandaFinal.push(diferencia);
            
            // Todos los orígenes tienen costo 0 hacia el destino ficticio
            for (let i = 0; i < R; i++) {
                matrizCostosFinal[i].push(0);
            }

            ajusteFicticio = {
                tipo: 'columna',
                indice: C, // Índice 0-based de la columna ficticia
                nombre: `D${C + 1} (Ficticio)`,
                cantidad: diferencia,
                costo: 0,
                totalOOriginal: totalO,
                totalDOriginal: totalD,
                comentario: `La Oferta Total original (${totalO}) era mayor que la Demanda Total original (${totalD}) por una diferencia de ${diferencia} unidades. Fue necesaria la creación de una Columna Ficticia (Destino D${C + 1}) con requerimiento de ${diferencia} unidades y costos unitarios de envío en $0 para nivelar el problema y posibilitar la resolución por el Método de la Esquina Noroeste.`
            };
        } else {
            // Demanda mayor que Oferta: Se crea FILA FICTICIA (Origen Ficticio)
            filasFinales = R + 1;
            ofertaFinal.push(diferencia);

            // El origen ficticio tiene costo 0 hacia todos los destinos
            const filaCeros = new Array(C).fill(0);
            matrizCostosFinal.push(filaCeros);

            ajusteFicticio = {
                tipo: 'fila',
                indice: R, // Índice 0-based de la fila ficticia
                nombre: `O${R + 1} (Ficticio)`,
                cantidad: diferencia,
                costo: 0,
                totalOOriginal: totalO,
                totalDOriginal: totalD,
                comentario: `La Demanda Total original (${totalD}) era mayor que la Oferta Total original (${totalO}) por una diferencia de ${diferencia} unidades. Fue necesaria la creación de una Fila Ficticia (Origen O${R + 1}) con capacidad de ${diferencia} unidades y costos unitarios de envío en $0 para nivelar el problema y posibilitar la resolución por el Método de la Esquina Noroeste.`
            };
        }
    }

    return {
        valido: true,
        R_original: R,
        C_original: C,
        R_final: filasFinales,
        C_final: colsFinales,
        costosOriginales: costos,
        matrizCostosFinal,
        ofertaOriginal: oferta,
        demandaOriginal: demanda,
        ofertaFinal,
        demandaFinal,
        totalOOriginal: totalO,
        totalDOriginal: totalD,
        totalEquilibrado: Math.max(totalO, totalD),
        ajusteFicticio
    };
}

/**
 * Función principal que orquesta la resolución
 */
function resolver() {
    limpiarAlerta();
    limpiarResultado();

    const validacion = obtenerYValidarDatos();

    if (!validacion.valido) {
        mostrarAlerta(validacion.mensaje, 'error');
        return;
    }

    const metodoSeleccionado = document.querySelector('input[name="metodo"]:checked')?.value || 'noroeste';

    let solucion;
    let nombreMetodo = '';

    if (metodoSeleccionado === 'noroeste') {
        nombreMetodo = 'Método de la Esquina Noroeste';
        solucion = ejecutarEsquinaNoroeste(
            validacion.R_final, 
            validacion.C_final, 
            validacion.matrizCostosFinal, 
            validacion.ofertaFinal, 
            validacion.demandaFinal, 
            validacion.ajusteFicticio
        );
    } else {
        nombreMetodo = 'Método del Costo Mínimo';
        solucion = ejecutarCostoMinimo(
            validacion.R_final, 
            validacion.C_final, 
            validacion.matrizCostosFinal, 
            validacion.ofertaFinal, 
            validacion.demandaFinal, 
            validacion.ajusteFicticio
        );
    }

    renderizarResultados(solucion, validacion, nombreMetodo);
}

/**
 * ALGORITMO: Método de la Esquina Noroeste
 */
function ejecutarEsquinaNoroeste(R, C, costos, oferta, demanda, ajusteFicticio) {
    let ofertaRestante = [...oferta];
    let demandaRestante = [...demanda];
    let asignacion = Array.from({ length: R }, () => Array(C).fill(0));
    let pasos = [];

    let i = 0; // Origen (fila)
    let j = 0; // Destino (columna)
    let pasoNum = 1;
    let costoTotal = 0;

    while (i < R && j < C) {
        const curI = i;
        const curJ = j;
        const dispO = ofertaRestante[curI];
        const dispD = demandaRestante[curJ];

        // Cantidad a asignar: lo mínimo disponible en la esquina noroeste
        const cantidad = Math.min(dispO, dispD);
        const costoUnit = costos[curI][curJ];
        const subtotal = cantidad * costoUnit;

        asignacion[curI][curJ] = cantidad;
        costoTotal += subtotal;

        ofertaRestante[curI] -= cantidad;
        demandaRestante[curJ] -= cantidad;

        // Comprobación de si es celda ficticia
        const esFilaFicticia = (ajusteFicticio && ajusteFicticio.tipo === 'fila' && curI === ajusteFicticio.indice);
        const esColFicticia = (ajusteFicticio && ajusteFicticio.tipo === 'columna' && curJ === ajusteFicticio.indice);
        const esCeldaFicticia = esFilaFicticia || esColFicticia;

        let nombreOrigen = `O${curI + 1}`;
        let nombreDestino = `D${curJ + 1}`;
        if (esFilaFicticia) nombreOrigen += ' [Fic]';
        if (esColFicticia) nombreDestino += ' [Fic]';

        let motivo = '';
        let proxCelda = '';

        // Determinación del siguiente movimiento
        if (ofertaRestante[curI] === 0 && demandaRestante[curJ] === 0) {
            if (curI === R - 1 && curJ === C - 1) {
                motivo = `Se completaron simultáneamente la oferta de ${nombreOrigen} y la demanda de ${nombreDestino}. Fin de la asignación.`;
                proxCelda = 'Fin del problema';
                i++;
                j++;
            } else if (curI < R - 1 && curJ < C - 1) {
                motivo = `Empate: Se agotaron tanto la oferta de ${nombreOrigen} como la demanda de ${nombreDestino}. Se avanza en diagonal a O${curI + 2} y D${curJ + 2}.`;
                proxCelda = `O${curI + 2} → D${curJ + 2}`;
                i++;
                j++;
            } else if (curI < R - 1) {
                motivo = `Se agotaron oferta y demanda. Se avanza a la siguiente fila O${curI + 2}.`;
                proxCelda = `O${curI + 2} → D${curJ + 1}`;
                i++;
            } else {
                motivo = `Se agotaron oferta y demanda. Se avanza a la siguiente columna D${curJ + 2}.`;
                proxCelda = `O${curI + 1} → D${curJ + 2}`;
                j++;
            }
        } else if (ofertaRestante[curI] === 0) {
            motivo = `Oferta de ${nombreOrigen} agotada (restante: 0). Se avanza hacia abajo a O${curI + 2}.`;
            proxCelda = `O${curI + 2} → D${curJ + 1}`;
            i++;
        } else {
            motivo = `Demanda de ${nombreDestino} satisfecha (restante: 0). Se avanza hacia la derecha a D${curJ + 2}.`;
            proxCelda = `O${curI + 1} → D${curJ + 2}`;
            j++;
        }

        if (esCeldaFicticia) {
            motivo += ' (Asignación en elemento ficticio con costo $0)';
        }

        pasos.push({
            paso: pasoNum++,
            celdaNombre: `${nombreOrigen} → ${nombreDestino}`,
            esFicticia: esCeldaFicticia,
            dispO: dispO,
            dispD: dispD,
            cantidad: cantidad,
            costoUnit: costoUnit,
            subtotal: subtotal,
            motivo: motivo,
            proxCelda: proxCelda
        });
    }

    return {
        asignacion,
        costoTotal,
        pasos
    };
}

/**
 * ALGORITMO: Método del Costo Mínimo (Opcional / Comparativo)
 */
function ejecutarCostoMinimo(R, C, costos, oferta, demanda, ajusteFicticio) {
    let ofertaRestante = [...oferta];
    let demandaRestante = [...demanda];
    let asignacion = Array.from({ length: R }, () => Array(C).fill(0));
    let pasos = [];
    let costoTotal = 0;
    let pasoNum = 1;

    let celdasDisponibles = [];
    for (let i = 0; i < R; i++) {
        for (let j = 0; j < C; j++) {
            celdasDisponibles.push({ r: i, c: j, costo: costos[i][j] });
        }
    }

    celdasDisponibles.sort((a, b) => a.costo - b.costo);

    while (true) {
        let celdaElegida = null;
        for (let item of celdasDisponibles) {
            if (ofertaRestante[item.r] > 0 && demandaRestante[item.c] > 0) {
                celdaElegida = item;
                break;
            }
        }

        if (!celdaElegida) break;

        const { r, c, costo } = celdaElegida;
        const cantidad = Math.min(ofertaRestante[r], demandaRestante[c]);
        const subtotal = cantidad * costo;

        asignacion[r][c] = cantidad;
        costoTotal += subtotal;

        const dispO = ofertaRestante[r];
        const dispD = demandaRestante[c];

        ofertaRestante[r] -= cantidad;
        demandaRestante[c] -= cantidad;

        const esFilaFicticia = (ajusteFicticio && ajusteFicticio.tipo === 'fila' && r === ajusteFicticio.indice);
        const esColFicticia = (ajusteFicticio && ajusteFicticio.tipo === 'columna' && c === ajusteFicticio.indice);
        const esCeldaFicticia = esFilaFicticia || esColFicticia;

        let nombreOrigen = `O${r + 1}` + (esFilaFicticia ? ' [Fic]' : '');
        let nombreDestino = `D${c + 1}` + (esColFicticia ? ' [Fic]' : '');

        let motivo = '';
        if (ofertaRestante[r] === 0 && demandaRestante[c] === 0) {
            motivo = `Se completaron tanto la oferta de ${nombreOrigen} como la demanda de ${nombreDestino}.`;
        } else if (ofertaRestante[r] === 0) {
            motivo = `Se agotó la oferta de ${nombreOrigen}.`;
        } else {
            motivo = `Se satisfizo la demanda de ${nombreDestino}.`;
        }

        if (esCeldaFicticia) motivo += ' (Asignación en elemento ficticio)';

        pasos.push({
            paso: pasoNum++,
            celdaNombre: `${nombreOrigen} → ${nombreDestino}`,
            esFicticia: esCeldaFicticia,
            dispO: dispO,
            dispD: dispD,
            cantidad: cantidad,
            costoUnit: costo,
            subtotal: subtotal,
            motivo: motivo,
            proxCelda: 'Siguiente menor costo disponible'
        });
    }

    return {
        asignacion,
        costoTotal,
        pasos
    };
}

/**
 * Renderiza la interfaz visual completa de resultados
 */
function renderizarResultados(solucion, datos, nombreMetodo) {
    const { asignacion, costoTotal, pasos } = solucion;
    const { 
        R_final: R, 
        C_final: C, 
        matrizCostosFinal: costos, 
        ofertaFinal: oferta, 
        demandaFinal: demanda, 
        totalEquilibrado, 
        ajusteFicticio 
    } = datos;

    let casillasAsignadas = 0;
    let desgloseCalculo = [];

    for (let i = 0; i < R; i++) {
        for (let j = 0; j < C; j++) {
            if (asignacion[i][j] > 0) {
                casillasAsignadas++;
                const esFic = (ajusteFicticio && (
                    (ajusteFicticio.tipo === 'fila' && i === ajusteFicticio.indice) ||
                    (ajusteFicticio.tipo === 'columna' && j === ajusteFicticio.indice)
                ));
                desgloseCalculo.push(`(${asignacion[i][j]} × $${costos[i][j]}${esFic ? ' [Fic]' : ''})`);
            }
        }
    }

    let desgloseSuma = desgloseCalculo.join(' + ');

    let html = `
        <div class="card-resultado animar-entrada">
            <div class="resultado-header">
                <div class="badge-metodo">${nombreMetodo}</div>
                <h2>Solución Factible Obtenida</h2>
                <p class="resultado-sub">Asignaciones completadas satisfaciendo la totalidad de los requerimientos de transporte.</p>
            </div>
    `;

    // =========================================================================
    // COMENTARIO / NOTA DE CREACIÓN FICTICIA (REQUERIMIENTO OBLIGATORIO)
    // =========================================================================
    if (ajusteFicticio) {
        html += `
            <div class="card-aviso-ficticio animar-entrada">
                <div class="ficticio-header">
                    <span class="ficticio-tag">Balanceo Automático Realizado</span>
                    <span class="ficticio-tipo-badge">${ajusteFicticio.tipo === 'columna' ? 'Columna Ficticia Creada' : 'Fila Ficticia Creada'}</span>
                </div>
                <div class="ficticio-cuerpo">
                    <div class="ficticio-icono">⚖️</div>
                    <div class="ficticio-info">
                        <h4>Nota Explicativa: Fue necesaria la creación de un elemento ficticio por falta de coincidencia</h4>
                        <p class="ficticio-comentario-texto">${ajusteFicticio.comentario}</p>
                        <div class="ficticio-datos-grid">
                            <div class="ficticio-dato-item">
                                <span class="lbl">Oferta Original:</span>
                                <span class="val val-o">${ajusteFicticio.totalOOriginal}</span>
                            </div>
                            <div class="ficticio-dato-item">
                                <span class="lbl">Demanda Original:</span>
                                <span class="val val-d">${ajusteFicticio.totalDOriginal}</span>
                            </div>
                            <div class="ficticio-dato-item destaque-dif">
                                <span class="lbl">Diferencia Nivelada:</span>
                                <span class="val val-f">${ajusteFicticio.cantidad} unidades</span>
                            </div>
                            <div class="ficticio-dato-item">
                                <span class="lbl">Costo Asignado:</span>
                                <span class="val">$0 / unidad</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // TARJETAS DE MÉTRICAS CLAVE
    html += `
            <div class="metricas-grid">
                <div class="metrica-card destaque-costo">
                    <span class="metrica-etiqueta">Costo Total del Transporte (Z)</span>
                    <span class="metrica-valor">$${costoTotal.toLocaleString('es-AR')}</span>
                    <span class="metrica-desc">Función objetivo final</span>
                </div>
                <div class="metrica-card">
                    <span class="metrica-etiqueta">Total Unidades Transportadas</span>
                    <span class="metrica-valor">${totalEquilibrado.toLocaleString('es-AR')}</span>
                    <span class="metrica-desc">${ajusteFicticio ? 'Incluye unidades ficticias' : 'Oferta y Demanda exactas'}</span>
                </div>
                <div class="metrica-card">
                    <span class="metrica-etiqueta">Celdas Asignadas</span>
                    <span class="metrica-valor">${casillasAsignadas}</span>
                    <span class="metrica-desc">m + n - 1 = ${R + C - 1}</span>
                </div>
            </div>

            <!-- MATRIZ DE ASIGNACIONES -->
            <div class="seccion-resultado">
                <h3>Matriz de Asignaciones</h3>
                <p class="seccion-instruccion">
                    Envíos calculados. Las celdas resaltadas indican envíos asignados [<b>Cantidad</b> / Costo / Subtotal].
                    ${ajusteFicticio ? '<br><span class="nota-fic-alerta">✦ Las celdas marcadas como <b>[Ficticio]</b> tienen costo de envío $0 y equilibran el sistema.</span>' : ''}
                </p>
                
                <div class="tabla-responsiva">
                    <table class="matriz-asignaciones">
                        <thead>
                            <tr>
                                <th>Orígenes \\ Destinos</th>
    `;

    for (let j = 0; j < C; j++) {
        const esColFic = (ajusteFicticio && ajusteFicticio.tipo === 'columna' && j === ajusteFicticio.indice);
        html += `<th class="${esColFic ? 'th-col-ficticia' : ''}">
                    D${j + 1}${esColFic ? '<br><span class="pill-fic">Ficticio</span>' : ''}
                 </th>`;
    }
    html += `<th>Oferta Satisfecha</th><th>Oferta Total</th></tr></thead><tbody>`;

    for (let i = 0; i < R; i++) {
        let sumaFila = 0;
        const esFilaFic = (ajusteFicticio && ajusteFicticio.tipo === 'fila' && i === ajusteFicticio.indice);

        html += `<tr><th class="${esFilaFic ? 'th-fila-ficticia' : ''}">
                    O${i + 1}${esFilaFic ? '<br><span class="pill-fic">Ficticio</span>' : ''}
                 </th>`;

        for (let j = 0; j < C; j++) {
            const cant = asignacion[i][j];
            sumaFila += cant;
            const esCeldaFic = (
                (ajusteFicticio && ajusteFicticio.tipo === 'fila' && i === ajusteFicticio.indice) ||
                (ajusteFicticio && ajusteFicticio.tipo === 'columna' && j === ajusteFicticio.indice)
            );

            if (cant > 0) {
                const sub = cant * costos[i][j];
                html += `
                    <td class="td-asignada ${esCeldaFic ? 'td-asignada-fic' : ''}">
                        <div class="badge-asignacion ${esCeldaFic ? 'badge-fic' : ''}">${cant}</div>
                        <div class="detalle-costo-celda">Costo: $${costos[i][j]} ${esCeldaFic ? '(Fic)' : ''}</div>
                        <div class="subtotal-celda">Sub: $${sub}</div>
                    </td>
                `;
            } else {
                html += `
                    <td class="td-no-asignada ${esCeldaFic ? 'td-no-asignada-fic' : ''}">
                        <span class="valor-cero">-</span>
                        <span class="costo-referencia">($${costos[i][j]})</span>
                    </td>
                `;
            }
        }
        html += `
            <td class="td-total-cumplido">${sumaFila}</td>
            <td class="td-total-esperado">${oferta[i]}</td>
        </tr>`;
    }

    // Fila resumen de demandas
    html += `<tr><th>Demanda Satisfecha</th>`;
    for (let j = 0; j < C; j++) {
        let sumaCol = 0;
        for (let i = 0; i < R; i++) {
            sumaCol += asignacion[i][j];
        }
        html += `<td class="td-total-cumplido">${sumaCol}</td>`;
    }
    html += `<td colspan="2" class="td-balance-final">✓ Equilibrado</td></tr>`;

    // Fila esperada de demandas
    html += `<tr><th>Demanda Total</th>`;
    for (let j = 0; j < C; j++) {
        html += `<td class="td-total-esperado">${demanda[j]}</td>`;
    }
    html += `<td colspan="2" class="td-balance-final">${totalEquilibrado}</td></tr>`;

    html += `</tbody></table></div></div>`;

    // DESGLOSE MATEMÁTICO DEL COSTO
    html += `
        <div class="seccion-resultado">
            <h3>Cálculo Detallado del Costo Total</h3>
            <div class="formula-caja">
                <div class="formula-titulo">Fórmula: Z = Σ (Asignación<sub>i,j</sub> × Costo<sub>i,j</sub>)</div>
                <div class="formula-desglose">
                    Z = ${desgloseSuma || '0'}
                </div>
                <div class="formula-resultado">
                    <b>Z = $${costoTotal.toLocaleString('es-AR')}</b>
                </div>
            </div>
        </div>
    `;

    // TABLA PASO A PASO
    html += `
        <div class="seccion-resultado">
            <h3>Paso a Paso de la Asignación (${nombreMetodo})</h3>
            <p class="seccion-instruccion">Detalle cronológico de cada iteración realizada por el algoritmo:</p>
            <div class="tabla-responsiva">
                <table class="tabla-pasos">
                    <thead>
                        <tr>
                            <th># Paso</th>
                            <th>Celda</th>
                            <th>Oferta Disp.</th>
                            <th>Demanda Disp.</th>
                            <th>Asignado = Mín(O, D)</th>
                            <th>Costo Unit.</th>
                            <th>Subtotal</th>
                            <th>Decisión / Siguiente Paso</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    pasos.forEach(p => {
        html += `
            <tr class="${p.esFicticia ? 'tr-paso-ficticio' : ''}">
                <td><span class="paso-num ${p.esFicticia ? 'paso-num-fic' : ''}">${p.paso}</span></td>
                <td><b>${p.celdaNombre}</b></td>
                <td>${p.dispO}</td>
                <td>${p.dispD}</td>
                <td><span class="badge-asignado-paso ${p.esFicticia ? 'badge-asignado-fic' : ''}">${p.cantidad}</span></td>
                <td>$${p.costoUnit}</td>
                <td><b>$${p.subtotal}</b></td>
                <td class="td-motivo">${p.motivo}</td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
        </div>

        <div class="acciones-finales">
            <button class="btn btn-secundario" onclick="window.print()">
                <span class="btn-icono">🖨</span> Imprimir / Exportar Reporte
            </button>
            <button class="btn btn-secundario" onclick="document.getElementById('contenedor-tabla').scrollIntoView({behavior:'smooth'})">
                <span class="btn-icono">✏</span> Modificar Datos
            </button>
        </div>
    </div>`;

    const contenedorResultado = document.getElementById('resultado');
    contenedorResultado.innerHTML = html;
    contenedorResultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Muestra mensajes flotantes de alerta
 */
function mostrarAlerta(mensaje, tipo = 'error') {
    const contenedor = document.getElementById('mensaje-alerta');
    if (!contenedor) return;

    let icono = '⚠️';
    if (tipo === 'info') icono = 'ℹ️';
    if (tipo === 'success') icono = '✅';

    contenedor.className = `alerta alerta-${tipo} animar-entrada`;
    contenedor.innerHTML = `<span class="alerta-icono">${icono}</span> <div class="alerta-texto">${mensaje}</div>`;
    contenedor.style.display = 'flex';
}

/**
 * Oculta la caja de alerta
 */
function limpiarAlerta() {
    const contenedor = document.getElementById('mensaje-alerta');
    if (contenedor) {
        contenedor.innerHTML = '';
        contenedor.style.display = 'none';
        contenedor.className = 'alerta';
    }
}

/**
 * Limpia los resultados previos
 */
function limpiarResultado() {
    const contenedor = document.getElementById('resultado');
    if (contenedor) contenedor.innerHTML = '';
}

/**
 * Reinicia completamente el formulario para empezar de nuevo
 */
function reiniciarTodo() {
    document.getElementById('rows').value = '';
    document.getElementById('cols').value = '';
    document.getElementById('contenedor-tabla').innerHTML = '';
    document.getElementById('controles-solucion').style.display = 'none';
    const banner = document.getElementById('banner-balance');
    if (banner) banner.style.display = 'none';
    limpiarAlerta();
    limpiarResultado();
    AppState.rows = 0;
    AppState.cols = 0;
    mostrarAlerta('Se ha reiniciado el formulario. Ingresa nuevas dimensiones de orígenes y destinos.', 'info');
}
