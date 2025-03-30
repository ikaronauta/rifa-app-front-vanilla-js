const API_KEY = "4Vj8eK4rloUd272L48hsrarnUA";
const merchantId = '508029';
const accountId = '512321';
const currency = 'COP';

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

  tabla = $('#miTabla').DataTable();
  listeners();
  initBoletas();
}

function initBoletas() {
  fetch('http://localhost:3000/', {
    method: 'GET',
    credentials: 'include'
  })
    .then(response => response.json())
    .then(data => {
      boletas = data.data;
      console.log(data);

      $(boletas).each((a, b) => {
        tabla.row.add([
          b.id,
          b.numero,
          estados[b.estado],
          '<button class="eliminar">Eliminar</button>'
        ]).draw(false);
      });
    }).catch(error => {
      console.error('Error:', error)
    });
}

function listeners() {
  $('#agregarFila').on('click', () => {

    fetch('http://localhost:3000/', {
      method: 'GET',
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        let boleta = data.data[0];
        boletas.push(boleta);

        tabla.row.add([
          boleta.id,
          boleta.numero,
          estados[boleta.estado],
          '<button class="eliminar">Eliminar</button>']).draw(false);
      })
      .catch(error => { console.error('Error:', error) });
  });

  $('#miTabla tbody').on('click', '.eliminar', function () {
    if (tabla.rows().count() == 3)
      return alert('La cantidad minima son 3 boletas.');

    let fila = $(this).closest('tr');
    let idBoleta = tabla.row(fila).data()[0];

    fetch(`http://localhost:3000/remove-boleta-by-id/${idBoleta}`, {
      method: 'GET',
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);

        if (data.success) {
          tabla.row(fila).remove().draw(false);

          let idAEliminar = parseInt(data.data[0].idBoleta);
          let index = boletas.findIndex(boleta => boleta.id == idAEliminar);

          if (index != -1)
            boletas.splice(index, 1);
        }

      }).catch(error => console.error('Error:', error));
  });

  $('#pagar').on('click', () => {
    let valorPagar = boletas.length * 10000;
    let message = `Cantidad de boletas: ${boletas.length}. \nValor a pagar: \$${(valorPagar).toLocaleString('es-ES')} pesos.`;
    let referenceCode_ = `RIFA_${Date.now()}`;

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
          description: `Cantidad de boletas: ${boletas.length}. Valor a pagar: \$${valorPagar.toLocaleString('es-ES')} pesos.`,
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