const express = require("express");
const mongodb = require("mongodb");
const cors = require("cors");
const path = require("path");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const ObjectId = require("mongodb").ObjectId;
const fileUpload = require("express-fileupload");
const upload = require("./utils/multer");
const cloudinary = require("./utils/cloudinary");
const fs = require("fs");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//file upload start
// app.use(fileUpload());
//file upload end
const port = process.env.PORT || 3001;

//mongodb connection
const uri = process.env.MONGO_CONNECTION;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// app.use(express.static(path.join(__dirname, 'uploads')));

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    // Establish and verify connection
    // await client.db("admin").command({ ping: 1 });
    console.log("database connected successfully");
    const database = client.db("advocate-appoint");

    /* all  collection start*/
    const clientCollection = database.collection("client");
    const advocateCollection = database.collection("advocate");
    const advocatesCollection = database.collection("advocates");
    const doctorsCollection = database.collection("sample-doctors");
    const allUsersCollection = database.collection("allUsers")
    const allAppointmentCollection = database.collection("appointment")
    //   all collection end
    //   receiving client info
    app.post("/clientregister", async (req, res) => {
      const client = { ...req.body, role: "client" };
      console.log(client);
      const result = await clientCollection.insertOne(client);
      const data = await allUsersCollection.insertOne(client);
      res.json(result);
    });
    //   receiving advocate info
    // app.post("/advocateregister", async (req, res) => {
    //   const advocate = { ...req.body, role: "pending" };
    //   console.log(advocate);
    //   const result = await advocateCollection.insertOne(advocate);
    //   res.json(result);
    // }); useEffect 
  

    // get client api //
    app.get("/client", async (req, res) => {
      const cursor = clientCollection.find({});
      const client = await cursor.toArray();

      res.json(client);
    });
    // get client api //
    //                  get advocate api                   //
    app.get("/advocates", async (req, res) => {
      const cursor = advocatesCollection.find({});
      // const cursor = advocatesCollection.find({role:"advocate"});
      const advocate = await cursor.toArray();

      res.json(advocate);
    });
    //                         get advocate api                       //
    //                       get single advocate api                       //
    // GET API FOR SINGLE SERVICE DETAILS
    app.get("/advocates/:id", async (req, res) => {
      const id = req.params.id;

      // console.log("id api hitted", id)
      const query = { _id: ObjectId(id) };
      const singleAdvocateDetails = await advocatesCollection.findOne(query);
      res.json(singleAdvocateDetails);
      // res.send("id paici ")
    });
    //                       get single advocate api                       //

    // getting all client information start
    app.get("/alluser", async (req, res) => {
      const cursor = allUsersCollection.find({});
      const advocate = await cursor.toArray();
     
      // console.log(client)
      // a comment to check ... / solve heroku problem

      res.json(advocate );
    });
    // getting all client information end
    // file upload api start
    app.post("/advocateregister", upload.single("image"), async (req, res) => {
      const uploader = async (path) => await cloudinary.uploads(path, "images");
      const newPath = await uploader(req.file.path);
      fs.unlinkSync(req.file.path);
      console.log(req.body);

      const displayName = req.body.displayName;
      const email = req.body.email;
      const nid = req.body.nid;
      const mobile = req.body.mobile;
      const barnumber = req.body.barnumber;
      const gender = req.body.gender;
      const category = req.body.category;
      const password = req.body.password;
      const confirmpassword = req.body.confirmpassword;
      const textArea = req.body.textArea;
      const role="pending";
      

      const advocate = {
        displayName,
        email,
        nid,
        mobile,
        barnumber,
        gender,
        category,
        password,
        confirmpassword,
        textArea,
        image: newPath.url,
        role,
      };
      const result = await advocatesCollection.insertOne(advocate);
      const data = await allUsersCollection.insertOne(advocate);
      res.json(result);
    });
    // file upload api end
    // doctors api
    // app.get("/doctors", async (req, res) => {
    //   const cursor = doctorsCollection.find({});
    //   const doctors = await cursor.toArray();
    //   res.json(doctors);
    // });
          // role update to make advocate
          app.put('/roleupdate/:id', async (req, res) => {
            const filter = { _id: ObjectId(req.params.id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: req.body.role
                },
            };
            const result = await advocatesCollection.updateOne(filter, updateDoc, options);
            const data = await allUsersCollection.updateOne(filter, updateDoc, options);
            console.log(result,data)
            res.send(result);
        })
        // appointment start 
        app.post("/appointment", async (req, res) => {
    
        const result = await allAppointmentCollection.insertOne({...req.body,status:"pending"});
       res.json(result);
      });
        app.get("/appointment", async (req, res) => {
          const cursor = allAppointmentCollection.find({});
          const appointment = await cursor.toArray();
    
          res.json(appointment );
      });
      app.patch("/updateappointmentstauts", async (req, res) => {
        
          const { id, status } = req.body;
          const filter = { _id: ObjectId(id) };
          const option = { upsert: false };
          const updateDoc = {
            $set: {
              status,
            },
          };
          const result = await allAppointmentCollection.updateOne(
            filter,
            updateDoc,
            option
          );
          res.json(result);
     
      });
      app.get('/myappointment/:email', async (req, res) => { // this is also client appointment
        console.log(req.params)
        const myappointments = await allAppointmentCollection.find({ clientEmail: req.params.email }).toArray();
        res.send(myappointments)
    })
      app.get('/advocateappointment/:email', async (req, res) => {
        // console.log(req.params)
        const advocateappointments = await allAppointmentCollection.find({ advocateEmail: req.params.email }).toArray();
        res.send(advocateappointments)
    })
      // delete client appointment
      app.delete('/cancelclientappointment/:id', async (req, res) => {
        const query = { _id: ObjectId(req.params.id) };
        const result = await allAppointmentCollection.deleteOne(query);
        res.send(result)
    });

        // appointment end 
        // admin 
           // make admin 
           app.put('/makeadmin/:email', async (req, res) => {
            const filter = { email: req.params.email };
            console.log("put", filter)
            const options = { upsert: false };
            const updateDoc = {
                $set: {
                    role: req.body.role
                },
            };
            const result = await allUsersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });
         // check admin
         app.get('/checkadmin/:email', async (req, res) => {
          const result = await allUsersCollection.findOne({ email: req.params.email });
          let isAdmin =  false
          if(result?.role=='admin'){
            isAdmin=true
          }
          res.send({admin:isAdmin});
      });
        // admin 
         // check advocate
         app.get('/checkadvocate/:email', async (req, res) => {
          const result = await allUsersCollection.findOne({ email: req.params.email });
          let isAdvocate =  false
          if(result?.role=='advocate'){
            isAdvocate=true
          }
          res.send({advocate:isAdvocate});
      });
        // admin 

  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to advocate appointment server.......");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
/*update appointment status ei banan ta vul hoise */