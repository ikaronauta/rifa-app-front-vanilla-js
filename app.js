const API_KEY = "4Vj8eK4rloUd272L48hsrarnUA";
const merchantId = '508029';
const accountId = '512321';
const currency = 'COP';
const baseUrl = 'https://9af1-191-156-47-33.ngrok-free.app';
const confirmationUrl = `${baseUrl}/payu-confirmation`;

let boletas, tabla;

const buttonEliminar = $('<button>', {
  class: 'eliminar'
});

let estados = {
  0: 'Disponible',
  1: 'Reservada',
  2: 'Pagada'
}

function inicio() {

  const params = new URLSearchParams(window.location.search);
  const status = params.get('status');

  debugger;

  if(status == 'success'){
    $('#main').hide();
    $('#success').show();
  }
    

  tabla = $('#miTabla').DataTable(
    {
      columnDefs: [
        {
          targets: [2], // Índice de la columna que quieres ocultar (empieza en 0)
          visible: false, // Oculta la columna
          searchable: false // Opcional: evita que se busque en esta columna
        }
      ]
    }
  );
  listeners();
  initBoletas();
}

function initBoletas() {
  fetch(baseUrl, {
    method: 'GET',
    credentials: 'include'
  })
    .then(response => response.json())
    .then(data => {
      boletas = data.data;
      console.log(data);

      $('#louderBoletas').hide();

      $(boletas).each((a, b) => {
        tabla.row.add([
          b.id,
          b.numero,
          estados[b.estado],
          '<button class="eliminar">Eliminar</button>'
        ]).draw(false);
      });
    }).catch(error => {
      console.error('Error:', error);
      $('#louderBoletas').text(`Error: ${error}`);
    });
}

function listeners() {
  $('#agregarBoleta').on('click', () => {

    $('#louderBoletas').text('Agregando boleta...').show();

    fetch(baseUrl, {
      method: 'GET',
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        let boleta = data.data[0];
        boletas.push(boleta);

        $('#louderBoletas').hide();

        tabla.row.add([
          boleta.id,
          boleta.numero,
          estados[boleta.estado],
          '<button class="eliminar">Eliminar</button>']).draw(false);
      })
      .catch(error => { 
        console.error('Error:', error);
        $('#louderBoletas').text(`Error: ${error}`);
      });
  });

  $('#miTabla tbody').on('click', '.eliminar', function () {
    if (tabla.rows().count() == 3)
      return alert('La cantidad minima son 3 boletas.');

    $('#louderBoletas').text('Eliminando boleta...').show();

    let fila = $(this).closest('tr');
    let idBoleta = tabla.row(fila).data()[0];

    fetch(`${baseUrl}/remove-boleta-by-id/${idBoleta}`, {
      method: 'GET',
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);

        if (data.success) {
          $('#louderBoletas').hide();
          tabla.row(fila).remove().draw(false);

          let idAEliminar = parseInt(data.data[0].idBoleta);
          let index = boletas.findIndex(boleta => boleta.id == idAEliminar);

          if (index != -1)
            boletas.splice(index, 1);
        }

        $('#louderBoletas').text(`Error: ${error}`);

      }).catch(error => {
        console.error('Error:', error);
        $('#louderBoletas').text(`Error: ${error}`);
      });
  });

  $('#pagar').on('click', () => {
    let valorPagar = boletas.length * 10000;
    let message = `Cantidad de boletas: ${boletas.length}. \nValor a pagar: \$${(valorPagar).toLocaleString('es-ES')} pesos.`;
    let referenceCode_ = `RIFA_${Date.now()}`;

    // Obtener los IDs de la primera columna
    let ids = tabla
      .column(0) // Seleccionar la primera columna (ID)
      .data()    // Obtener los datos de la columna
      .toArray() // Convertir a array normal
      .join(', '); // Unir los elementos con comas y espacios

    if (confirm(message)) {
      // Crear formulario dinámico
      let form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/';

      // Agregar campos requeridos
      let fields = {
          merchantId: merchantId,
          accountId: accountId,
          referenceCode: referenceCode_,
          amount: valorPagar.toFixed(2),
          currency: currency,
          signature: generateMD5Signature(API_KEY, merchantId, referenceCode_, valorPagar.toFixed(2), currency),
          test: '1', // 1 = Modo sandbox
          description: ids,
          confirmationUrl: confirmationUrl
      };

      // Insertar campos en el formulario
      Object.keys(fields).forEach(key => {
          let input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = fields[key];
          form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit(); // Enviar formulario a PayU
  }
  });
}

function generateMD5Signature(apiKey, merchantId, referenceCode, amount, currency) {
  // Concatenar según la estructura de PayU
  const data = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`;

  // Generar hash MD5
  return CryptoJS.MD5(data).toString().toUpperCase(); // Convertir a mayúsculas
}

inicio();