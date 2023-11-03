'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }
  calcPace() {
    /* min/km */
    this.pace = (this.duration / this.distance).toFixed(2);
    return this.pase;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.clacSpeed();
  }
  clacSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}
class MaptyApp {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    this.#map = L.map('map').setView([latitude, longitude], 15);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this._displayCurrentLocationMarker(latitude, longitude);
    this.#map.on('click', this._showForm.bind(this));
  }

  _displayCurrentLocationMarker(latitude, longitude) {
    L.marker([latitude, longitude])
      .addTo(this.#map)
      .bindPopup('Current Location', {
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: 'running-popup',
      })
      .openPopup();
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    //1- Get data from form
    let workout;
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    if (type === 'running') {
      const cadence = +inputCadence.value;
      //2-Check if data is valid
      if (!this._validateUserInput(distance, duration, cadence))
        return alert('Inputs have to be positive numbers!');
      //3- Create running workout
      workout = this._createWorkout('running', [distance, duration, cadence]);
    } else {
      const elevation = +inputElevation.value;
      //2-Check if data is valid
      if (!this._validateUserInput(distance, duration, elevation))
        return alert('Inputs have to be positive numbers!');
      //3- Create cycling workout
      workout = this._createWorkout('cycling', [distance, duration, elevation]);
    }

    //4- add new object to workout array
    this.#workouts.push(workout);
    //5- Render workout on map as marker
    this._renderWorkoutMarker(workout);

    //6- Render workout on list

    //7- Clear input fields
    this._clearFormInputField();
  }
  _createWorkout(type, stats) {
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    if (type === 'running') {
      workout = new Running([lat, lng], ...stats);
    } else {
      workout = new Cycling([lat, lng], ...stats);
    }
    return workout;
  }

  /**receives an array, traverse the array an returns only at the end of the iteration,
   *  true or false */
  _validateUserInput(...inputs) {
    return inputs.every(inp => Number.isFinite(inp) && inp > 0);
  }

  _renderWorkoutMarker(workout) {
    const { lat, lng } = this.#mapEvent.latlng;
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup('Workout', {
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${workout.type}-popup`,
      })
      .openPopup();
  }

  _clearFormInputField() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    inputDistance.focus();
  }
}

/**Start application */
const app = new MaptyApp();
