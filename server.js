const express = require('express');
const bodyParser = require('body-parser');

// create express app
const app = express();

//Declare moment
var moment = require('moment');

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse requests of content-type - application/json
app.use(bodyParser.json())

// Configuring the database
const dbConfig = require('./config/database.config.js');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

// Connecting to the database
mongoose.connect(dbConfig.url, {
    useNewUrlParser: true
}).then(() => {
    console.log("Successfully connected to the database");    
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});

// define a simple route
app.get('/', (req, res) => {
    res.json({"message": "Welcome to EasyNotes application. Take notes quickly. Organize and keep track of all your notes."});
});

// Require Notes routes
require('./app/routes/work.routes.js')(app);
require('./app/routes/mqtt.routes.js')(app);

// listen for requests
app.listen(3000, () => {
    console.log("Server is listening on port 3000");
});

const mqtt = require('async-mqtt');

var server  = mqtt.connect('mqtt://test.mosquitto.org')

server.on('connect', function () {
    server.subscribe('minh', function (err) {
        if(!err) {
            client.publish('minh','lo cc');
        }
    })
})

server.on('message', function (topic, message) {
    // message is Buffer
    console.log(message.toString())
    //server.end()
});

const Works = require('./app/models/work.model.js');
const MQTTs = require('./app/models/mqtt.model.js');
function deadline_check(){
    let query_work = Works.find();
    let query_mqtt = MQTTs.find();
    let promise_work = query_work.exec();
    let promise_mqtt = query_mqtt.exec();
    Promise.all(
        [
            Promise.resolve(promise_work),
            Promise.resolve(promise_mqtt)
        ]
    )
    .then(function(result){
        //console.log(result);
        let works = result[0];
        let works_true = [];
        for (let i in works){
            if (moment().diff(works[i].time,'minutes') == 0){
                works_true.push(works[i]);
            }
        }
        //console.log(works_true);
        for (let i in works_true){
            //console.log("mqtt");
            // client.on('connect', function () {
            //     console.log("mqtt-connect");
            //     client.subscribe('presence', function (err) {
            //         if (!err) {
            //             console.log("mqtt-send");
            //             client.publish('presence', 'Hello mqtt')
            //         }
            //     })
            // })
            let mqttId = works_true[i].action;
            var mqtt_client;
            let mqtts = result[1];
            //console.log(mqttId);
            //console.log(mqtts);

            
            for (let j in mqttId){
                for (let k in mqtts){
                    if (mqtts[k]._id == mqttId[j]){
                        let client  = mqtt.connect('mqtt://test.mosquitto.org');
                        //console.log(client);
                        client.on('connect', function () {
                            //console.log('connect');                            
                            client.publish(mqtts[k].topic, mqtts[k].message);
                            client.end();
                        });
                    }
                }             
                    
            }
            
            // client.on('message', function (topic, message) {
            // // message is Buffer
            //     console.log(message.toString());
            //     client.end();
            // })
            // for (let j in mqttId){
            //     //console.log("mqtt");
            //     if (mqtts.includes(mqttId[j])){
            //         mqtt_client  = await mqtt.connectAsync('mqtt://test.mosquitto.org')
            //         // mqtt_client.subscribe(mqttId[j].topic, function (err) {
            //         //     if (!err) {
            //         //         console.log("mqtt-send");
            //         //         client.publish('presence', mqttId[j].message);
            //         //         console.log(mqttId[j].message);
            //         //     }
            //         //     else{
            //         //         console.log(err);
            //         //     }
            //         // })
            //         try {
            //             console.log("mqtt-send");
            //             await client.publish(mqttId[j].topic, mqttId[j].message);
            //         }
            //         catch (e){
            //             // Do something about it!
            //             console.log(e.stack);
            //             process.exit();
            //         }
            //     }                    
            // }         
        }
    })
    // .then(works => {
    //     let works_true = [];
    //     for (let i in works){
    //         if (moment().diff(works[i].time,'minutes') == 0){
    //             works_true.push(works[i]);
    //         }
    //     }
    //     console.log(works_true);
    // })
    // .then(works_true =>{
    //     for (let i in works_true){
    //         console.log("mqtt");
    //         // client.on('connect', function () {
    //         //     console.log("mqtt-connect");
    //         //     client.subscribe('presence', function (err) {
    //         //         if (!err) {
    //         //             console.log("mqtt-send");
    //         //             client.publish('presence', 'Hello mqtt')
    //         //         }
    //         //     })
    //         // })
    //         let mqttId = works_true[i].action;
    //         var mqtt_client;
    //         MQTTs.find()
    //         .then(mqtts => {
    //             for (let j in mqttId){
    //                 if (mqtts.includes(mqttId[j])){
    //                     mqtt_client  = mqtt.connect('mqtt://test.mosquitto.org')
    //                     mqtt_client.subscribe(mqttId[j].topic, function (err) {
    //                         if (!err) {
    //                             console.log("mqtt-send");
    //                             client.publish('presence', mqttId[j].message);
    //                             console.log(mqttId[j].message);
    //                         }
    //                     })
    //                 }                    
    //             }
    //         })
    //         .catch(err => {
    //             // res.status(500).send({
    //             //     message: err.message || "Some error occurred while retrieving notes."
    //             // });
    //         });           
    //     }
    .catch(err => {
        res.status(500).send({
            message: err.message || "Something went wrong"
        });
    });
}

setInterval(deadline_check, 60000);