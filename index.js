const express = require('express');
const app = express()
const port = 8000

app.get('/', (req, res) => {
    res.send('Service Hub Server is running')
})

app.listen(port, () => {
    console.log(`Service Hub Server is running on port ${port}`)
})