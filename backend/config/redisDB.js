const { createClient } = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_KEY,
    socket: {
        host: 'redis-10874.crce276.ap-south-1-3.ec2.cloud.redislabs.com',
        port: 10874
    }
});
module.exports = redisClient;