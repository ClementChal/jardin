const express = require('express');
const app = express();
const http = require('http').Server(app);
const port = 80;
const path = require('path');
const io = require('socket.io')(http);
const axios = require('axios');
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.hivemq.com');

app.use('/', express.static(path.join(__dirname, '../client'))); 

let apiData = {};
var humidity_in;
var valve_status;
var auto = true;
var user_order = 'off';

///////////////////////// WEBSOCKETS \\\\\\\\\\\\\\\\\\\\\\\\\\
io.on('connect',(socket)=>{

    socket.on('automatic', (checkAuto)=>{ auto = checkAuto });
    socket.on('onOff', (checkOnOff) => { user_order = checkOnOff ? 'on' : 'off' });

    var interval_id = setInterval(()=>{}, 9999); //clear all intervals
    for (var i = 1; i <= interval_id; i++)
        clearInterval(i);

    axios.get('http://api.openweathermap.org/data/2.5/onecall?lat=45.57&lon=5.93&appid=17140132d063635f92020383facb3900')
    .then(function(response) {
        // handle success
        apiData.weatherNow = response['data']['hourly'][0]['weather'][0]['main'];
        apiData.weatherTomorow = response['data']['daily'][1]['weather'][0]['main'];
        apiData.weatherTomorow = 'Clear'; // On va dire que demain il fait beau
        setInterval(()=>{
            var interval_id = setInterval(()=>{}, 9999); //clear all intervals
            for (var i = 1; i <= interval_id; i++)
                clearInterval(i);
                monitor(apiData, humidity_in, valve_status, auto, user_order);

            socket.emit('update', {
                humidity: humidity_in,
                valve: valve_status,
                weatherNow: apiData.weatherNow,
                weatherTomorow: apiData.weatherTomorow
            });
        }, 100)      
    })
    .catch(function(error) {
        // handle error
        console.log(error);
    })
})

// ///////////////////////////   MQTT COMS   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
client.on('connect', () => {
    client.subscribe(['campusnum/ouioui/humidity', 'campusnum/ouioui/valve/status'])
});
client.on('message', (topic, message) => {
    switch (topic) {
        case 'campusnum/ouioui/humidity':
            humidity_in = message.toString();
            break;
        case 'campusnum/ouioui/valve/status':
            valve_status = message.toString()=='true'? true : false ;
            break;
    }
});

const set_valve = (status) => {
    if (status == 'on' || status == 'off') client.publish('campusnum/ouioui/valve/order', status, { retain: true });
    else console.log('set_valve prend comme param \'on\' ou \'off\'');
}

const monitor = (apiData, humidity, valve_status, mode_automatique, user_order) => {
    if(mode_automatique){
        if (['Thunderstorm', 'Drizzle', 'Rain', 'Snow'].includes(apiData.weatherNow)) { // its raining / snowing
            if (valve_status) set_valve('off');
        } else { // It's not raining now
            if (humidity_in < 70) { // TOO DRY
                if (!(['Thunderstorm', 'Drizzle', 'Rain', 'Snow'].includes(apiData.weatherTomorow))) { // AND NOT RAINING/SNOWING TMR
                    if (!valve_status) set_valve('on');
                } else if (valve_status) set_valve('off'); // IS raining tmr
            } else { //  GOOD OR TOO WET
                if (valve_status) set_valve('off');
            }
        }
    }
    else {
        if((valve_status && user_order=='off')
            || (!valve_status && user_order=='on'))
        set_valve(user_order);
    }
}

http.listen(port);