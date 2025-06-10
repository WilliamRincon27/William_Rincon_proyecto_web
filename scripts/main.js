const pb = new PocketBase('http://127.0.0.1:8090');

console.log('PocketBase initialized:', pb);

window.addEventListener('DOMContentLoaded', () => {
    if (pb.authStore.isValid) {
        const loginInfo = document.getElementById('login-form') || document.getElementById('login-info');
        if (loginInfo) loginInfo.style.display = 'none';
        const petForm = document.getElementById('petForm');
        if (petForm) petForm.style.display = 'block';
        const logoutbtn = document.getElementById('logout-btn');
        if (logoutbtn) logoutbtn.style.display = 'block';
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.style.display = 'flex';
        loadPets();
    }
});

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await pb.admins.authWithPassword(email, password);
        console.log('Autenticado:', pb.authStore.model.email);
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('nav-links').style.display = 'block';
        document.getElementById('main-content').style.display = 'flex';
        loadPets();
        window.location.reload();
    } catch (error) {
        alert('Error al iniciar sesión');
        console.error(error);
    }
}

async function loadPets() {
    try {
        const pets = await pb.collection('Pets').getFullList();
        const container = document.getElementsByClassName('pet-list-container');
        container.innerHTML = '';

        pets.forEach(pet => {
            const petElement = document.createElement('div');
            petElement.className = 'pet-item';
            petElement.innerHTML = `
                <div>
                    <h3>${pet.name}</h3>
                    <p>Breed: ${pet.breed}</p>
                    <p>Sex: ${pet.sex}</p>
                </div>
                <button onclick="viewPetDetails('${pet.id}')">View Details</button>
            `;
            container[0].appendChild(petElement);
        });
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

function viewPetDetails(petId) {
    window.location.href = `pages/newPetForm.html?petId=${petId}`;
}

async function loadPetDetails() {
    const params = new URLSearchParams(window.location.search);
    const petId = params.get('petId');

    if (!petId) return; // No hay ID, no se hace nada

    try {
        const pet = await pb.collection('Pets').getOne(petId);

        // Llena los campos del formulario con los datos obtenidos
        document.getElementById('petName').value = pet.name || '';
        document.getElementById('breed').value = pet.breed || '';
        document.getElementById('petSpecies').value = pet.species || '';
        document.getElementById('petSex').value = pet.sex || '';
        // Si tienes imagen:
        if (pet.photo) {
            const photoUrl = pb.files.getUrl(pet, pet.photo);
            document.querySelector('.div-img img').src = photoUrl;
        }

    } catch (error) {
        console.error('Error cargando detalles del pet:', error);
    }
}

const petPhotoInput = document.getElementById('pet-photo');
console.log('petPhotoInput:', petPhotoInput);
const previewImg = document.getElementById('preview-img');
console.log('previewImg:', previewImg);
let uploadedImageFile = null;  // Guardar referencia para subirla luego

petPhotoInput.addEventListener('change', function () {
  const file = petPhotoInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      previewImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
    uploadedImageFile = file;
  }
});

async function handleCreatePet() {
  const formData = new FormData();
  formData.append('name', document.getElementById('petName').value);
  formData.append('breed', document.getElementById('breed').value);
  formData.append('sex', document.getElementById('petSex').value);
  formData.append('species', document.getElementById('petSpecies').value);

  if (uploadedImageFile) {
    formData.append('photo', uploadedImageFile);
  }

  try {
    await pb.collection('Pets').create(formData);
    alert('Mascota creada correctamente');
  } catch (error) {
    console.error('Error al crear mascota:', error);
    alert('Hubo un problema al guardar la mascota.');
  }
}

//Cargar vacunas



async function loadVaccinationHistory(petId) {
  // Si no se pasa petId, intenta obtenerlo de la URL
  if (!petId) {
    const params = new URLSearchParams(window.location.search);
    petId = params.get('petId');
    if (!petId) {
      console.error('No se encontró el petId en la URL ni como argumento.');
      return;
    }
  }

  try {
    const records = await pb.collection('vaccines').getFullList({
      filter: `pet="${petId}"`,
      sort: '-date'
    });

    const tbody = document.getElementById('vaccinationBody');
    tbody.innerHTML = '';

    const pet = await pb.collection('Pets').getOne(petId);

    records.forEach(record => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${pet ? pet.name : ''}</td>
        <td>${record.name}</td>
        <td>${record.date}</td>
        <td></td>
      `;
      tbody.appendChild(row);
    });

    // Obtener el nombre de la mascota
    const petName = pet.name || '';

    // Agrega fila para nueva vacuna
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td><input type="text" value="${petName}" readonly required></td>
      <td><input type="text" id="newVaccine" placeholder="Vaccine" required></td>
      <td><input type="date" id="newDate" required></td>
      <td><button onclick="addVaccine('${petId}')">Save</button></td>
    `;
    tbody.appendChild(newRow);

  } catch (err) {
    console.error('Error al cargar vacunas:', err);
  }
}

async function addVaccine(petId) {
  // Obtén los valores de los inputs
  const vaccine = document.getElementById('newVaccine').value;
  const date = document.getElementById('newDate').value;

  if (!vaccine || !date) {
    alert('Por favor llena todos los campos.');
    return;
  }

  try {
    await pb.collection('vaccines').create({
      pet: petId,
      name: vaccine,
      date: date
    });

    loadVaccinationHistory(petId); // Recargar la tabla
  } catch (error) {
    console.error('Error al guardar la vacuna:', error);
    alert('No se pudo guardar la vacuna');
  }
}

function logout() {
  pb.authStore.clear(); // Cierra la sesión
  location.reload();    // Recarga la página
}

