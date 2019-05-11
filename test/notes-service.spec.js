const {expect} = require('chai')
const knex = require('knex')
const app = require('../src/app')
const {makeNotesArray} = require('./notes.fixtures')
const {makeFoldersArray}= require('./folders.fixtures')
const NoteService = require('../src/notes/NoteService')
//const FolderService = require('../src/folders/FolderService')

describe.only(`Notes Endpoints`,()=>{
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

  describe(`GET /api/notes`,()=>{
    context(`Given no notes`,()=>{
      it(`GET /api/notes responds with 200 and an empty array`,()=>{
        return supertest(app)
        .get(`/api/notes`)
        .expect(200,[])
      })
    })
    context(`Given there are notes in the database`,()=>{
      const testNotes = makeNotesArray()
      const testFolders = makeFoldersArray()
      beforeEach('insert notes',()=>{
        return db
        .into('noteful_folders')
        .insert(testFolders)
        .then(()=>{
          return db
          .into('noteful_notes')
          .insert(testNotes)
        })
      })
      it(`GET /api/notes responds with 200 and all the notes`,()=>{
        return supertest(app)
          .get('/api/notes')
          .expect(200,testNotes)
      })
    })

  })
  describe(`POST /api/notes`,()=>{
    const testNotes = makeNotesArray()
    const testFolders = makeFoldersArray()
    beforeEach('insert notes',()=>{
      return db
      .into('noteful_folders')
      .insert(testFolders)
      // .then(()=>{
      //   return db
      //   .into('noteful_notes')
      //   .insert(testNotes)
      // })
    })

    it('create a note, responding with 201 and the new note',function(){
        this.retries(3)
        const newNote ={
          note_name:'note 6',
          content:'note 6 content',                 
          folder:1
        }
        return supertest(app)
          .post('/api/notes')
          .send(newNote)
          .expect(201)
          .expect(res=>{
            expect(res.body.note_name).to.eql(newNote.note_name)
            expect(res.body.content).to.eql(newNote.content)
            expect(res.body.folder).to.eql(newNote.folder)
            expect(res.body).to.have.property('id')
            expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`)
            const expected = new Date().toLocaleString()
            const actual = new Date(res.body.date_added).toLocaleString()
            expect(actual).to.eql(expected)
          })
          .then(postRes=>
             supertest(app)
            .get(`/api/notes/${postRes.body.id}`)
            .expect(200)
            .expect(postRes.body)
            )
    })
    const requireFields = ['note_name','content','folder']
    requireFields.forEach(field =>{
      const newNote = {
        note_name:'note 2',
        content:'note 2 content',               
        folder:1
      }
      it(`responds with 400 and an error message when then ${field} is missing`,()=>{
        delete newNote[field]
        return supertest(app)
          .post('/api/notes')
          .send(newNote)
          .expect(400,{error:{message:`Missing "${field}" in request body`}})
      })
    })
    const maliciousNote = {      
      note_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
      folder:1,
      content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
  }
  it(`responds with 201 and posted malicious content`,()=>{
    return supertest(app)
      .post('/api/notes')
      .send(maliciousNote)
      .expect(201)
      .expect(res=>{
        expect(res.body.note_name).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
        expect(res.body.content).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
         })
      })    
  })
  describe('DELETE /api/notes/:note_id',()=>{
    context('Given there are notes in the database',()=>{
      const testNote = makeNotesArray()
      const testFolders = makeFoldersArray()
      beforeEach('insert folders and notes',()=>{
        return db
        .into('noteful_folders')
        .insert(testFolders)
        .then(()=>{
          return db
          .into('noteful_notes')
          .insert(testNote)
        })
      })
      it('responds with 204 and removes the note',()=>{
        const idToRemove = 2
        const expectedNotes = testNote.filter(note=>note.id!==idToRemove)
        return supertest(app)
          .delete(`/api/notes/${idToRemove}`)
          .expect(204)
          .then(res=>
              supertest(app)
                .get('/api/notes')
                .expect(expectedNotes))
      })
    })
    context('Given there are no notes',()=>{
      it('responds with 404',()=>{
        const noteId=12345
        return supertest(app)
        .delete(`/api/notes/${noteId}`)
        .expect(404,{error:{message:`Note doesn't exist`}})
      })
    })
  })

  describe('PATH /api/notes/:note_id',()=>{
    const testFolders=makeFoldersArray()
    const testNotes = makeNotesArray()
    context('Given no notes',()=>{
      it('responds with 404',()=>{
        const noteId = 12345
        return supertest(app)
          .patch(`/api/notes/${noteId}`)
          .expect(404,{error:{message:`Note doesn't exist`}})
      })
    })
    context('Given there are notes in the database',()=>{
      beforeEach('insert folders and notes',()=>{
        return db
        .into('noteful_folders')
        .insert(testFolders)
        .then(()=>{
          return db
          .into('noteful_notes')
          .insert(testNotes)
        })
      })
      it('respond with 204 and update the note',()=>{
        const idToUpdate = 2
        const updatedNote = {          
            note_name:'note updated',
            content:'note 2 content updated',               
            folder:1          
        }
        const expectedNote = {
          ...testNotes[idToUpdate-1],
          ...updatedNote
        }
        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .send(updatedNote)
          .expect(204)
          .then(res=>{
            supertest(app)
              .get(`/api/notes/${idToUpdate}`)
              .expect(expectedNote)
          })
      })
      it('responds with 400 when no required fields supplied',()=>{
        const idToUpdate = 2
        
        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .send({irrelevantField:'foo'})
          // .send(updatedNote)
          .expect(400,{
            error:{
              message:`Request body must contain either 'note_name', 'content' or 'folder'`
            }
          })
      })
      it(`responds with 204 when updating only a subset of fields`,()=>{
        const idToUpdate = 2
        const updateNote = {
          note_name:'update notename'
        }
        const expectedNote={
          ...testNotes[idToUpdate-1],
          ...updateNote
        }
        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .send({
            ...updateNote,
            // irevelent field will not be updated
            fieldToIgnore:'should not be in GET response'
          })
          .expect(204)
          .then(res=>{
            supertest(app)
              .get(`/api/notes/${idToUpdate}`)
              .expect(expectedNote)
          })
      })
    })
  })
  describe(`GET /api/notes/:note_id`,()=>{
    context('Given there are notes in the database',()=>{
      const testFolders = makeFoldersArray()
      const testNotes = makeNotesArray()
      beforeEach(`insert folders and notes`,()=>{
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(()=>{
            return db
            .into('noteful_notes')
            .insert(testNotes)
          })
      })

      it(`GET /api/notes/:note_id responds with 200 and the specified note`,()=>{
        const noteId = 2
        const expectedNote = testNotes[noteId-1]
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .expect(200,expectedNote)          
      })
      
      context('Given no notes',()=>{
        it(`responds with 404`,()=>{
          const noteId = 12345
          return supertest(app)
          .get(`/api/notes/${noteId}`)
          .expect(404, { error: { message: `Note doesn't exist`}})
        })
      })
    })
  })
})