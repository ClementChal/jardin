var socket = io();
var humidity, valve_status, weatherNow, weatherTomorow;
var checkAuto = true;
var checkOnOff = $('onOff').val();

socket.on('update', (data) => {
    [humidity, valve_status, weatherNow, weatherTomorow] = [data.humidity, data.valve, data.weatherNow, data.weatherTomorow];
    if (valve_status) {
        $('#valveState').html('Allumé');

    } else {
        $('#valveState').html('Éteint');
    }
    $('#sensorValue').html(humidity + ' %');

    displayWeatherIcon('#wiToday', weatherNow);
    displayWeatherIcon('#wiTomorow', weatherTomorow);
})

function toggleAutomatic() {
    checkAuto = !checkAuto;
    socket.emit('automatic',
        checkAuto
    );
    console.log(checkAuto); 
}

function toggleOnOff() {
    checkOnOff = !checkOnOff;
    socket.emit('onOff',
        checkOnOff
    );
    console.log(checkOnOff);
    
}



// change l'icon météo en focntion du temps
function displayWeatherIcon(id, weather) {
    $(id).removeClass();
    switch (weather) {
        case 'Thunderstorm':
            $(id).addClass('wi wi-thunderstorm');
            break;
        case 'Drizzle':
            $(id).addClass('wi wi-day-sleet');
            break;
        case 'Rain':
            $(id).addClass('wi wi-rain');
            break;
        case 'Snow':
            $(id).addClass('wi wi-snow');
            break;
        case 'Clouds':
            $(id).addClass('wi wi-cloud');
            break;
        case 'Clear':
            $(id).addClass('wi wi-day-sunny');
            break;
    }
}



