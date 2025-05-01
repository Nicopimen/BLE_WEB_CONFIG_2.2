async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

async function leerCSVDesdeArchivo(ruta) {
    const respuesta = await fetch(ruta);
    const texto = await respuesta.text();
  
    const lineas = texto.trim().split("\n"); 
    const usuarios =  lineas.map(linea => {
      //const [usuario, hash] = linea.split(",");
      const [usuario, hash, fecha, estado] = linea.split(",");
      return { usuario: usuario, hash: hash, fecha: fecha, estado: estado };
    });

   const hoy = new Date();
   console.log(hoy);
   for (const usuario of usuarios) {
    if (usuario.usuario === "Admin" || usuario.usuario === "Ingenieria1") continue; // Admin nunca expira
    
    const fechaCreacion = new Date(usuario.fecha);
    console.log(fechaCreacion);


    const diferenciaMeses = (hoy.getFullYear() - fechaCreacion.getFullYear()) * 12 +
                            (hoy.getMonth() - fechaCreacion.getMonth());
    console.log(diferenciaMeses);                        

    if (diferenciaMeses >= 6) {
      usuario.estado = "invalida";
    }/*else {
      usuario.estado = "valida";
    }*/
  }

  return usuarios;
}

function cargarUsuariosEnSelect(listaUsuarios) {
    const select = document.getElementById("selectUser");
    select.innerHTML = '<option value="">-- Elegir --</option>';
  
    listaUsuarios.forEach(u => {
      if (u.usuario !== "Admin") {
        const option = document.createElement("option");
        option.value = u.usuario;
        option.textContent = u.usuario;
        select.appendChild(option);
      }
    });
}


async function actualizarUsuario() {
    const usuario = document.getElementById("selectUser").value;
    const nuevaClave = document.getElementById("nuevaClave").value;
    const nuevoEstado = document.getElementById("estadoClave").value;
  
    if (!usuario || !nuevaClave) {
     // alert("Seleccioná un usuario y completá la nueva clave.");
     
     Swal.fire({ 
      title: "Faltan Datos", 
      html: `Debe completar los datos`,
      icon: "error",
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
  
    const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
    const hash = await hashPassword(nuevaClave); // usás tu función
  
    // Actualizar el usuario en memoria
    listaUsuarios = listaUsuarios.map(u => {
      if (u.usuario === usuario) {
        return {
          usuario: u.usuario,
          hash: hash,
          fecha: hoy,
          estado: nuevoEstado
        };
      }
      return u;
    });
  
    // Generar nuevo CSV
    const csv = listaUsuarios.map(u => `${u.usuario},${u.hash},${u.fecha},${u.estado},`).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Usuarios.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  
    renderizarTablaUsuarios(listaUsuarios); // actualiza la tabla

    // Limpiar campos del formulario
    document.getElementById("selectUser").value = "";
    document.getElementById("nuevaClave").value = "";
    document.getElementById("estadoClave").value = "valida";

    //alert("Usuario actualizado y archivo CSV descargado.");
    Swal.fire({
        title: "Actualizado",
        html: `El usuario <strong>${usuario}</strong> fue actualizado.<br>Descargá el nuevo archivo para reemplazar el anterior.`,
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

  function renderizarTablaUsuarios(usuarios) {
    const cuerpoTabla = document.querySelector("#tablaUsuarios tbody");
    cuerpoTabla.innerHTML = ""; // Limpiar tabla
  
    usuarios.forEach(u => {
      const fila = document.createElement("tr");
  
      const celdaUsuario = document.createElement("td");
      celdaUsuario.textContent = u.usuario;
  
      const celdaFecha = document.createElement("td");
      celdaFecha.textContent = u.fecha;
  
      const celdaEstado = document.createElement("td");
      celdaEstado.textContent = u.estado;
      celdaEstado.classList.add(`estado-${u.estado.toLowerCase()}`);
  
      fila.appendChild(celdaUsuario);
      fila.appendChild(celdaFecha);
      fila.appendChild(celdaEstado);
  
      cuerpoTabla.appendChild(fila);
    });
  }

leerCSVDesdeArchivo("Usuarios.csv").then(usuarios => {
    listaUsuarios = usuarios;
    cargarUsuariosEnSelect(listaUsuarios);
    renderizarTablaUsuarios(listaUsuarios);
  });