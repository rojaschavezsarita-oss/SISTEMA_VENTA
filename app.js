// Validar que pasó por el login
if (sessionStorage.getItem('auth') !== 'true') {
    window.location.href = 'login.html';
}

const CLAVE_ADMIN = 'konny12';
let db = { efectivo: [], yape: [], egresos: [] };

document.addEventListener('DOMContentLoaded', () => {
    const datosGuardados = localStorage.getItem('ventas_db');
    if (datosGuardados) db = JSON.parse(datosGuardados);
    renderizarTablas();
});

function cerrarSesion() {
    sessionStorage.removeItem('auth');
    window.location.href = 'login.html';
}

function guardarDatos() {
    localStorage.setItem('ventas_db', JSON.stringify(db));
}

function agregarIngreso() {
    const fecha = document.getElementById('ing-fecha').value;
    const desc = document.getElementById('ing-desc').value;
    const tel = document.getElementById('ing-tel').value; 
    const debe = parseFloat(document.getElementById('ing-debe').value) || 0;
    const precio = parseFloat(document.getElementById('ing-precio').value);
    const radioPago = document.querySelector('input[name="tipo_pago"]:checked');

    if (!fecha || !desc || isNaN(precio) || !radioPago) {
        alert("Fecha, Descripción y Precio son campos obligatorios.");
        return;
    }

    const nuevoIngreso = { fecha, desc, tel, debe, precio, id: Date.now() };
    
    if (radioPago.value === 'efectivo') db.efectivo.push(nuevoIngreso);
    else db.yape.push(nuevoIngreso);

    guardarDatos();
    renderizarTablas();
    document.getElementById('ing-desc').value = '';
    document.getElementById('ing-debe').value = '0';
    document.getElementById('ing-precio').value = '';
}

function agregarEgreso() {
    const desc = document.getElementById('egr-desc').value;
    const total = parseFloat(document.getElementById('egr-total').value);

    if (!desc || isNaN(total)) {
        alert("Descripción y Total son obligatorios para el egreso.");
        return;
    }

    db.egresos.push({ desc, total, id: Date.now() });
    guardarDatos();
    renderizarTablas();
    document.getElementById('egr-desc').value = '';
    document.getElementById('egr-total').value = '';
}

function renderizarTablas() {
    renderizarTablaIngresos('tabla-efectivo', db.efectivo, 'tot-efectivo', 'tot-debe-efe');
    renderizarTablaIngresos('tabla-yape', db.yape, 'tot-yape', 'tot-debe-yape');
    renderizarTablaEgreso('tabla-egresos', db.egresos, 'tot-egreso');
    calcularResumenes(); 
}

function renderizarTablaIngresos(idTabla, datos, idTotalPrecio, idTotalDebe) {
    const tbody = document.querySelector("#" + idTabla + " tbody");
    if(!tbody) return;
    
    tbody.innerHTML = '';
    let totalPrecio = 0;
    let totalDebe = 0;
    const tipoStr = idTabla.includes('yape') ? 'yape' : 'efectivo';

    datos.forEach((item, index) => {
        const precioNum = Number(item.precio) || 0;
        const debeNum = Number(item.debe) || 0;
        totalPrecio += precioNum;
        totalDebe += debeNum;
        
        tbody.innerHTML += `
            <tr>
                <td>${item.desc}</td>
                <td>${item.tel}</td>
                <td>S/ ${debeNum.toFixed(2)}</td>
                <td>S/ ${precioNum.toFixed(2)}</td>
                <td><button class="btn-editar" onclick="editarRegistro('${tipoStr}', ${index})">Editar</button></td>
            </tr>
        `;
    });
    
    document.getElementById(idTotalPrecio).innerText = "S/ " + totalPrecio.toFixed(2);
    document.getElementById(idTotalDebe).innerText = "S/ " + totalDebe.toFixed(2);
}

function renderizarTablaEgreso(idTabla, datos, idTotal) {
    const tbody = document.querySelector("#" + idTabla + " tbody");
    if(!tbody) return;
    tbody.innerHTML = '';
    let total = 0;

    datos.forEach((item, index) => {
        const totalNum = Number(item.total) || 0;
        total += totalNum;
        tbody.innerHTML += `
            <tr>
                <td>${item.desc}</td>
                <td>S/ ${totalNum.toFixed(2)}</td>
                <td><button class="btn-editar" onclick="editarRegistro('egresos', ${index})">Editar</button></td>
            </tr>
        `;
    });
    document.getElementById(idTotal).innerText = "S/ " + total.toFixed(2);
}

function calcularResumenes() {
    // Totales Precios (Lo que suma a caja)
    const totEfe = db.efectivo.reduce((acc, el) => acc + (Number(el.precio) || 0), 0);
    const totYape = db.yape.reduce((acc, el) => acc + (Number(el.precio) || 0), 0);
    const totEgr = db.egresos.reduce((acc, el) => acc + (Number(el.total) || 0), 0);
    
    // Totales Deudas (Lo que falta cobrar)
    const deudaEfe = db.efectivo.reduce((acc, el) => acc + (Number(el.debe) || 0), 0);
    const deudaYape = db.yape.reduce((acc, el) => acc + (Number(el.debe) || 0), 0);
    const totalDeudas = deudaEfe + deudaYape;

    // Actualizar Cuadro de Deudas
    document.getElementById('resumen-deuda-efe').innerText = "S/ " + deudaEfe.toFixed(2);
    document.getElementById('resumen-deuda-yape').innerText = "S/ " + deudaYape.toFixed(2);
    document.getElementById('resumen-deuda-total').innerText = "S/ " + totalDeudas.toFixed(2);

    // Actualizar Cuadre de Caja (Caja real: Suma de precios pagados menos egresos)
    const cuadreTotal = (totEfe + totYape) - totEgr;
    document.getElementById('cuadre-efectivo').innerText = "S/ " + totEfe.toFixed(2);
    document.getElementById('cuadre-yape').innerText = "S/ " + totYape.toFixed(2);
    document.getElementById('cuadre-egreso').innerText = "S/ " + totEgr.toFixed(2);
    document.getElementById('cuadre-total').innerText = "S/ " + cuadreTotal.toFixed(2);
}

function editarRegistro(tipo, index) {
    const pass = prompt("Ingrese clave para editar:");
    if (pass !== CLAVE_ADMIN) return alert("Clave incorrecta.");

    if (tipo === 'egresos') {
        const nuevoTotal = parseFloat(prompt("Nuevo monto de egreso:", db[tipo][index].total));
        if (!isNaN(nuevoTotal)) db[tipo][index].total = nuevoTotal;
    } else {
        const nPrecio = parseFloat(prompt("Nuevo PRECIO PAGADO (Dejar igual si no cambió):", db[tipo][index].precio));
        const nDebe = parseFloat(prompt("Nuevo DEBE (Si ya pagaron todo, pon 0):", db[tipo][index].debe));
        
        if (!isNaN(nPrecio)) db[tipo][index].precio = nPrecio;
        if (!isNaN(nDebe)) db[tipo][index].debe = nDebe;
    }
    
    guardarDatos();
    renderizarTablas();
}

function exportarYCerrarDia() {
    const fechaActual = new Date().toLocaleDateString().replace(/\//g, '-');
    
    try {
        // 1. Exportar Backup JSON (Corregido para navegadores estrictos)
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "Backup_Sistema_" + fechaActual + ".json");
        document.body.appendChild(dlAnchorElem); // Es obligatorio agregarlo al body
        dlAnchorElem.click();
        document.body.removeChild(dlAnchorElem); // Lo limpiamos inmediatamente después

        // 2. Exportar PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(14); 
        doc.text("REPORTE DE CAJA - " + fechaActual, 14, 15);
        
        let startY = 28;

        doc.setFontSize(10); 
        doc.text("INGRESOS - EFECTIVO", 14, startY - 3);
        doc.autoTable({ html: '#tabla-efectivo', startY: startY });
        let finalY = doc.lastAutoTable.finalY || startY + 15;

        doc.text("INGRESOS - YAPE", 14, finalY + 10);
        doc.autoTable({ html: '#tabla-yape', startY: finalY + 13 });
        finalY = doc.lastAutoTable.finalY || finalY + 25;

        doc.text("EGRESOS", 14, finalY + 10);
        doc.autoTable({ html: '#tabla-egresos', startY: finalY + 13 });
        finalY = doc.lastAutoTable.finalY || finalY + 25;

        doc.setFontSize(11);
        const textoDeudas = "TOTAL DEUDAS PENDIENTES: " + document.getElementById('resumen-deuda-total').innerText;
        doc.text(textoDeudas, 14, finalY + 15);
        
        const textoCuadre = "CUADRE TOTAL EN CAJA: " + document.getElementById('cuadre-total').innerText;
        doc.text(textoCuadre, 14, finalY + 22);

        // Retrasamos la descarga del PDF 500ms para que el navegador no bloquee por "múltiples descargas"
        setTimeout(() => {
            doc.save("Cierre_Caja_" + fechaActual + ".pdf");
            
            if(confirm("Se descargaron el PDF y el Respaldo. ¿Limpiar sistema para nuevo día?")) {
                localStorage.removeItem('ventas_db');
                location.reload(); 
            }
        }, 500);

    } catch (error) {
        console.error("Error en la exportación:", error);
        alert("Hubo un error al generar los archivos. Asegúrate de tener conexión a internet para que funcione la librería del PDF.");
    }
}

// Lógica para importar el archivo JSON
function cargarBackup() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    if (!file) return alert("Por favor, seleccione un archivo .json de respaldo.");

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            db = JSON.parse(e.target.result);
            guardarDatos();
            renderizarTablas();
            alert("Datos restaurados correctamente. Ya puedes editar las deudas.");
            fileInput.value = ""; // Limpiar input
        } catch (error) {
            alert("Error al leer el archivo. Asegúrate de que sea el archivo .json correcto.");
        }
    };
    reader.readAsText(file);
}