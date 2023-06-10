const express = require('express');
const app = express();
require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 5000;

// middleware 
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3ovac2y.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const classesCollection = client.db('learninDB').collection('classes');
        const studentsCollection = client.db('learninDB').collection('students');

        app.get('/classes', async (req, res) => {
            const result = await classesCollection.find().toArray();
            res.send(result)
        })

        app.get('/students/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await studentsCollection.find(query).toArray()
            res.send(result)
        })

        app.put('/students/:id', async (req, res) => {
            const student = req.body
            console.log(student)

            const filter = { _id: new ObjectId(req.params.id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: student,
            }
            const result = await studentsCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })

        app.delete('/students/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await studentsCollection.deleteOne(query)
            res.send(result)
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Language Learning is running')
})

app.listen(port, () => {
    console.log(`Language Learning is running on port: ${port}`)
})


