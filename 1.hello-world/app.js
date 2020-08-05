// ------------------------------------------------------------
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// ------------------------------------------------------------

const express = require('express');
const bodyParser = require('body-parser');
require('isomorphic-fetch');

const app = express();
app.use(bodyParser.json());
const daprPort = process.env.DAPR_HTTP_PORT || 3500;

const stateStoreName = `statestore`;
const stateUrl = `http://localhost:${daprPort}/v1.0/state/${stateStoreName}`;
const port = 3000;

const ordersKey = "orders";

app.get("/", (req, res) => {
    res.status(200).send({message: "Hello Twitch!"});
})

app.get('/orders', async (_req, res) => {
    const stateStoreURL = `${stateUrl}/${ordersKey}`;
    console.log(`state store URL: ${stateStoreURL}`);
    try {
        const ordersResp = await fetch(`${stateUrl}/${ordersKey}`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': "application/json"
            }
        });
        console.log(`"state store response: ${JSON.stringify(response)}`)
        if (!ordersResp.ok) {
            return JSON.stringify(response);
            // throw `Could not get state. Response is ${JSON.stringify(response)}`;
        }
        return ordersResp.text();
    } catch (error) {
        console.log(error);
        res.status(500).send({message: error});
    }
});

app.post('/neworder', async (req, res) => {
    console.log("in the neworder endpoint)")
    const data = req.body.data;
    console.log("neworder incoming body:");
    console.log(data);
    const dataJSON = JSON.parse(req.body.data);
    // stringify goes from an object to a string
    // we had JSON.parse before, and that changes a string
    // (which is supposed to be JSON) into a JS object
    console.log(`data: ${JSON.stringify(data)}`);
    const orderId = data.orderId;
    console.log("Got a new order! Order ID: " + orderId);

    const key = "orders";

    // MAGICAL PSEUDO FANCY CODE 😊
    // mything  = 123
    // myPromiseThing = .... waiting for 123
    try {
        const ordersText = await fetch(stateUrl + "/" + ordersKey);
        const ordersJSON = await ordersText.json();
        
        let listOfOrderIDs = [];
        if (ordersJSON.hasOwnProperty('value')) {
            // hopefully this is a list!
            listOfOrderIDs = ordersJSON["value"];
        }

        listOfOrderIDs.push(orderId);
        const state = {
            key: "orders",
            value: listOfOrderIDs,
        }
        // we're ready to put the new list back into the state store        
        const saveResponse = await fetch(stateUrl, {
            method: "POST",
            body: JSON.stringify(state),
            headers: {
                "Content-Type": "application/json"
            }
        });
        res.status(200).send();
    } catch(e) {
        console.log(`ERROR! ${e}`);
    }

    //     }).then((response) => {
    //         if (!response.ok) {
    //             throw "Failed to persist state.";
    //         }
    
    //         console.log("Successfully persisted state.");
    //         res.status(200).send();
    //     }).catch((error) => {
    //         console.log(error);
    //         res.status(500).send({message: error});
    //     });
    // }).catch((error) => {
    //     console.log(error);
    //     res.status(500).send({message: error});
    // });
});

app.delete('/order/:id', (req, res) => {  
    const key = req.params.id;      
    console.log('Invoke Delete for ID ' + key);         

    const deleteUrl = stateUrl + '/' + key;

    fetch(deleteUrl, {
        method: "DELETE",        
        headers: {
            "Content-Type": "application/json"
        }
    }).then((response) => {
        if (!response.ok) {
            throw "Failed to delete state.";
        }

        console.log("Successfully deleted state.");
        res.status(200).send();
    }).catch((error) => {
        console.log(error);
        res.status(500).send({message: error});
    });    
});

app.listen(port, () => {
    console.log("DAPR_PORT is  " + process.env.DAPR_HTTP_PORT);
    //console.log(`DAPR_PORT is ${process.env.DAPR_HTTP_PORT}`);
    console.log(`daprPort is ${daprPort}`);
    
    console.log(`Node.js App listening on port ${port}!`);
});

