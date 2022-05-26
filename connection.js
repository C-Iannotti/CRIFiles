require("dotenv").config();
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI;

/*
* param: callback (function)
* use: creates a connection to a MongoDB database
*   using dotenv file and calls callback with
*   created database client.
*/
async function main(callback) {
    const client = new MongoClient(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    try {
        await client.connect();
        await callback(client);
    }
    catch (e) {
        console.error(e);
        throw new Error("Error connecting to Database");
    }
}

module.exports = main;