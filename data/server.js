const express = require('express');
const app = express();
const parser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const createRouter = require('./create_router.js');
const path = require('path');

const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

app.use(parser.json());

MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true })
.then((client)=> {
  const db = client.db('chat_bot');
  const reviewsCollection = db.collection('reviews');
  const reviewRouter = createRouter(reviewsCollection);
  app.use('/api/reviews', reviewRouter);
})
.catch(console.error)

app.listen(1337, function (){
  console.log(`listening on port ${this.address().port}`);
});