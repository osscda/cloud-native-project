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

app.get('/orders', (_req, res) => {
    fetch(`${stateUrl}/orders`)
        .then((response) => {
            if (!response.ok) {
                throw "Could not get state.";
            }

            return response.text();
        }).then((orders) => {
            res.send(orders);
        }).catch((error) => {
            console.log(error);
            res.status(500).send({message: error});
        });
});

app.post('/neworder', (req, res) => {
    const data = req.body.data;
    const orderId = data.orderId;
    console.log("Got a new order! Order ID: " + orderId);

    const key = "orders";

    fetch(stateUrl + "/orders").then((response) => {
        if (!response.ok) {
            throw "Could not get state.";
        }

        return response.json();
    }).then((responseJSON) => {
        const listOfOrderIDs = responseJSON;
        listOfOrderIDs.push(orderId);
        const state = {
            key: "orders",
            value: listOfOrderIDs,
        }
        fetch(stateUrl, {
            method: "POST",
            body: JSON.stringify(state),
            headers: {
                "Content-Type": "application/json"
            }
        }).then((response) => {
            if (!response.ok) {
                throw "Failed to persist state.";
            }
    
            console.log("Successfully persisted state.");
            res.status(200).send();
        }).catch((error) => {
            console.log(error);
            res.status(500).send({message: error});
        });
    })
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
    
    console.log(`Node App listening on port ${port}!`);
});

