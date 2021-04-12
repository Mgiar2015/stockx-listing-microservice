const redis = require('promise-redis')();

/* Connect to Redis */
let client = redis.createClient();
client.on('connect',function(){
    console.log("Connected to Redis");
    }
)

module.exports.client = client;


