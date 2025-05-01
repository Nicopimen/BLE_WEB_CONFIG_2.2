// DOM Elements
const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const bleStateContainer = document.getElementById('bleState');

/*
const onButton = document.getElementById('onButton');
const abfButton = document.getElementById('abfButton');
const actButton = document.getElementById('actButton');
const retrievedValue = document.getElementById('valueContainer');

const timestampContainer = document.getElementById('timestamp');
const timesEstadoContainer = document.getElementById('tiempoState');
const tempAmbienteContainer = document.getElementById('tempamb');

const parametroLeido = document.getElementById('parLeido');
const selecTextos = document.getElementById('selecText');
*/
//const usuarioActivo = obtenerUsuarioDesdeURL();
const usuarioActivo = localStorage.getItem("usuarioLogueado");

if (!usuarioActivo) {
  Swal.fire({
    title: "Acceso denegado",
    text: "No se detectó un usuario válido.",
    icon: "error",
    background: "#2c2c2e",
    color: "#e0e0e0",
    confirmButtonColor: "#4b6cb7",
    confirmButtonText: "OK",
    customClass: {
        popup: 'swal-dark'
      } 
  });
  
  // redirigir a login
   window.location.href = "index.html";
}

if (usuarioActivo !== "Admin") {
  const adminMenu = document.getElementById("adminMenu");
  if (adminMenu) adminMenu.style.display = "none";
}

document.getElementById("usuarioActivo").textContent = `👤 Usuario: ${usuarioActivo}`;

var onButton;
var abfButton;
var actButton;
var retrievedValue;
var parametroLeido;
var selecTextos;
var timestampContainer;
var timesEstadoContainer;
var tempAmbienteContainer;
var vxDetContainer;
var vxPosContainer;
var vxPidContainer;
var vxPoteContainer;
var outA1Container;
var outA2Container;


//Define BLE Device Specs
var deviceName ='COFACO_BLE';
var bleService = 'b8d7ce51-ab47-4ff8-aa8c-2fb686bbceb3';
var ESTADO_CHARACTERISTIC_UUID =        "f60844f9-f620-4e3e-9c0d-e530339f9bb9"
var START_STOP_CHARACTERISTIC_UUID =     "eeee0cae-4c2d-4222-83fa-a82322668851"
var ALTO_BAJO_CHARACTERISTIC_UUID =      "be2fb044-c6a5-46a8-97b2-2a8eae7012c1"
var PARAMETRO_CHARACTERISTIC_UUID =      "2bbdf4a6-104a-4c6d-a625-469fe13c4b53"
var TIME_ESTADO_CHARACTERISTIC_UUID =    "9df5f2a4-4464-44f2-8159-bc84c218d566"
var MODELO_CHARACTERISTIC_UUID =         "124762d6-c702-4871-8f15-6d85f8c18b44"
var TEMP_AMB_CHARACTERISTIC_UUID =        "f090ca78-40ef-48d0-891c-07aad1236d4a"
var INS_OUTS_CHARACTERISTIC_UUID =        "5618c11c-c4fe-427e-b7ca-0ee4cbb2263c"

//Global Variables to Handle Bluetooth
var bleServer;
var bleServiceFound;
var caracteristicaEstado; // global

var modelo;
var opcionesTextuales=[];
var datosModelo=[];
var nombresInsOut=[];
var permisos=[];
var lastDirParam;
var lastDirParamIsTexto;
var lastValueWrite="";
var isEscritura=0;
var isLecturaDispaly=0;

// Connect Button (search for BLE Devices only if BLE is available)
connectButton.addEventListener('click', (event) => {
    if (isWebBluetoothEnabled()){
        connectToDevice();
    }
});

// Disconnect Button
disconnectButton.addEventListener('click', disconnectDevice);

// Write to the ESP32 Characteristic
/*onButton.addEventListener('click', () => writeOnCharacteristic(1,START_STOP_CHARACTERISTIC_UUID));
abfButton.addEventListener('click', () => writeOnCharacteristic(1,ALTO_BAJO_CHARACTERISTIC_UUID));
actButton.addEventListener('click', () => escribirParametro());
*/

// Check if BLE is available in your Browser
function isWebBluetoothEnabled() {
    if (!navigator.bluetooth) {
        console.log('Web Bluetooth API is not available in this browser!');
        bleStateContainer.innerHTML = "Web Bluetooth API no esta disponible!";
        return false
    }
    console.log('Web Bluetooth API supported in this browser.');
    return true
}

function obtenerUsuarioDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("usuario");
}

function cerrarSesion() {
  localStorage.removeItem("usuarioLogueado");
  window.location.href = "index.html";
}

// Connect to BLE Device and Enable Notifications
function connectToDevice(){
   
    console.log('Initializing Bluetooth...');
    navigator.bluetooth.requestDevice({
       // filters: [{name: deviceName}],
        filters: [{namePrefix: "COFACO"}],
        optionalServices: [bleService]
    })
    .then(device => {
        console.log('Device Selected:', device.name);
        bleStateContainer.innerHTML = 'Conectado ' + device.name;
        bleStateContainer.style.color = "#24af37";
        
        device.addEventListener('gattservicedisconnected', onDisconnected);

        mostrarSpinner("🔗 Conectando...");

        return device.gatt.connect();
    })
    .then(gattServer =>{
        bleServer = gattServer;
        console.log("Connected to GATT Server");
        return bleServer.getPrimaryService(bleService);
    })
    .then(async service => {
        bleServiceFound = service;
        console.log("Service discovered:", service.uuid);

        mostrarSpinner("📥 Leyendo modelo...");
        
        modelo =  await readCharacteristic(MODELO_CHARACTERISTIC_UUID);
        console.log("Modelo: ", modelo);
        const pantallaVisible = document.getElementById(`pantalla-${modelo}`);

       
         onButton =  pantallaVisible.querySelector("#onButton");
         abfButton = pantallaVisible.querySelector("#abfButton");
         actButton =  pantallaVisible.querySelector("#actButton");
         retrievedValue =  pantallaVisible.querySelector("#valueContainer");
         parametroLeido =  pantallaVisible.querySelector("#parLeido");
         selecTextos =  pantallaVisible.querySelector("#selecText");
         timestampContainer =  pantallaVisible.querySelector("#timestamp");
         timesEstadoContainer =  pantallaVisible.querySelector("#tiempoState");
         tempAmbienteContainer =  pantallaVisible.querySelector("#tempamb");
       
       // ocultarSpinner();

        if(modelo==="CE5"){
           
            if(usuarioActivo==="Admin")
              cargarOpcionesEnSelect("opcionesPorParametroCE5.csv","PermisosAdmin_CE5.csv" );
            else if(usuarioActivo==="Ingenieria1")
              cargarOpcionesEnSelect("opcionesPorParametroCE5.csv","PermisosIngenieria1_CE5.csv" );
            else if(usuarioActivo==="Ingenieria2")
              cargarOpcionesEnSelect("opcionesPorParametroCE5.csv","PermisosIngenieria2_CE5.csv" );
            else if(usuarioActivo==="Tecnica1")
              cargarOpcionesEnSelect("opcionesPorParametroCE5.csv","PermisosTecnica1_CE5.csv" );
            else if(usuarioActivo==="Tecnica2")
              cargarOpcionesEnSelect("opcionesPorParametroCE5.csv","PermisosTecnica2_CE5.csv" );

            onButton.addEventListener('click', () => onButtonAction(1,START_STOP_CHARACTERISTIC_UUID));
            abfButton.addEventListener('click', () => onButtonAction(1,ALTO_BAJO_CHARACTERISTIC_UUID));
            actButton.addEventListener('click', () => escribirParametro());
            document.getElementById("pantalla-CE5").style.display = "block";
        
        }else if(modelo==="CE4"){
          
            if(usuarioActivo==="Admin")
              cargarOpcionesEnSelect("opcionesPorParametroCE4.csv","PermisosAdmin_CE4.csv" );
            else if(usuarioActivo==="Ingenieria1")
              cargarOpcionesEnSelect("opcionesPorParametroCE4.csv","PermisosIngenieria1_CE4.csv" );
            else if(usuarioActivo==="Ingenieria2")
              cargarOpcionesEnSelect("opcionesPorParametroCE4.csv","PermisosIngenieria2_CE4.csv" );
            else if(usuarioActivo==="Tecnica1")
              cargarOpcionesEnSelect("opcionesPorParametroCE4.csv","PermisosTecnica1_CE4.csv" );
            else if(usuarioActivo==="Tecnica2")
              cargarOpcionesEnSelect("opcionesPorParametroCE4.csv","PermisosTecnica2_CE4.csv" );
            
            onButton.addEventListener('click', () => onButtonAction(1,START_STOP_CHARACTERISTIC_UUID));
            abfButton.addEventListener('click', () => onButtonAction(1,ALTO_BAJO_CHARACTERISTIC_UUID));
            actButton.addEventListener('click', () => escribirParametro());
            document.getElementById("pantalla-CE4").style.display = "block";

            vxDetContainer=pantallaVisible.querySelector("#vxdet");
            vxPosContainer=pantallaVisible.querySelector("#vxpos");
            vxPidContainer=pantallaVisible.querySelector("#vxpid");
            vxPoteContainer=pantallaVisible.querySelector("#vxpote");
            outA1Container=pantallaVisible.querySelector("#outa1");
            outA2Container=pantallaVisible.querySelector("#outa2");
           
       
        }else if(modelo==="CE4_MS"){
          if(usuarioActivo==="Admin")
            cargarOpcionesEnSelect("opcionesPorParametroCE4.csv","PermisosAdmin_CE4_MS.csv" );
          else if(usuarioActivo==="Ingenieria1")
            cargarOpcionesEnSelect("opcionesPorParametroCE4.csv","PermisosIngenieria1_CE4_MS.csv" );
          else if(usuarioActivo==="Ingenieria2")
            cargarOpcionesEnSelect("opcionesPorParametroCE4.csv","PermisosIngenieria2_CE4_MS.csv" );
          else if(usuarioActivo==="Tecnica1")
            cargarOpcionesEnSelect("opcionesPorParametroCE4.csv","PermisosTecnica1_CE4_MS.csv" );
          else if(usuarioActivo==="Tecnica2")
            cargarOpcionesEnSelect("opcionesPorParametroCE4.csv","PermisosTecnica2_CE4_MS.csv" );

          onButton.addEventListener('click', () => onButtonAction(1,START_STOP_CHARACTERISTIC_UUID));
          actButton.addEventListener('click', () => escribirParametro());
          document.getElementById("pantalla-CE4_MS").style.display = "block";
        
        }else{
           // alert("Modelo no reconocido");
            Swal.fire({ 
              title: "Modelo no reconocido", 
             // html: `Debe completar los datos`,
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

        ocultarSpinner();
        

        return service.getCharacteristic(ESTADO_CHARACTERISTIC_UUID);
    })
    .then(characteristic => {
        console.log("Characteristic discovered:", characteristic.uuid);
        caracteristicaEstado = characteristic;
        characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicChange);
        characteristic.startNotifications();
        console.log("Notifications Started Estado.");
        //return bleServiceFound.getCharacteristic(TIME_ESTADO_CHARACTERISTIC_UUID);
    })
    /*.then(characteristic => {
       characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicChangeTiempo);
       characteristic.startNotifications();
       console.log("Notifications Started tiempo .");
       return bleServiceFound.getCharacteristic(PARAMETRO_CHARACTERISTIC_UUID);
    })
    .then(characteristic => {
       characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicChangeParametro);
       characteristic.startNotifications();
       console.log("Notifications Started parametro .");
       return bleServiceFound.getCharacteristic(TEMP_AMB_CHARACTERISTIC_UUID);
    })
    .then(characteristic => {
      characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicChangeTempAmb);
      characteristic.startNotifications();
      console.log("Notifications Started TempAmb .");
   })*/
    .catch(error => {
      console.log("Error al iniciar las notificaciones");
        console.log('Error: ', error);
    })
}

function onDisconnected(event){
    console.log('Device Disconnected:', event.target.device.name);
    bleStateContainer.innerHTML = "Desconectado";
    bleStateContainer.style.color = "#d13a30";

    connectToDevice();
}

/*
function handleCharacteristicChangeTempAmb(event){
  //para temperatura Ambiente
  const newValueReceived = new TextDecoder().decode(event.target.value);
  console.log("Temperatura Amb: ", newValueReceived);
  tempAmbienteContainer.innerHTML = newValueReceived;

}

 function handleCharacteristicChangeTiempo(event){
   //para el tiempo del estado en seg
     const newValueReceived = new TextDecoder().decode(event.target.value);
    console.log("Tiempo en estado: ", newValueReceived);
    timesEstadoContainer.innerHTML = segundosAHoras(parseInt(newValueReceived, 10));
    //timesEstadoContainer.innerHTML = newValueReceived;
 }
*/
function handleCharacteristicChangeTempAmb(event) {
  const newValueReceived = new TextDecoder().decode(event.target.value);
  console.log("Temperatura Amb: ", newValueReceived);

  if (tempAmbienteContainer) {
    tempAmbienteContainer.innerHTML = newValueReceived;
  } else {
    console.warn("❗ tempAmbienteContainer no está listo aún");
  }
}

function handleCharacteristicChangeTiempo(event) {
  const newValueReceived = new TextDecoder().decode(event.target.value);
  console.log("Tiempo en estado: ", newValueReceived);

  if (timesEstadoContainer) {
    const tiempo = parseInt(newValueReceived, 10);
    if (!isNaN(tiempo)) {
      timesEstadoContainer.innerHTML = segundosAHoras(tiempo);
    } else {
      console.warn("⚠️ Valor de tiempo inválido:", newValueReceived);
    }
  } else {
    console.warn("❗ timesEstadoContainer no está listo aún");
  }
}


 function handleCharacteristicChangeParametro(event){
   //para el lectura del parametro
    const newValueReceived = new TextDecoder().decode(event.target.value);
    console.log("Parmetro valor: ", newValueReceived);
    

    for (var i=0; i<opcionesTextuales.length; i++) {
      var dir = opcionesTextuales[i][0];
      if(dir==lastDirParam){
        //es textual
        console.log("Es un parametro textual: ", parseInt(newValueReceived) + 1);
        parametroLeido.value = opcionesTextuales[i][parseInt(newValueReceived) + 1];
        return; 
      }
    
}
    //es numerico  
    parametroLeido.value = newValueReceived;
 }

async function handleCharacteristicChange(event){
   //para el estado del quemador
    const newValueReceived = new TextDecoder().decode(event.target.value);
    console.log("Estado Recibido: ", newValueReceived);
    retrievedValue.innerHTML = newValueReceived;
    timestampContainer.innerHTML = getDateTime();
   
    if(newValueReceived.includes("AL")){
        onButton.innerText = "REARMAR";
    }else  if(newValueReceived !==("LISTO") && newValueReceived !==("EN ESPERA") ){
        onButton.innerText = "APAGAR";
    }else{
         onButton.innerText = "ENCENDER";
    }
      //isLecturaDispaly=1;
      //readCharacteristic2(TIME_ESTADO_CHARACTERISTIC_UUID);
      await leerDatosDisplay();


}


function readCharacteristic2(caracteristica){

       
    if (bleServer && bleServer.connected) {
        bleServiceFound.getCharacteristic(caracteristica)
        .then(characteristic => {
            //console.log("Found the characteristic: ", characteristic.uuid);
            return characteristic.readValue();
        })
        .then(value => {
            console.log("Leyendo a", caracteristica);
           
            if(caracteristica==ALTO_BAJO_CHARACTERISTIC_UUID) {
                var abfC = new TextDecoder().decode(value);
                 console.log("Estado ABF:", abfC);
                 isLecturaDispaly=0;
                 
                 if(abfC === ("DESACTIVADO")){
                    if(modelo==="CE4" || modelo === "CE5")
                      abfButton.innerText="ALTO FUEGO";
                    else
                      abfButton.innerText="DESACTIVADO";
                  }else{
                      if(modelo==="CE4" || modelo === "CE5")
                        abfButton.innerText="BAJO FUEGO";
                      else
                      abfButton.innerText="ACTIVADO";
                  }
            }
            if(caracteristica==TIME_ESTADO_CHARACTERISTIC_UUID){
                 const newValueReceived = new TextDecoder().decode(value);
                 console.log("Nuevo tiempo Estado: ", newValueReceived);
                // timesEstadoContainer.innerHTML = newValueReceived;
                 timesEstadoContainer.innerHTML = segundosAHoras(parseInt(newValueReceived, 10));
                 readCharacteristic2(TEMP_AMB_CHARACTERISTIC_UUID);
                  
            }
            
            if(caracteristica==TEMP_AMB_CHARACTERISTIC_UUID){
              const newValueReceived = new TextDecoder().decode(value);
              console.log("Temperatura Amb: ", newValueReceived);
              tempAmbienteContainer.innerHTML = newValueReceived;
              readCharacteristic2(ALTO_BAJO_CHARACTERISTIC_UUID);
               
            }

            if(caracteristica==PARAMETRO_CHARACTERISTIC_UUID){
                
                const newValueReceived = new TextDecoder().decode(value);
                console.log("Nuevo val Parametro: ", newValueReceived);
               
                //si hubo error
                if(newValueReceived==="ERROR"){
                    lastValueWrite="";
                    leerParametro();
                }else{
                  mostrarCampoSegunDireccionYValor(lastDirParam, newValueReceived);
                  //reinicio las notificaciones
                  caracteristicaEstado.startNotifications();
                  ocultarSpinner();
                }
            }
                    
        })
        .catch(error => {
            console.error("Error reading to characteristic: ", error);
            ocultarSpinner();
            Swal.fire({ 
              title: "No se pudo Leer", 
             // html: `Debe completar los datos`,
              icon: "error",
              background: "#2c2c2e",
              color: "#e0e0e0",
              confirmButtonColor: "#4b6cb7",
              confirmButtonText: "OK",
              customClass: {
                  popup: 'swal-dark'
                } 
              });
        });
    } else {
        console.error ("Bluetooth is not connected. Cannot write to characteristic.")
        window.alert("Bluetooth no conectado. \n Debe conectarse!")
        ocultarSpinner();
    }
}

async function readCharacteristic(caracteristica){
    var resultado="ERROR";

    if (bleServer && bleServer.connected) {
        await bleServiceFound.getCharacteristic(caracteristica)
        .then(async characteristic => {
            console.log("Found the characteristic: ", characteristic.uuid);
            return await characteristic.readValue();
        })
        .then(value => {
            const decoder = new TextDecoder("utf-8");
            const lectura = decoder.decode(value).trim();
            resultado=lectura;
            console.log("Caracteristica: ", caracteristica);
            console.log("Valor leido: ", lectura);
                    
        })
        .catch(error => {
            console.error("Error reading to characteristic: ", error);

            caracteristicaEstado.stopNotifications();
            disconnectDevice();
            
            Swal.fire({ 
              title: "No se pudo Leer", 
             // html: `Debe completar los datos`,
              icon: "error",
              background: "#2c2c2e",
              color: "#e0e0e0",
              confirmButtonColor: "#4b6cb7",
              confirmButtonText: "OK",
              customClass: {
                  popup: 'swal-dark'
                } 
              });
        });
    } else {
        console.error ("Bluetooth is not connected. Cannot write to characteristic.")
        //window.alert("Bluetooth no conectado. \n Debe conectarse!")
        caracteristicaEstado.stopNotifications();
        disconnectDevice();
        
        Swal.fire({ 
          title: "No esta conectado", 
         // html: `Debe completar los datos`,
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

    return resultado;
}

function writeOnCharacteristic(value, caracteristica){
    
   
    if (bleServer && bleServer.connected) {
        bleServiceFound.getCharacteristic(caracteristica)
        .then(characteristic => {
            console.log("Found the characteristic: ", characteristic.uuid);
           
             //const data = new Uint8Array([value]);
            //return characteristic.writeValue(data);
            let encoder = new TextEncoder('utf-8');
            return characteristic.writeValue(encoder.encode(value));
        })
        .then(() => {
           // latestValueSent.innerHTML = value;
            console.log("Value written to characteristic:", value);
            if(isEscritura===1){
              isEscritura=0;
               //reinicio las notificaciones
              caracteristicaEstado.startNotifications();
            }
            ocultarSpinner();
        })
        .catch(error => {
            console.error("Error writing to characteristic: ", error);
            ocultarSpinner();
            Swal.fire({ 
              title: "No se pudo Escribir", 
             // html: `Debe completar los datos`,
              icon: "error",
              background: "#2c2c2e",
              color: "#e0e0e0",
              confirmButtonColor: "#4b6cb7",
              confirmButtonText: "OK",
              customClass: {
                  popup: 'swal-dark'
                } 
              });
           

        });
    } else {
        console.error ("Bluetooth is not connected. Cannot write to characteristic.")
        window.alert("Bluetooth no conectado. \n Debe conectarse!")
        ocultarSpinner();
    }
}

 async function escribirParametro(){
   // var e = document.getElementById("seleParm");
    const pantallaVisible = document.getElementById(`pantalla-${modelo}`);
    var e = pantallaVisible.querySelector("#seleParm");
    var dir = e.value; //direccion a escribir
    var parametro = e.options[e.selectedIndex].text;
    const param = datosModelo.find(p => p.direccion === parseInt(dir));

    const permiso = permisos.find(p => p.parametro === parametro);
    
    //console.log('nombre:', parametro);

    console.log('Permisos:', permiso);

    if (!permiso || permiso.editable.toUpperCase() === "NO") {

      Swal.fire({ 
        title: "No Tiene Permiso de Edicion", 
       // html: `Debe completar los datos`,
        icon: "error",
        background: "#2c2c2e",
        color: "#e0e0e0",
        confirmButtonColor: "#4b6cb7",
        confirmButtonText: "OK",
        customClass: {
            popup: 'swal-dark'
          } 
        });
       
      return; // si no tiene permiso de edicion, me voy
    }
    
    var valor;
    if(param.tipo==="TEXTO"){
         valor =  selecTextos.value;
         
    }else if(param.tipo==="NUMERICO"){
        valor =  parametroLeido.value;
        const partes = parametroLeido.step.split(".");
        const decimales = partes[1] ? partes[1].length : 0;
        console.log('decimales:',decimales);
       
        let numero = parseFloat(valor.replace(",", "."));
        console.log('valor:', numero);
        numero = numero * Math.pow(10, decimales);
        console.log('valor final:', numero);

        valor= numero.toString();
        

    }else if(param.tipo==="DESPLAZAMIENTO_WORDS"){
      
      //const inputN1 = document.getElementById("n1Leido");
      //const inputN2 = document.getElementById("n2Leido");
      const pantallaVisible = document.getElementById(`pantalla-${modelo}`);
      const inputN1 = pantallaVisible.querySelector("#n1Leido");
      const inputN2 = pantallaVisible.querySelector("#n2Leido");
      var valor1 =  inputN1.value;
      var valor2 =  inputN2.value;
      let numero1 = parseFloat(valor1.replace(",", "."));
      let numero2 = parseFloat(valor2.replace(",", "."));
      numero1 = numero1 * Math.pow(10, 2);
      numero2 = numero2 * Math.pow(10, 2);
      numero1=numero1<<16;
      numero1=numero1+numero2;
      valor= numero1.toString();
      console.log('valor DW:', valor);
      
    }
    mostrarSpinner("Actualizando...");

    lastValueWrite=valor;
    isEscritura=1;

   
    var toSend =dir.concat(",").concat(valor);

    await esperarHasta(() =>  isLecturaDispaly === 0);
    
    //detengo las notificaciones , para evitar concurrencias
    caracteristicaEstado.stopNotifications()
    .then(() => {
      //escribo la direccion del parametro, 
      console.log('escribo el parametro:',parametro.concat(" ").concat(toSend));
      writeOnCharacteristic(toSend, PARAMETRO_CHARACTERISTIC_UUID);
      // lecturaParam3Async(); //luego de escribir, 3seg y leo para confirmar
      // ocultarSpinner();
      })
      .catch(error => {
        console.log("An error occurred:", error);
        ocultarSpinner();
        Swal.fire({ 
          title: "No se pudo Escribir", 
         // html: `Debe completar los datos`,
          icon: "error",
          background: "#2c2c2e",
          color: "#e0e0e0",
          confirmButtonColor: "#4b6cb7",
          confirmButtonText: "OK",
          customClass: {
              popup: 'swal-dark'
            } 
          });

      });
    
}

  async function leerParametro(){
    //var e = document.getElementById("seleParm");
    const pantallaVisible = document.getElementById(`pantalla-${modelo}`);
    var e = pantallaVisible.querySelector("#seleParm");
    var dir = e.value; //direccion a leer
    var parametro = e.options[e.selectedIndex].text;
     if(dir=="0") return ;
     
     lastDirParam=dir;
     
     mostrarSpinner("Leyendo...");
    
     await esperarHasta(() =>  isLecturaDispaly === 0);
     //detengo las notificaciones , para evitar concurrencias
     caracteristicaEstado.stopNotifications()
     .then(() => {
          //escribo la direccion del parametro, y luego de 2seg leo su valor
        console.log('leo el parametro:',parametro.concat(" ").concat(dir));
        writeOnCharacteristic(dir, PARAMETRO_CHARACTERISTIC_UUID);
        lecturaParamAsync();
        // ocultarSpinner(); 
      })
      .catch(error => {
        console.log("An error occurred:", error);
        ocultarSpinner();
        Swal.fire({ 
          title: "No se pudo Leer", 
         // html: `Debe completar los datos`,
          icon: "error",
          background: "#2c2c2e",
          color: "#e0e0e0",
          confirmButtonColor: "#4b6cb7",
          confirmButtonText: "OK",
          customClass: {
              popup: 'swal-dark'
            } 
          });
      });
     
}


async function leerDatosDisplay() {
  isLecturaDispaly=1;
  let testate= await readCharacteristic(TIME_ESTADO_CHARACTERISTIC_UUID);
  console.log("Nuevo tiempo Estado: ", testate);
  if(testate!="ERROR"){
    timesEstadoContainer.innerHTML = segundosAHoras(parseInt(testate, 10));
  }
  let tamb  = await readCharacteristic(TEMP_AMB_CHARACTERISTIC_UUID);
  console.log("Temperatura Amb: ", tamb);
  if(tamb!="ERROR"){
    if(modelo==="CE5"){
      tempAmbienteContainer.innerHTML = tamb;
    }else{
      //para los CE4 TA;DET;POS;PID;POTE;SA1;SA2
      const valores = tamb.split(";");
      tempAmbienteContainer.innerHTML = valores[0];
      vxDetContainer.innerHTML = valores[1];
      vxPosContainer.innerHTML = valores[2];
      vxPidContainer.innerHTML = valores[3];
      vxPoteContainer.innerHTML = valores[4];
      outA1Container.innerHTML = valores[5];
      outA2Container.innerHTML = valores[6];
    }
  }
  
  let eabf  = await readCharacteristic(ALTO_BAJO_CHARACTERISTIC_UUID);
  console.log("Estado ABF:", eabf);
  if(eabf!="ERROR"){
      if(eabf === ("DESACTIVADO")){
        if(modelo==="CE4" || modelo === "CE5")
          abfButton.innerText="ALTO FUEGO";
        else
          abfButton.innerText="DESACTIVADO";
      }else{
          if(modelo==="CE4" || modelo === "CE5")
            abfButton.innerText="BAJO FUEGO";
          else
          abfButton.innerText="ACTIVADO";
      }
  }

  let insouts  = await readCharacteristic(INS_OUTS_CHARACTERISTIC_UUID);
  let bits  = separarBits32(parseInt(insouts));
  console.log("Estado entradas y salidas:", bits);

  if(modelo==="CE5")
    ledsCE5(bits);
  else
    ledsCE4(bits);
  
 /*for (let i = 1; i <= bits.length; i++) {
    const estadoIn = (bitsEntrada >> (i - 1)) & 0x01 ? "on" : "off";
    const estadoOut = (bitsSalida >> (i - 1)) & 0x01 ? "on" : "off";

    setLed(`led-in${i}`, estadoIn);
    setLed(`led-out${i}`, estadoOut);
  }*/
  

  isLecturaDispaly=0;
}

function separarBits32(numero) {

  const bits = [];
 
  for (let i = 0; i<nombresInsOut.length-1 ; i++) {
    const bit = (numero >>> i) & 1;
    bits.push({ nombre: nombresInsOut[i], valor: bit });
  }
  return bits;
}


function ledsCE5(bits){
  let estado= "off";
 
  for (const dato of bits) {

    if(dato.valor===1)
      estado= "on";
    else
       estado= "off";


    if (dato.nombre=="ENT_INI") {
      //es NC
      if(dato.valor===1)
          estado= "off";
      else
        estado= "on"; 
      setLed(`#led-in1`,estado);
    }
    if (dato.nombre=="ENT_REA") {
      //es NC
      if(dato.valor===1)
        estado= "off";
    else
      estado= "on"; 
      setLed(`#led-in2`,estado);
    }
    if (dato.nombre=="ENT_ABF") {
      setLed(`#led-in3`, estado);
    }
    if (dato.nombre== "ENT_PAB") {
      setLed(`#led-in4`, estado);
    }
    if (dato.nombre=="ENT_PGB") {
      setLed(`#led-in5`, estado);
    }
    if (dato.nombre=="ENT_DET") {
      setLed(`#led-in6`, estado);
    }


    if (dato.nombre=="SAL_SQ3") {
      setLed(`#led-out1`, estado);
    }
    if (dato.nombre=="SAL_SQ1") {
      setLed(`#led-out2`, estado);
    }
    if (dato.nombre=="SAL_SPI") {
      setLed(`#led-out3`, estado);
    }
    if (dato.nombre== "SAL_ENC") {
      setLed(`#led-out4`, estado);
    }
    if (dato.nombre=="SAL_MOT") {
      setLed(`#led-out5`, estado);
    }
  }

}

function ledsCE4(bits){
  let estado= "off";
 
  for (const dato of bits) {

    if(dato.valor===1)
      estado= "on";
    else
       estado= "off";


    if (dato.nombre=="ENT_INI") {
      //es NC
      if(dato.valor===1)
          estado= "off";
      else
        estado= "on"; 
      setLed(`#led-in1`,estado);
    }
    if (dato.nombre=="ENT_REA") {
      //es NC
      if(dato.valor===1)
        estado= "off";
    else
      estado= "on"; 
      setLed(`#led-in2`,estado);
    }

    if (dato.nombre=="ENT_MVC") {
      setLed(`#led-in3`, estado);
    }
    if (dato.nombre== "ENT_PAB") {
      setLed(`#led-in4`, estado);
    }
    if (dato.nombre=="ENT_PGB") {
      setLed(`#led-in5`, estado);
    }
    if (dato.nombre=="ENT_PGA") {
      setLed(`#led-in6`, estado);
    }
    if (dato.nombre=="ENT_PPG") {
      setLed(`#led-in7`, estado);
    }
    if (dato.nombre=="ENT_FCA") {
      setLed(`#led-in8`, estado);
    }
    if (dato.nombre=="ENT_FCC") {
      setLed(`#led-in9`, estado);
    }
    if (dato.nombre=="ENT_DET") {
      setLed(`#led-in10`, estado);
    }


    if (dato.nombre=="SAL_SQ3") {
      setLed(`#led-out1`, estado);
    }
    if (dato.nombre=="SAL_SQ2") {
      setLed(`#led-out2`, estado);
    }
    if (dato.nombre=="SAL_SQ1") {
      setLed(`#led-out3`, estado);
    }
    if (dato.nombre=="SAL_SPI") {
      setLed(`#led-out4`, estado);
    }
    if (dato.nombre== "SAL_ENC") {
      setLed(`#led-out5`, estado);
    }
    if (dato.nombre=="SAL_MOT") {
      setLed(`#led-out6`, estado);
    }
  }

}

async function onButtonAction(value,caracteristica){

  await esperarHasta(() =>  isLecturaDispaly === 0);
  
  isEscritura=1;
  mostrarSpinner("Actualizando...");
 
  //detengo las notificaciones , para evitar concurrencias
  caracteristicaEstado.stopNotifications()
  .then(() => {
    
    writeOnCharacteristic(value,caracteristica);
   
    })
    .catch(error => {
      console.log("An error occurred:", error);
      ocultarSpinner();
      Swal.fire({ 
        title: "No se pudo Actualizar", 
       // html: `Debe completar los datos`,
        icon: "error",
        background: "#2c2c2e",
        color: "#e0e0e0",
        confirmButtonColor: "#4b6cb7",
        confirmButtonText: "OK",
        customClass: {
            popup: 'swal-dark'
          } 
        });

    });
}

// funcion lectura parametro , se ejecuta luego de 2 seg
function resolveAfter2Seconds() {
    return new Promise((resolve) => {
      setTimeout(() => {
        readCharacteristic2(PARAMETRO_CHARACTERISTIC_UUID); 
      }, 2000);
    });
  }
// funcion lectura parametro , se ejecuta luego de 3 seg
  function resolveAfter3Seconds() {
    return new Promise((resolve) => {
      setTimeout(() => {
        leerParametro();
      }, 3000);
    });
  }
  

async function lecturaParamAsync() {
    await resolveAfter2Seconds();
}

async function lecturaParam3Async() {
    await resolveAfter3Seconds();
  
}

function esperarHasta(condicionFn, intervalo = 200) {
  return new Promise(resolve => {
    const verificador = setInterval(() => {
      if (condicionFn()) {
        clearInterval(verificador);
        resolve();
      }
    }, intervalo);
  });
}


async function disconnectDevice() {
    console.log("Disconnect Device.");
    if (bleServer && bleServer.connected) {
        if (caracteristicaEstado) {
          await esperarHasta(() =>  isLecturaDispaly === 0);
          caracteristicaEstado.stopNotifications()
                .then(() => {
                    console.log("Notifications Stopped");
                    return bleServer.disconnect();
                })
                .then(() => {
                    console.log("Device Disconnected");
                    bleStateContainer.innerHTML = "Desconectado";
                    bleStateContainer.style.color = "#d13a30";

                })
                .catch(error => {
                    console.log("An error occurred:", error);
                });
        } else {
            console.log("No characteristic found to disconnect.");
        }
    } else {
        // Throw an error if Bluetooth is not connected
        console.error("Bluetooth is not connected.");
       // window.alert("Bluetooth no conectado.")
        bleStateContainer.innerHTML = "Desconectado";
        bleStateContainer.style.color = "#d13a30";
    }
}

function getDateTime() {
    var currentdate = new Date();
    var day = ("00" + currentdate.getDate()).slice(-2); // Convert day to string and slice
    var month = ("00" + (currentdate.getMonth() + 1)).slice(-2);
    var year = currentdate.getFullYear();
    var hours = ("00" + currentdate.getHours()).slice(-2);
    var minutes = ("00" + currentdate.getMinutes()).slice(-2);
    var seconds = ("00" + currentdate.getSeconds()).slice(-2);

    var datetime = day + "/" + month + "/" + year + " at " + hours + ":" + minutes + ":" + seconds;
    return datetime;
}

function segundosAHoras(segundos) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
  
    // Agrega ceros adelante si es necesario
    const hh = String(horas).padStart(4, '0');
    const mm = String(minutos).padStart(2, '0');
    const ss = String(segs).padStart(2, '0');
  
    return `${hh}:${mm}:${ss}`;
  }

async function parseCSV_DatosModelo(ruta) {
    
    const respuesta = await fetch(ruta);
    const csvTexto = await respuesta.text();

    const lineas = csvTexto.trim().split("\n");
    const resultado = [];
  
    for (const linea of lineas) {
      const campos = linea.split(";");
      const nombre = campos[0];
      const direccion = parseInt(campos[1]);
      const tipo = campos[2];
  
      if (tipo === "TEXTO") {
        const opciones = campos.slice(3);
        resultado.push({
          nombre,
          direccion,
          tipo,
          opciones
        });
      } else if (tipo === "NUMERICO") {
        const min = parseFloat(campos[3]);
        const max = parseFloat(campos[4]);
        const decimales = parseInt(campos[5]);
        const unidad = campos[6];
        resultado.push({
          nombre,
          direccion,
          tipo,
          min,
          max,
          decimales,
          unidad
        });
      }else if(tipo === "INDICACION"){
        const decimales = parseInt(campos[3]);
        const unidad = campos[4];
        resultado.push({
          nombre,
          direccion,
          tipo,
          decimales,
          unidad
        });
      }else if(tipo === "DESPLAZAMIENTO_WORDS"){
        const n1 = campos[3]; //tiene el nombre del primer word
        const n2 = campos[4]; //tiene el nombre del segundo word
        const decimales = parseInt(campos[5]);
        const unidad = campos[6];
        resultado.push({
          nombre,
          direccion,
          tipo,
          n1,
          n2,
          decimales,
          unidad
        });
      }else if(tipo === "DESPLAZAMIENTO_BITS"){
        const opciones = campos.slice(3); //tiene el nombre de cada bits
        resultado.push({
          nombre,
          direccion,
          tipo,
          opciones
        });
      }else {
        console.warn("Tipo desconocido en línea:", linea);
      }
    }
  
    return resultado;
  }


  async function parseCSV_Permisos(ruta) {
    
    const respuesta = await fetch(ruta);
    const csvTexto = await respuesta.text();

    const lineas = csvTexto.trim().split("\n");
    
    const resultado =  lineas.map(linea => {
      const [parametro, visible,editable] = linea.split(",");
      return { parametro: parametro, visible: visible, editable: editable};
    });
  
  
    return resultado;
  }

  /*async function cargarPermisosParaUsuario(usuario, tipo) {
    const archivo = `Permisos${usuario}_${tipo}.csv`;
    const respuesta = await fetch(archivo);
    const texto = await respuesta.text();
    const lineas = texto.trim().split("\n");
  
    const resultado = lineas.map(l => {
      const [parametro, visible, editable] = l.split(",");
      return {
        parametro: parametro.trim(),
        visible: visible.trim(),
        editable: editable.trim()
      };
    });

    return resultado;
  }
  */

  function mostrarSpinner(mensaje = "Procesando...") {
    const spinner = document.getElementById("spinner");
    const texto = document.getElementById("spinner-text");
    texto.textContent = mensaje;
    spinner.style.display = "flex";
  }
  
  function ocultarSpinner() {
    document.getElementById("spinner").style.display = "none";
  }

  function nombresEntradasYSalidas(){
    
    for (const dato of datosModelo) {
      if (dato.tipo === "DESPLAZAMIENTO_BITS" && Array.isArray(dato.opciones)) {
        nombresInsOut=dato.opciones;
    }
    }

  }

  async function cargarOpcionesEnSelect(rutaCSV, rutaPermisos) {
    try {
      const datos = await parseCSV_DatosModelo(rutaCSV); //cargo todos los parametros del modelo
      datosModelo=datos;
      permisos = await parseCSV_Permisos(rutaPermisos);
      console.log(permisos);
  
     // const select = document.getElementById("seleParm");
      const pantallaVisible = document.getElementById(`pantalla-${modelo}`);
      const select = pantallaVisible.querySelector("#seleParm");
      select.length = 1; // Deja solo el primer <option> (placeholder)
  
      for (const dato of datos) {
        const permiso = permisos.find(p => p.parametro === dato.nombre);
        if (!permiso || permiso.visible.toUpperCase() !== "SI") {
          continue; // si no tiene permiso de visibilidad, no lo muestro
        }
  
        const option = document.createElement("option");
        option.value = dato.direccion;
       // option.textContent = `${dato.nombre} (${dato.direccion})`;
       option.textContent = `${dato.nombre}`;
       select.appendChild(option);

        // Si es tipo TEXTO, guardamos en el array
        if (dato.tipo === "TEXTO" && Array.isArray(dato.opciones)) {
            opcionesTextuales.push([dato.direccion.toString(), ...dato.opciones]);
        }
      }
  
      console.log("Select cargado con", datos.length, "parámetros.");
      console.log("🧾 Opciones textuales:", opcionesTextuales);

      nombresEntradasYSalidas();
      console.log("Nombres entradas y salidas:", nombresInsOut);
  
    } catch (err) {
      console.error("Error al cargar select:", err);
    }
  }

  
  function mostrarCampoSegunDireccionYValor(direccion, valor) {
  
    const param = datosModelo.find(p => p.direccion === parseInt(direccion));
  
    if (!param) {
      console.warn("Parámetro no encontrado para dirección:", direccion);
      return;
    }
    const pantallaVisible = document.getElementById(`pantalla-${modelo}`);
   
    /*const inputNum = document.getElementById("parLeido");
    const selecText = document.getElementById("selecText");
  //para el tipo DESPLAZAMIENTO_WORDS
    const inputN1 = document.getElementById("n1Leido");
    const inputN2 = document.getElementById("n2Leido");
    const lN1 = document.getElementById("s1L");
    const lN2 = document.getElementById("s2L");*/
    const inputNum = pantallaVisible.querySelector("#parLeido");
    const selecText = pantallaVisible.querySelector("#selecText");
    const inputN1 = pantallaVisible.querySelector("#n1Leido");
    const inputN2 = pantallaVisible.querySelector("#n2Leido");
    const lN1 = pantallaVisible.querySelector("#s1L");
    const lN2 = pantallaVisible.querySelector("#s2L");
    
    // Reset UI
    inputNum.style.display = "none";
    inputNum.readOnly = false;
    selecText.style.display = "none";

    if( modelo !== "CE5"){
      inputN1.style.display = "none";
      inputN2.style.display = "none";
      lN1.style.display = "none";
      lN2.style.display = "none";
    }
    
  
    if (param.tipo === "TEXTO") {
      // Buscar en opcionesTextuales
      lastDirParamIsTexto=1;
      const opciones = opcionesTextuales.find(op => parseInt(op[0]) === parseInt(direccion));
      if (!opciones) {
        console.warn("No se encontraron opciones textuales para dirección:", direccion);
        return;
      }
  
      selecText.innerHTML = "";
      for (let i = 1; i < opciones.length; i++) {
        const option = document.createElement("option");
        option.value = i - 1; // el índice numérico a enviar
        option.textContent = opciones[i];
        if (parseInt(valor) === (i - 1)) {
          option.selected = true;
        }
        selecText.appendChild(option);
      }
  
      selecText.style.display = "inline-block";
  
    } else if (param.tipo === "NUMERICO") {
      lastDirParamIsTexto=0;
      var val=parseFloat(valor);
      val=val/Math.pow(10, param.decimales);
      inputNum.type = "number";
      inputNum.step = param.decimales > 0 ? `0.${'0'.repeat(param.decimales - 1)}1` : "1";
      inputNum.min = param.min ?? 0;
      inputNum.max = param.max ?? 9999;
      inputNum.value =val.toFixed(param.decimales);
      inputNum.style.display = "inline-block";
  
    } else if (param.tipo === "INDICACION" ) {
      lastDirParamIsTexto=0;
      var val=parseFloat(valor);
      val=val/Math.pow(10, param.decimales);
      inputNum.type = "text";
      inputNum.readOnly = true;
      inputNum.value = val.toFixed(param.decimales);
      inputNum.style.display = "inline-block";

    }else  if(param.tipo === "DESPLAZAMIENTO_WORDS"){
      lastDirParamIsTexto=0;
      var val=parseInt(valor);
      var n1=val&0xFFFF0000;
      n1=n1>>16;
      var n2=val&0x0000FFFF;
      var valN1=parseFloat(n1);
      valN1=valN1/Math.pow(10, param.decimales);
      var valN2=parseFloat(n2);
      valN2=valN2/Math.pow(10, param.decimales);
      inputN1.type = "number";
      inputN2.type = "number";
      inputN1.step = param.decimales > 0 ? `0.${'0'.repeat(param.decimales - 1)}1` : "1";
      inputN2.step = param.decimales > 0 ? `0.${'0'.repeat(param.decimales - 1)}1` : "1";
      inputN1.value = valN1.toFixed(param.decimales);
      inputN2.value = valN2.toFixed(param.decimales);
      inputN1.style.display = "inline-block";
      inputN2.style.display = "inline-block";
      lN1.style.display = "inline-block";
      lN2.style.display = "inline-block";

    }
    
    else {
      console.warn("Tipo no manejado:", param.tipo);
    }
  }

  function setLed(id, estado) {
    const pantallaVisible = document.getElementById(`pantalla-${modelo}`);
    const led = pantallaVisible.querySelector(id);
    led.className = "led"; // limpia clases
    led.classList.add(estado); // agrega nueva: "on", "off", "error", "warning"
  }
  