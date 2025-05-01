//controla el acceso, segun el nivel, permite distintas funciones 
//UTILIZA SHA-256
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


  
  document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();
  
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
  
    const hashedPassword = await hashPassword(password);

    const usuarios = await leerCSVDesdeArchivo("Usuarios.csv");


   console.log(usuarios);
   //console.log(usuarios.at(0));
   //console.log(usuarios.length);

    const usuarioValido = usuarios.find(u => u.usuario === username && u.hash === hashedPassword );
   
    
    if (usuarioValido) {
        
        console.log(usuarioValido.estado);
        if(username=="Admin" || username=="Ingenieria1"){ 
           localStorage.setItem("usuarioLogueado", username);
           // alert("Admin Inicio de sesión exitoso!");
           //window.location.href = `AdminUnificado.html?usuario=${encodeURIComponent(username)}`;
          window.location.href = "AdminUnificado.html";
       
        }else if(username=="Ingenieria2" || username=="Tecnica1" || username=="Tecnica2"){
            if(usuarioValido.estado == "valida"){ 
              localStorage.setItem("usuarioLogueado", username);
              //alert("Ingenieria2 Inicio de sesión exitoso!");
              //window.location.href = "initIngenieria2.html";
              window.location.href = "AdminUnificado.html";
              //window.location.href = `AdminUnificado.html?usuario=${encodeURIComponent(username)}`;
            }else{
              document.getElementById("error-msg").textContent = "Su clave a caducado, debe comunicarse con el Administrador.";
              Swal.fire({ 
                title: "Su clave a caducado, debe comunicarse con el Administrador.", 
               // html: `Error`,
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
    }else {
      document.getElementById("error-msg").textContent = "Usuario o contraseña incorrectos.";
      Swal.fire({ 
        title: "Usuario o contraseña incorrectos.", 
       // html: `Error`,
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
  });
  
  