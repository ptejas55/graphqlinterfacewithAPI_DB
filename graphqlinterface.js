// Step 1: Project Setup
// 1.1. Create a new project folder and initialize a Node.js project:

// bash
// Copy code
// npm init -y
// 1.2. Install necessary dependencies:

// bash
// Copy code
// npm install express express-graphql graphql axios mongodb
// Step 2: External API
// 2.1. Create a file named externalApi.js to handle interactions with the external API:

// javascript

// externalApi.js
const axios = require('axios');

const ExternalApi = {
   getExternalVehicle: async (id) => {
      try {
         const response = await axios.get(`https://jsonplaceholder.typicode.com/posts/${id}`);
         const externalData = response.data;
         // Map external data to our internal structure
         return {
            id: externalData.id,
            make: externalData.title,
            model: 'Unknown',
            year: 2023,
         };
      } catch (error) {
         console.error('Error fetching external data:', error.message);
         throw error;
      }
   },
};

// module.exports = ExternalApi;
// Step 3: MongoDB Connection
// 3.1. Create a file named db.js to handle MongoDB connection:
Step 2: Define Vehicle Documents
Add documents to the "vehicles" collection to represent different vehicles. Use the following example:

json
Copy code
// Document 1
{
   "_id": ObjectId("60b04f1becc0c651040f67f1"),
   "make": "Toyota",
   "model": "Camry",
   "year": 2022
}

// Document 2
{
   "_id": ObjectId("60b04f1becc0c651040f67f2"),
   "make": "Honda",
   "model": "Civic",
   "year": 2021
}
// javascript
// Copy code
// // db.js
const { MongoClient } = require('mongodb');

const url = 'mongodb+srv://<USERNAME>:<PASSWORD>@<YOUR_CLUSTER_URL>/<YOUR_DATABASE_NAME>?retryWrites=true&w=majority';
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

let db;

async function connect() {
   try {
      await client.connect();
      db = client.db();
      console.log('Connected to MongoDB');
   } catch (error) {
      console.error('Error connecting to MongoDB:', error.message);
   }
}

function getDb() {
   return db;
}

module.exports = { connect, getDb };
// Replace <USERNAME>, <PASSWORD>, <YOUR_CLUSTER_URL>, and <YOUR_DATABASE_NAME> with your MongoDB Compass credentials and connection details.

// Step 4: Database Models
// 4.1. Create a file named models.js to define the schema for your vehicle data:

// javascript

// // models.js
const { ObjectId } = require('mongodb');

function createVehicleModel(db) {
   const vehicles = db.collection('vehicles');

   return {
      getVehicle: async (id) => vehicles.findOne({ _id: ObjectId(id) }),
      getAllVehicles: async () => vehicles.find().toArray(),
   };
}

module.exports = createVehicleModel;
// Step 5: GraphQL Server
// 5.1. Create the main server file (index.js) and set up the GraphQL server:

// javascript
// Copy code
// index.js
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const ExternalApi = require('./externalApi');
const createVehicleModel = require('./models');
const { connect, getDb } = require('./db');

// GraphQL schema
const schema = buildSchema(`
   type Vehicle {
      id: ID!
      make: String!
      model: String!
      year: Int!
   }

   type ExternalVehicle {
      id: ID!
      make: String!
      model: String!
      year: Int!
   }

   type Query {
      getVehicle(id: ID!): Vehicle
      getAllVehicles: [Vehicle]
      getExternalVehicle(id: ID!): ExternalVehicle
   }
`);

// GraphQL resolvers
const root = {
   getVehicle: async ({ id }) => {
      const db = getDb();
      const vehicleModel = createVehicleModel(db);
      return await vehicleModel.getVehicle(id);
   },
   getAllVehicles: async () => {
      const db = getDb();
      const vehicleModel = createVehicleModel(db);
      return await vehicleModel.getAllVehicles();
   },
   getExternalVehicle: ({ id }) => ExternalApi.getExternalVehicle(id),
};

// Create an Express server
const app = express();

// GraphQL endpoint
app.use('/graphql', graphqlHTTP({
   schema: schema,
   rootValue: root,
   graphiql: true, // Enable GraphiQL for easy testing
}));

// Start server
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connect().then(() => {
   // Start the server after connecting to MongoDB
   app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}/graphql`);
   });
}).catch(error => {
   console.error('Error connecting to MongoDB:', error.message);
});
// Step 6: Run the Server
// Run your server using the following command:

// bash
// Copy code
// node index.js
// Visit http://localhost:3000/graphql in your browser to access the GraphiQL interface for testing your GraphQL queries.

// Step 7: Test GraphQL Queries
// Use the following GraphQL queries to test your server:

// graphql
// Copy code
// # Get a specific vehicle by ID from MongoDB
// query {
//    getVehicle(id: "<vehicle_id>") {
//       id
//       make
//       model
//       year
//    }
// }

// # Get all vehicles from MongoDB
// query {
//    getAllVehicles {
//       id
//       make
//       model
//       year
//    }
// }

// # Get a specific external vehicle by ID from the API
// query {
//    getExternalVehicle(id: "1") {
//       id
//       make
//       model
//       year
//    }
// }
// Replace <vehicle_id> with the actual _id of a vehicle in your MongoDB "vehicles" collection. These queries will fetch data from both the MongoDB database and the external API through the GraphQL server. Adjust the queries and the server code based on your specific data structures.
