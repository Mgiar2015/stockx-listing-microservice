const AWS = require('aws-sdk');

/* Read enviorment variables */
require('dotenv').config()

/* Configure AWS settings*/
AWS.config.update({accessKeyId: process.env.ACCESS_KEY_ID, secretAccessKey: process.env.SECRET_ACCESS_KEY,region: process.env.REGION});
var lambda = new AWS.Lambda();

module.exports.callLambda = async(item,authToken,webhookUrl) => {
    var params = {
        FunctionName: 'stockx-list', //name of aws lambda function we would like to call
        Payload: JSON.stringify({item_id:item.id,item:item,webhook_url:webhookUrl,auth_token:authToken}) //payload recieved by lambda function
    };
    let itemStatus;
    try{
        let response = await lambda.invoke(params).promise() //call lambda function
        itemStatus = JSON.parse(response.Payload); //parse response
        if (itemStatus.errorMessage){ //if the response contains the field "errorMessage", throw error
            throw "No Response"
        }
    } catch(error) {
        itemStatus = {status:"FAILURE",message:"Error retrieving lambda response."} //if error when invoking lambda, set status to failed
    }
    return itemStatus;
}
