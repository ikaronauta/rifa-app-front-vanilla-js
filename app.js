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
      boletas = $(data.data);
      console.log(data);

      boletas.each((a, b) => {
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

        tabla.row.add([
          boleta.id, 
          boleta.numero, 
          estados[boleta.estado], 
          '<button class="eliminar">Eliminar</button>']).draw(false);
      })
      .catch(error => {console.error('Error:', error)});
  });

  $('#miTabla tbody').on('click', '.eliminar', function () {
    if(tabla.rows().count() == 3)
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

          if(data.success)
            tabla.row(fila).remove().draw(false);
        }).catch(error => console.error('Error:', error));

    
  });
}


inicio();