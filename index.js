const express = require('express');
const app = express();
require('dotenv').config()
const cors = require('cors');
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000;

// middleware 
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}




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
        const usersCollection = client.db('learninDB').collection('users');
        const paymentCollection = client.db('learninDB').collection('payments')


        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' })

            res.send({ token })
        })

        // classes section
        app.get('/classes', async (req, res) => {
            const result = await classesCollection.find().sort({ enrolled: -1 }).toArray();
            res.send(result)
        })

        // The Instructor of my classes
        app.get('/classes/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await studentsCollection.find(query).toArray()
            res.send(result)
        })

        app.post('/classes', async (req, res) => {
            const addClass = req.body
            const result = await classesCollection.insertOne(addClass);
            res.send(result)
        })

        // transaction
        app.post('/classes/payments', async (req, res) => {
            const payment = req.body;

            // const filter = { _id: new ObjectId(payment.id) };


            const result = await paymentCollection.insertOne(payment)
            res.send(result)
        })

        app.patch('/classes/:id', async (req, res) => {
            const status = req.body;
            const filter = { _id: new ObjectId(req.params.id) }
            const updateDoc = {
                $set: status
            }
            const result = await studentsCollection.updateOne(filter, updateDoc);
            res.send(result)

        })
        // student section
        app.get('/students/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await studentsCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/student/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await studentsCollection.findOne(query);
            res.send(result)
        })
        app.put('/students/:id', async (req, res) => {
            const student = req.body
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

        // manage users
        app.get('/users/abc', async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })
        app.post('/users', async (req, res) => {
            const manageUsers = req.body;
            const result = await usersCollection.insertOne(manageUsers);
            res.send(result)
        })

        // role section
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await studentsCollection.find(query).toArray()
            res.send(result)
        })
        // my enrolled classes
        app.get('/payments/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await paymentCollection.find(query).toArray();
            res.send(result)
        })

        // create payment intent
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })
        // payment related api
        app.post('/payments/:id', async (req, res) => {
            // const payment = req.body;
            const { id } = req.params
            const insertResult = await paymentCollection.insertOne(payment);

            const query = { _id: { $in: payment(new ObjectId(id)) } }
            const deleteResult = await paymentCollection.deleteMany(query)

            res.send({ insertResult, deleteResult });
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


