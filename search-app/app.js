// app.js

const express = require('express');
const app = express();
const PORT = 3000;
const cors = require('cors');
const path = require('path');
const { MilvusClient, DataType, sleep } = require("@zilliz/milvus2-sdk-node");
const { off } = require('process');
const address = "https://in03-5a578d4fc3763e1.serverless.gcp-us-west1.cloud.zilliz.com"
const token = "[TOKEN_REMOVED]"

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

client = new MilvusClient({ address, token });

app.get('/intro', async (req, res) => {
    const query = req.query.q.trim();
    const field = req.query.field;
    const limit = req.query.limit;
    const offset = req.query.offset;

    let results;
    if (query && field) {
        results = await searchDatabase(query, field, offset, limit);
    } else {
        results = await fetchAllData(offset, limit);
    }

    res.json(results);
});

app.get('/count', async (req, res) => {
    const query = req.query.q.trim();
    const field = req.query.field;
    const count = await getCollectionCount(query, field);
    res.json({ total: count });
});

function getExpr(query, field) {
    let expr = '';
    switch (field) {
        case 'name':
            query = query.toLowerCase();
            expr = `first_name like "%${query}%" or last_name like "%${query}%"`
            break;
        case 'title':
            expr = `title like "%${query}%"`
            break;
        case 'description':
            expr = `description like "%${query}%" or short_description like "%${query}%"`
            break;
        default:
            throw new Error('Invalid field');
    }
    return expr;
}

async function searchDatabase(query, field, offset, limit) {

    const collectionInfo = await client.describeCollection({ collection_name: 'experts_analysis' });
    const fields = collectionInfo.schema.fields.map(field => field.name);
    let expr = getExpr(query, field);
    console.log(expr)

    try {
        const response = await client.query({
            collection_name: 'experts_analysis',
            output_fields: fields,
            expr: expr,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        // console.log(response)
        return response.data;
    } catch (err) {
        console.log(err)
    }
}

async function fetchAllData(offset, limit) {
    try {
        const collectionInfo = await client.describeCollection({ collection_name: 'experts_analysis' });
        const fields = collectionInfo.schema.fields.map(field => field.name);

        const response = await client.get({
            collection_name: 'experts_analysis',
            output_fields: fields,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        return response.data;
    } catch (err) {
        console.log(err)
    }
}

async function getCollectionCount(query, field) {
    if (!query || !field) {
        const response = await client.count({
            collection_name: 'experts_analysis'
        });
        console.log(response)
        return response.data;
    }
    let expr = getExpr(query, field);
    try {
        const response = await client.query({
            collection_name: 'experts_analysis',
            filter: expr,
            output_fields: ["count(*)"],
        });
        console.log(response)
        console.log(`Total documents in the collection: ${response.data[0]['count(*)']}`);
        return response.data[0]['count(*)'];
    } catch (err) {
        console.error(err);
    }
}


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
