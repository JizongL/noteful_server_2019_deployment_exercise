const path = require('path')
const express = require('express')
const xss = require('xss')
const noteRouter = express.Router()
const jsonParser = express.json()
const NoteService = require('./NoteService')


const serializeNote = note =>({

  id:note.id,
  note_name:xss(note.note_name),
  content:xss(note.content),
  date_added:note.date_added,
  folder:note.folder
})


noteRouter
.route('/')
.get((req,res,next)=>{
  const knexInstance = req.app.get('db')
  NoteService.getAllNotes(knexInstance)
  .then(notes=>{
    res.json(notes.map(serializeNote))
  })
  .catch(next)
})

.post(jsonParser,(req,res,next)=>{
  const {note_name,content,folder} = req.body
  const newNote = {note_name,content,folder}
  for (const [key, value] of Object.entries(newNote))
  if (value == null)
    return res.status(400).json({
      error: { message: `Missing "${key}" in request body` }
    })
    NoteService.insertNote(
      req.app.get('db'),
      newNote
    )
    .then(note=>{
      res 
      .status(201)
      .location(path.posix.join(req.originalUrl, `/${note.id}`))
      .json(serializeNote(note))
    })
    .catch(next)
})
noteRouter
  .route('/:note_id')
  .all((req,res,next)=>{
    NoteService.getById(
      req.app.get('db'),
      req.params.note_id
    )
    .then(note=>{
      if(!note){
        return res.status(404)
        .json({
          error:{message:`Note doesn't exist`}
        })
      }
      res.note = note
      next()
    })
    .catch()
  })
  .get((req,res,next)=>{
    res.json(serializeNote(res.note))
  })


  .delete((req,res,next)=>{
    NoteService.deleteNote(
      req.app.get('db'),
      req.params.note_id
    )
    .then(numRowsAffected=>{
      res.status(204).end()
    })
    .catch(next)
  })
  .patch(jsonParser,(req,res,next)=>{
    const {note_name,content,folder} = req.body
    const noteToUpdate = {note_name,content,folder}
    const numberOfValue = Object.values(noteToUpdate).filter(Boolean).length
    
    if(numberOfValue===0){
      return res.status(400).json(
        {
          error:{
            message:`Request body must contain either 'note_name', 'content' or 'folder'`
          }
        }
      )
    }
      NoteService.updateNote(
        req.app.get('db'),
      req.params.note_id,
      noteToUpdate)
        .then(numRowsAffected=>{
          res.status(204).end()
        })
        .catch(next)
  })

module.exports = noteRouter