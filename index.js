const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// Change this link with new mongodb Cluster link
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.grqmol8.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Change the collection with current project
    const usersCollection = client.db("blogMediaDb").collection("users");
    const blogsCollection = client.db("blogMediaDb").collection("blogs");
    const commentsCollection = client.db("blogMediaDb").collection("comments");
    const reactsCollection = client.db("blogMediaDb").collection("reacts");

    // get user from database
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // Save user in database
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // update user in database
    app.patch("/user/update/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      // Extract data from the request body
      const { name, address, versity, number } = req.body;
      // Create the update object based on the provided data
      const updateObject = {};
      if (name) updateObject.name = name;
      if (address) updateObject.address = address;
      if (versity) updateObject.versity = versity;
      if (number) updateObject.number = number;
      const updateDoc = {
        $set: updateObject,
      };
      const result = await usersCollection.updateOne(query, updateDoc);
    });

    // get all blogs
    app.get("/blogs", async (req, res) => {
      const result = await blogsCollection
        .find()
        .sort({ uploadTime: -1 })
        .toArray();
      res.send(result);
    });

    // get a single room to show details
    app.get("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogsCollection.findOne(query);
      res.send(result);
    });

    // get blogs with the sort of reactions
    app.get("/popularBlog", async (req, res) => {
      const result = await blogsCollection
        .aggregate([
          {
            $lookup: {
              from: "reactsCollection",
              localField: "_id",
              foreignField: "blogId",
              as: "reactions",
            },
          },
          {
            $addFields: {
              reactionsCount: { $size: "$reactions" },
            },
          },
          {
            $sort: { reactionsCount: 1 }, // Sort in descending order by reactions count
          },
        ])
        .toArray();
      res.send(result);
    });

    // save a blog in database
    app.post("/blogs", async (req, res) => {
      const blog = req.body;
      const result = await blogsCollection.insertOne(blog);
      res.send(result);
    });

    // get comments
    app.get("/comments/:id", async (req, res) => {
      const blogId = req.params.id;
      // const query = { blogId: new ObjectId(id) };
      const result = await commentsCollection.find({ blogId }).toArray();
      res.send(result);
    });

    // save a comment in database
    app.post("/comments", async (req, res) => {
      const comment = req.body;
      const result = await commentsCollection.insertOne(comment);
      res.send(result);
    });

    // get reacts
    app.get("/reacts/:id", async (req, res) => {
      const blogId = req.params.id;
      // const query = { blogId: new ObjectId(id) };
      const result = await reactsCollection.find({ blogId }).toArray();
      res.send(result);
    });

    // save a react in database
    app.post("/reacts", async (req, res) => {
      const reactData = req.body;
      const result = await reactsCollection.insertOne(reactData);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//  Change the project name
app.get("/", (req, res) => {
  res.send("Blog Media Server is running..");
});

//  Change the project name
app.listen(port, () => {
  console.log(`Blog Media is running on port ${port}`);
});
