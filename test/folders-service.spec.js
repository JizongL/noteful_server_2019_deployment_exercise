const {expect} = require('chai')
const knex = require('knex')
const app = require('../src/app')
const {makeFoldersArray} = require('./folders.fixtures')
//const FolderService = require('../src/folders/FolderService')

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
      it(`GET /api/folders responds with 200 and an empty array`,()=>{
        return supertest(app)
        .get('/api/folders')
        .expect(200,[])
      })
    })
    context('Given there are folders in the database',()=>{
      const testFolders = makeFoldersArray();
      beforeEach('insert folders',()=>{
        return db
        .into('noteful_folders')
        .insert(testFolders)
        
      })

      it(`GET /api/folders responds with 200 and all the folders`,()=>{
        return supertest(app)
          .get('/api/folders')
          .expect(200,testFolders)
      })
    })
  })

  describe(`POST /api/folders`,()=>{
    it(`create a folder, responding with 201 and the new folder`,function(){
      this.retries(3)
      
      const newFolder = {
        folder_name:'test new folder',        
      }
      return supertest(app)
        .post('/api/folders/')
        .send(newFolder)
        .expect(201)
        .expect(res =>{
          expect(res.body.folder_name).to.eql(newFolder.folder_name)
        })
    })
    const newFolder = {
      
    }
    it(`respond with 400 and an error message when folder name is missing`,()=>{
      return supertest(app)
        .post('/api/folders/')
        .send(newFolder)
        .expect(400,{error:{message:'Missing "folder_name" in request body'}})
    })
    const maliciousFolderName = {
      folder_name:'<script>alert("xss");</script>'
    }
    it(`responds with 201 and posted malicious content`,()=>{
      return supertest(app)
        .post('/api/folders/')
        .send(maliciousFolderName)
        .expect(201)
        .expect(res=>{
          expect(res.body.folder_name).to.eql('&lt;script&gt;alert("xss");&lt;/script&gt;')
        })
    })

  })

  // no delete test yet for folders. 
  describe(`DELETE  /api/folders/:folder_id`,()=>{
    context(`Given there are folders in the database`,()=>{
      const testFolders = makeFoldersArray()
      beforeEach('insert folders',()=>{
        return db
        .into('noteful_folders')
        .insert(testFolders)        
      })
      it(`responds with 204 and removes the folder`,()=>{
        const idToRemove = 2
        const expectedFolders = testFolders.filter(folder=>
          folder.id !==idToRemove
        )
        return supertest(app)
          .delete(`/api/folders/${idToRemove}`)
          .expect(204)
          .then(res=>{
            supertest(app)
              .get('/api/folders')
              .expect(expectedFolders)
          })
      })
    })
    context(`Given there are no folders`,()=>{
      it(`respond with 404`,()=>{
        const folderId = 12345
          return supertest(app)
          .delete(`/api/folders/${folderId}`)
          .expect(404,{error:{message:`Folder doesn't exist`}})
      })
    })
  })

  describe(`PATH /api/folders/:folder_id`,()=>{
    const testFolders = makeFoldersArray()
    context(`Given no folders`,()=>{
      it(`responds with 404`,()=>{
        const folderId = 123456
        return supertest(app)
          .patch(`/api/folders/${folderId}`)
          .expect(404,{error:{message:`Folder doesn't exist`}})
      })
    })
    context(`Given there are folders in the database`,()=>{
      beforeEach(`insert folders`,()=>{
        return db
        .into('noteful_folders')
        .insert(testFolders)
      })
      it(`respond with 204 and update the folder`,()=>{
        const idToUpdate = 2
        const updateFolder ={
          folder_name:'update_folder_name'
        }
        const expectedFolder = {
          ...testFolders[idToUpdate-1],
          ...updateFolder          
        }
        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send(updateFolder)
          .expect(204)
          .then(res=>{
            supertest(app)
              .get(`/api/folders/${idToUpdate}`)
              .expect(expectedFolder)
          })

      })
      it(`responds with 400 when no required field is supplied`,()=>{
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send({irrelevantField:'foo'})
          .expect(400,{
            error:{message:'Request body must contain folder name'}
          })
      })

    })
  })
})