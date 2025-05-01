let permisos = [];
let archivoActual = "";

document.addEventListener("DOMContentLoaded", cargarUsuariosDesdeCSV);

async function cargarUsuariosDesdeCSV() {
    const response = await fetch("Usuarios.csv");
    const texto = await response.text();
    const lineas = texto.trim().split("\n");
  
    const usuarios = lineas.map(l => l.split(",")[0].trim()).filter(u => u !== "Admin");
  
    const select = document.getElementById("selectUsuarioPermisos");
    select.innerHTML = '<option value="">-- Elegir usuario --</option>';
    usuarios.forEach(nombre => {
      const opt = document.createElement("option");
      opt.value = nombre;
      opt.textContent = nombre;
      select.appendChild(opt);
    });
  }

  async function cargarPermisosDesdeServidor() {
    const usuario = document.getElementById("selectUsuarioPermisos").value;
    const tipo = document.getElementById("selectTipoPermiso").value;
  
    if (!usuario || !tipo) {
     // Swal.fire({ title: "Seleccioná usuario y tipo de permisos", icon: "warning" });
      Swal.fire({
        title: "Seleccioná usuario y tipo de equipo",
        icon: "warning",
        background: "#2c2c2e",
        color: "#e0e0e0",
        confirmButtonColor: "#4b6cb7",
        confirmButtonText: "OK",
        customClass: {
            popup: 'swal-dark'
          } 
      });
      return;
    }
  
    archivoActual = `Permisos${usuario}_${tipo}.csv`;
  
    try {
      const response = await fetch(archivoActual);
      const texto = await response.text();
      const lineas = texto.trim().split("\n");
  
      permisos = lineas.map(linea => {
        const [parametro, visible, editable] = linea.split(",");
        return {
          parametro: parametro.trim(),
          visible: visible.trim().toLowerCase(),
          editable: editable.trim().toLowerCase()
        };
      });
  
      renderizarTablaPermisos();
    } catch (error) {
        
      Swal.fire({ title: "Error al cargar el archivo", 
        text: archivoActual, 
        icon: "error",
        background: "#2c2c2e",
        color: "#e0e0e0",
        confirmButtonColor: "#4b6cb7",
        confirmButtonText: "OK",
        customClass: {
            popup: 'swal-dark'
          } 
        });
    }
  }


  function renderizarTablaPermisos() {
    const tbody = document.querySelector("#tablaPermisos tbody");
    tbody.innerHTML = "";
  
    permisos.forEach((p, i) => {
      const fila = document.createElement("tr");
  
      const celdaParametro = document.createElement("td");
      celdaParametro.textContent = p.parametro;
  
      const celdaVisible = document.createElement("td");
      const selVis = document.createElement("select");
      ["SI", "NO"].forEach(op => {
        const opt = document.createElement("option");
        opt.value = op;
        opt.text = op;
        if (op.toLowerCase() === p.visible.toLowerCase()) opt.selected = true;
        selVis.appendChild(opt);
      });
      selVis.onchange = () => { permisos[i].visible = selVis.value; };
      celdaVisible.appendChild(selVis);
  
      const celdaEditable = document.createElement("td");
      const selEdit = document.createElement("select");
      ["SI", "NO"].forEach(op => {
        const opt = document.createElement("option");
        opt.value = op;
        opt.text = op;
        if (op.toLowerCase() === p.editable.toLowerCase()) opt.selected = true;
        selEdit.appendChild(opt);
      });
      selEdit.onchange = () => { permisos[i].editable = selEdit.value; };
      celdaEditable.appendChild(selEdit);
  
      fila.appendChild(celdaParametro);
      fila.appendChild(celdaVisible);
      fila.appendChild(celdaEditable);
      tbody.appendChild(fila);
    });
  }
  

 function descargarCSVPermisos() {
  if (!archivoActual) {
   // Swal.fire({ title: "Primero cargá un archivo", icon: "warning" });
    Swal.fire({
      title: "Primero cargá un archivo",
      icon: "warning",
      background: "#2c2c2e",
      color: "#e0e0e0",
      confirmButtonColor: "#4b6cb7",
      confirmButtonText: "OK",
      customClass: {
          popup: 'swal-dark'
        } 
    });
    return;
  }

  /*const contenidoCSV = permisos.map(p =>
    `${p.parametro},${p.visible},${p.editable}`
  ).join("\n");
*/
  const contenidoCSV = permisos.map(p =>
    `${p.parametro},${p.visible.toUpperCase()},${p.editable.toUpperCase()}`
  ).join("\n");

  const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = archivoActual;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  Swal.fire({
    title: "Permisos actualizados",
    html: `El archivo <strong>${archivoActual}</strong> fue generado correctamente..<br>Descargá el nuevo archivo para reemplazar el anterior.`,
    icon: "success",
    background: "#2c2c2e",
    color: "#e0e0e0",
    confirmButtonColor: "#4b6cb7",
    confirmButtonText: "OK",
    customClass: {
        popup: 'swal-dark'
      } 
  });
}
  