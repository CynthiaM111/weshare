const { createClient } = require("redis");

const redisClient = createClient();

redisClient.on("error", (err) => console.error("Redis error:", err));

redisClient.connect(); // Use .connect() for Redis v4
console.log("Redis connected");

module.exports = redisClient;
