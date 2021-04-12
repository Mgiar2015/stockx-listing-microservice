const axios = require('axios');

/*send a request to the provided endpoint to update on status of item*/
const sendWebhook = async(itemId, response, webhookURL) => {
    const requestData = 
    { status: response.status,
      message: response.message,
      id: itemId
    }
    await axios.post(webhookURL,requestData);
    console.log("Webhook delivered");

}

/* given an item, send a request to list it on stockX */
const listItem = async(item,authToken) => {
    const date = new Date();
    const expireDate = new Date(date.setDate(date.getDate() + 30)).toISOString().split(".")[0]+"+0000"; //generate date string for the date in 30 days, reformat to the same format as accepted by stockX
    const requestURL = "https://stockx.com/api/portfolio?a=ask";
    const headerData = {
        headers:{
            "authorization":authToken,
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
        }

    }
    const requestData = {
        "action":"ask",
        "PortfolioItem":
            {"localAmount":item.price_cents,
             "expiresAt":expireDate, 
             "skuUuid": item.sku_id,
             "localCurrency":"USD",
             "meta":{"discountCode":""}
            }
    }
    try{
        console.log("Sending request to stockX...");
        const response = await axios.post(requestURL,requestData,headerData); //send request to Stockx
        console.log("Item successfully listed")
        return {status:"SUCCEESS",message:"Item successfully listed to StockX"};
    } catch (error) {
        //Attempt to identify the cause of the unsuccessful listing
        let message;
        if (error.response.status == 401){
            message = "Invalid API key provided.";
        } else if (error.response.status == 400) {
            message = "Invalid Product data provided.";
        } else {
            message = "Unable to successfully list product.";
        }
        console.log("Error Listing Item: "+ message);
        return {status:"FAILURE",message:message}


    }
}

/* function to handle all lambda function invocations */
exports.handler = async(event, context) => {
    const requestData = event
    console.log("Request Recieved. Attempting to list item...\n");
    const response = await listItem(requestData.item,requestData.auth_token);
    sendWebhook(requestData.item.id,response,requestData.webhook_url);
    return response;
}
