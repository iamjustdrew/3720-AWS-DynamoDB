//		       // 	      --TEAM MEMBERS--
//		       //	--    James Carmichael	--
// TEAM 15 LAMBDA CODE //	--     Phoenix Rash	--
//		       //	--     Matthew Yang	--
//         	       //	--     Drew Johnson	--

const AWS = require("aws-sdk");
AWS.config.update( {
  region: "us-east-1"
});

// Connecting to the DynamoDB table associated with API
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = "returnsapi";
//paths
const returnPath = "/return"
const returnParamPath = "/return/{id}";
const returnsPath = "/returns";
const itemsPath = "/return/{id}/items";

// Waits for a request to be made-- switch statement directs 
exports.handler = async function(event) {
  console.log("Request event method: ", event.httpMethod);
  console.log("EVENT\n" + JSON.stringify(event, null, 2));
  let response;
  switch(true) {
    //get a return
    case event.httpMethod === "GET" && event.requestContext.resourcePath === returnPath:
      response = await getSpecificReturn(event.queryStringParameters.return_id);
      break;
    //get a specific return
    case event.httpMethod === "GET" && event.requestContext.resourcePath === returnParamPath:
      response = await getSpecificReturn(event.pathParameters.id);
      break;
    //get multiple returns
    case event.httpMethod === "GET" && event.requestContext.resourcePath === returnsPath:
      response = await getReturns();
      break;
    //get the items from a specific return
    case event.httpMethod === "GET" && event.requestContext.resourcePath === itemsPath:
      response = await getSpecificReturnItems(event.pathParameters.id);
      break;
    //post a new return
    case event.httpMethod === "POST" && event.requestContext.resourcePath === returnPath:
      response = await saveReturn(JSON.parse(event.body));
      break;
    //update a return
   case event.httpMethod === "PATCH" && event.requestContext.resourcePath === returnPath:
      const requestBody = JSON.parse(event.body);
      response = await modifyReturn(requestBody.return_id, requestBody.updateKey, requestBody.updateValue);
      break;
    //delete a return
    case event.httpMethod === "DELETE" && event.requestContext.resourcePath === returnPath:
      response = await deleteReturn(event.queryStringParameters.return_id);
      break;
    //error request not found
    default:
      response = buildResponse(404, event.requestContext.resourcePath);
  }

 return response;
}
//get the return specified by returnId
async function getSpecificReturn(returnId) {
  const params = {
    TableName: dynamodbTableName,
    Key: {
      "return_id": returnId
    }
  }
  return await dynamodb.get(params).promise().then((response) => {
    return buildResponse(200, response.Item);
  }, (error) => {
    // Error handling based on relevant error
    if (error.code === 'ResourceNotFoundException') {
      console.error("Return not found: ", error);
    } else if (error.code === 'ValidationException') {
      console.error("Validation error: ", error);
    } else if (error.code === 'AccessDeniedException') {
      console.error("Access denied: ", error);
    } else if (error.code === 'InternalServiceError') {
      console.error("Service error: ", error);
    } else if (error.code === 'NetworkingError') {
      console.error("Network error: ", error);
    } else if (error.code === 'ProvisionedThroughputExceededException') {
      console.error("Throttling error: ", error);
    } else {
      // Catches the remaining errors
      console.error("An unknown error occurred: ", error); 
    }
  });
}
//get the list of all items from a specific return
async function getSpecificReturnItems(returnId){
  const params = {
    TableName: dynamodbTableName,
    Key: {
      "return_id": returnId
    }
  }
  return await dynamodb.get(params).promise().then((response) => {
    return buildResponseItems(200, response.Item);
  }, (error) => {
    // Error handling based on relevant error
    if (error.code === 'ResourceNotFoundException') {
      console.error("Return not found: ", error);
    } else if (error.code === 'ValidationException') {
      console.error("Validation error: ", error);
    } else if (error.code === 'AccessDeniedException') {
      console.error("Access denied: ", error);
    } else if (error.code === 'InternalServiceError') {
      console.error("Service error: ", error);
    } else if (error.code === 'NetworkingError') {
      console.error("Network error: ", error);
    } else if (error.code === 'ProvisionedThroughputExceededException') {
      console.error("Throttling error: ", error);
    } else {
      // Catches the remaining errors
      console.error("An unknown error occurred: ", error); 
    }
  });
}

//get the list of all the returns in the database
async function getReturns() {
  const params = {
    TableName: dynamodbTableName
  }
  const allReturns = await scanDynamoRecords(params, []);
  const body = {
    returns: allReturns
  }
  return buildResponse(200, body);
}
//go through the database and get all the items
async function scanDynamoRecords(scanParams, itemArray) {
  try {
    const dynamoData = await dynamodb.scan(scanParams).promise();
    itemArray = itemArray.concat(dynamoData.Items);
    if (dynamoData.LastEvaluatedKey) {
      scanParams.ExclusiveStartkey = dynamoData.LastEvaluatedKey;
      return await scanDynamoRecords(scanParams, itemArray);
    }
    return itemArray;
  } catch(error) {
    console.error('Do your custom error handling here. I am just gonna log it: ', error);
  }
}
//push the data from requestBody to the database
async function saveReturn(requestBody) {
  const params = {
    TableName: dynamodbTableName,
    Item: requestBody
  }
  return await dynamodb.put(params).promise().then(() => {
    const body = {
      Operation: "SAVE",
      Message: "SUCCESS",
      Item: requestBody
    }
    return buildResponse(200, body);
  }, (error) => {
    // Error handling based on relevant error
    if (error.code === 'ResourceNotFoundException') {
      console.error("Return not found: ", error);
    } else if (error.code === 'ValidationException') {
      console.error("Validation error: ", error);
    } else if (error.code === 'AccessDeniedException') {
      console.error("Access denied: ", error);
    } else if (error.code === 'InternalServiceError') {
      console.error("Service error: ", error);
    } else if (error.code === 'NetworkingError') {
      console.error("Network error: ", error);
    } else if (error.code === 'ProvisionedThroughputExceededException') {
      console.error("Throttling error: ", error);
    } else {
      // catches the remaining errors
      console.error("An unknown error occurred: ", error); 
    }
  })
}
//remove the return specified by returnId from the database
async function deleteReturn(returnId) {
  const params = {
    TableName: dynamodbTableName,
    Key: {
      "return_id": returnId
    },
    ReturnValues: "ALL_OLD"
  }
  return await dynamodb.delete(params).promise().then((response) => {
    const body = {
      Operation: "DELETE",
      Message: "SUCCESS",
      Item: response
    }
    return buildResponse(200, body);
  }, (error) => {
    // Error handling based on relevant error
    if (error.code === 'ResourceNotFoundException') {
      console.error("Return not found: ", error);
    } else if (error.code === 'ValidationException') {
      console.error("Validation error: ", error);
    } else if (error.code === 'AccessDeniedException') {
      console.error("Access denied: ", error);
    } else if (error.code === 'InternalServiceError') {
      console.error("Service error: ", error);
    } else if (error.code === 'NetworkingError') {
      console.error("Network error: ", error);
    } else if (error.code === 'ProvisionedThroughputExceededException') {
      console.error("Throttling error: ", error);
    } else {
      // catches the remaining errors
      console.error("An unknown error occurred: ", error); 
    }
  });
}

// update the specified return with specific data
// Will use the parameters passed in to update a specific part of a specific return.
// returnID should reference an existing index in the DynamoDB table, otherwise
// no updates will be made (since there is no record to update). 

async function modifyReturn(returnId, updateKey, updateValue) {
  const params = {
    TableName: dynamodbTableName,
    Key: {
      "return_id": returnId
    },
    UpdateExpression: `set ${updateKey} = :value`,
    ExpressionAttributeValues: {
      ":value": updateValue
    },
    ReturnValues: "UPDATED_NEW"
  }
  return await dynamodb.update(params).promise().then((response) => {
    const body = {
      Operation: "UPDATE",
      Message: "SUCCESS",
      UpdatedAttributes: response
    }
    return buildResponse(200, body);
  }, (error) => {
    // Error handling based on relevant error
    if (error.code === 'ResourceNotFoundException') {
      console.error("Return not found: ", error);
    } else if (error.code === 'ValidationException') {
      console.error("Validation error: ", error);
    } else if (error.code === 'AccessDeniedException') {
      console.error("Access denied: ", error);
    } else if (error.code === 'InternalServiceError') {
      console.error("Service error: ", error);
    } else if (error.code === 'NetworkingError') {
      console.error("Network error: ", error);
    } else if (error.code === 'ProvisionedThroughputExceededException') {
      console.error("Throttling error: ", error);
    } else {
      // Catches the remaining errors
      console.error("An unknown error occurred: ", error); 
    }
  })
}
//helper function to create a response for other methods
 function buildResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  }
 }

 function buildResponseItems(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body.return_items)
 }
}
