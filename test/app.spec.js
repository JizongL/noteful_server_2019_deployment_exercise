const {expect} = require('chai')
const knex = require('knex')
const app = require('../src/app')
//const {makeFolderArray} = require('./folders.fixtures')
const FolderService = require('../src/folders/FolderService')

describe('Folders Endpoints',()=>{
  let db 
  before('make knex instance',()=>{
    db=knex({
      client:'pg',
      connection:process.env.TEST_DB_URL
    })
    app.set('db',db)
  })
  after('disconnect from db',()=>db.destroy())
  before('clean the table',()=>db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))
  afterEach('clean the table',()=>db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))
  
  describe(`GET /api/folders`,()=>{
    context('Given no folders',()=>{
      return supertest(app)
        .get('/api/folders')
        .expect(200,[])
    })
  })
  
})