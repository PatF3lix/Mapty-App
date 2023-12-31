'use strict';

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
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    /**You can use the comment below to tell prettier to ignore the next line. */
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  //   click() {
  //     this.clicks++;
  //   }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._setDescription();
    this.calcPace();
  }
  calcPace() {
    this.pace = (this.duration / this.distance).toFixed(1);
    return this.pase;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this._setDescription();
    this.clacSpeed();
  }
  clacSpeed() {
    this.speed = (this.distance / (this.duration / 60)).toFixed(1);
  }
}
/**--------------------------------------------------------------------------------------- */
class MaptyApp {
  #map;
  #mapEvent;
  #mapZoom = 15;
  #workouts = [];
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));
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
    this.#map = L.map('map').setView([latitude, longitude], this.#mapZoom);

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
    this.#workouts.forEach(workout => {
      this._renderWorkoutMarker(workout);
    });
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

  _moveToPopUp(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      workout => workout.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoom, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    // workout.click();
  }

  _newWorkout(e) {
    e.preventDefault();
    let workout;
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (!this._validateUserInput(distance, duration, cadence))
        return alert('Inputs have to be positive numbers!');
      workout = this._createWorkout('running', [distance, duration, cadence]);
    } else {
      const elevation = +inputElevation.value;
      if (!this._validateUserInput(distance, duration, elevation))
        return alert('Inputs have to be positive numbers!');
      workout = this._createWorkout('cycling', [distance, duration, elevation]);
    }

    this.#workouts.push(workout);
    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    this._hideForm();
    this._clearFormInputField();
    //Set local storage to all workouts
    this._setLocalStorage();
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

  _validateUserInput(...inputs) {
    return inputs.every(inp => Number.isFinite(inp) && inp > 0);
  }

  _renderWorkoutMarker(workout) {
    const [lat, lng] = workout.coords;
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`,
        {
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        }
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `;
    if (workout.type === 'running') {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    } else {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _clearFormInputField() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    inputDistance.focus();
  }

  _setLocalStorage() {
    /**localStorage is an API provided by the broswer, advised to use for small amounts of data */
    /**To view the locate storage, open Inspect -> Application->localstorage*/
    /**Works as a key/value pair */
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return; //check if there is data
    this.#workouts = data; //insert data inside array
    this.#workouts.forEach(workout => this._renderWorkout(workout)); //render each data element into a workout htlm element
  }

  /**This function is added in order to clear the data from the local storage from the console.
   *  'app.reset()' */
  reset() {
    localStorage.removeItem('workouts');
    //reloads the page
    location.reload();
  }
}

/**Start application */
const app = new MaptyApp();
