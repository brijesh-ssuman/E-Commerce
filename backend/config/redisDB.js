const { createClient } = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_KEY,
    socket: {
        host: 'redis-15798.c232.us-east-1-2.ec2.cloud.redislabs.com',
        port: 15798
    }
});
module.exports = redisClient;