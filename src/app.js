require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const {NODE_ENV} = require('./config')
const app = express()
const noteRouter = require('./notes/noteRouter')
const folderRouter = require('./folders/folderRouter')
const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(cors())
app.use(helmet())

app.use(function errorHandler(error, req, res, next) {
    let response
    if (NODE_ENV === 'production') {
      response = { error: { message: 'server error' } }
    } else {
      console.error(error)
      response = { message: error.message, error }
    }
    res.status(500).json(response)
  })

app.use('/api/folders',folderRouter)
app.use('/api/notes',noteRouter)
app.get('/folders',(req,res,next)=>{
  res.send('All folders')
})


module.exports = app