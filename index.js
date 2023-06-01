const express = require('express');
const app = express()
const jwt = require('jsonwebtoken');

const cors = require('cors');
const port = process.env.PORT || 5000
require('dotenv').config()

// miidwire
app.use(cors())
app.use(express.json())

// verify jwt token
const verifyJwt = (req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'Unauthorized Access' })
    }
    // bearer token
    const token = authorization.split(' ')[1]



    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'Unauthorized Access' })
        }
        req.decoded = decoded
        next();
    })

}



// ===========================================================================



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.khwex9e.mongodb.net/?retryWrites=true&w=majority`;

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


        // ------------------------------


        const menuCollection = client.db("bistroDb").collection("menu");
        const reviewcollection = client.db("bistroDb").collection("reviews");
        const cartCollection = client.db("bistroDb").collection("carts");
        const userCollection = client.db("bistroDb").collection("users");


        // jwt token create

        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

            res.send({ token })
        })

        // Warning: use verifyJWT before using verifyAdmin
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await userCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }

        /**
         * 0. do not show secure links to those who should not see the links
         * 1. use jwt token: verifyJWT
         * 2. use verifyAdmin middleware
        */


        // for user related Apis


        app.get('/users', verifyJwt, async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })
        // user already takle return kre dbe r add krbena database a
        app.post('/users', async (req, res) => {
            const user = req.body
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query)
            if (existingUser) {
                return res.send({ message: "user already exist " })
            }
            const result = await userCollection.insertOne(user)
            res.send(result)
        })


        // check user ki admin kina
        // security layer verifyJwt
        //email same
        //check admin
        app.get('/users/admin/:email', verifyJwt, async (req, res) => {
            const email = req.params.email


            if (req.decoded.email !== email) {
                res.send({ admin: false })
            }

            const query = { email: email }
            const user = await userCollection.findOne(query)
            const result = { admin: user?.role === 'admin' }
            res.send(result)
        })


        // admin bananor jnnw

        app.patch('/users/admin/:id', async (req, res) => {

            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)

        })

        // for menu

        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray()
            res.send(result)

        })
        app.post('/menu', verifyJwt, verifyAdmin, async (req, res) => {
            const newItem = req.body
            const result = await menuCollection.insertOne(newItem)
            res.send(result)

        })
        // delete menu
        app.delete('/menu/:id', verifyJwt, verifyAdmin, async (req, res) => {

            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await menuCollection.deleteOne(query)
            res.send(result)

        })


        // for review

        app.get('/reviews', async (req, res) => {
            const result = await reviewcollection.find().toArray()
            res.send(result)

        })

        // for cart collection apis
        app.get('/carts', verifyJwt, async (req, res) => {
            const email = req.query.email
            // console.log(email);
            if (!email) {
                res.send([])
            }


            const decodedEmail = req.decoded.email
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'Forbidden Access' })
            }

            const query = { email: email }
            const result = await cartCollection.find(query).toArray()
            res.send(result)
        })


        app.post('/carts', async (req, res) => {
            const item = req.body;
            console.log(item);
            const result = await cartCollection.insertOne(item)
            res.send(result)
        })



        // for delete
        app.delete('/carts/:id', async (req, res) => {

            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(query)
            res.send(result)

        })









        // ------------------------------


















        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






// ===========================================

app.get('/', (req, res) => {
    res.send(" Bistro Restaurant  boss is running")
})

app.listen(port, () => {
    console.log(`Bistro boss is sitting port on ${port}`);
})
