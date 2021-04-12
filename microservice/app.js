const express = require('express');

//Routes
const routes = require('./routes/index');

/* Configure express settings */
const app = express();
app.use(express.json()); //recognize incoming request data as json
app.use(express.urlencoded());
const port = 3000;
app.listen(port, () => { //connect to port 
    console.log(`App Listening...`)
  })

/*Call for listing a list of items */
app.post('/list_batch', routes.listBatch)

/* Poll for status of items provided their batchId */
app.get('/poll/:batch_id', routes.pollBatch)



