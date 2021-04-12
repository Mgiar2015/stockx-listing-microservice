const { client } = require('../services/db');
const { callLambda } = require('../services/lambda');


/* Given an object corresponding to an item, an auth token, and a webhookUrl,
 call aws lambda function and log its response in Redis*/
 const listItem = async(item,authToken,webhookUrl) => {
    const itemId = "item:"+item.id;
    await client.hmset(itemId,{status:"IN-PROGRESS",message:"Attempting to list product..."}) //Set item status to in-progress
    console.log("Calling lambda function...")
    const itemStatus = await callLambda(item,authToken,webhookUrl); //call AWS lambda function with passed in paramters
    console.log(itemStatus) //output result from calling lambda function
    console.log("Logging Lambda function response...")
    await client.hmset(itemId,itemStatus); //set status based on response in redis
}

/* Given a batch of items, log them in redis and attempt to list each item */
exports.listBatch = async(req, res) => {
    const requestData = req.body;
    const batchId = await client.incr("next_batch_id") //retrieve unique batchId
    res.json({result:"success", batchID: batchId}) //send immediate response to user
    requestData.items.forEach(async(item)=> {
        let success = await client.sadd("batch:"+batchId,"item:"+item.id); //attempt to add item id to 
        if(success){ //if item id was successfully added to set, this is a unique id, and call listItem to list the item
            await listItem(item,requestData.auth_token,requestData.webhook_url); 
        }
    })
}

/* Given a batch id, return the current status of each item in the batch */
exports.pollBatch = async(req, res) => {
    console.log("Retrieving status for items in batch...")
    const batchId = req.params.batch_id
    const itemIds = await client.smembers("batch:"+batchId); //retrieve items in batch from redis
    if (itemIds.length == 0){ //if batch has no items, batch is invalid
        res.json({"error":"Invalid batchId provided"})
        console.log("Invalid batchId provided")
        return;
    }
    //retrieve the status of each item in the batch, and create a list of all item status
    const batchStatus = await Promise.all(itemIds.map(async(itemId) => {
        const itemData = await client.hgetall(itemId); //retrieve item status from redis 
        let itemStatus = {id:itemId.split(":")[1],message:itemData.message,success:false} 
        if(itemData.status == "SUCCEESS") itemStatus.success = true; //set success field to true if status message is "SUCCEESS" 
        return itemStatus;
    }))
    console.log("Batch items successfully retrieved")
    res.json(batchStatus)
}

