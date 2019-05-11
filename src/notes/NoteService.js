const NoteService ={
  getAllNotes(knex){
    return knex
    .select('*')
    .from('noteful_notes')
  },
  insertNote(knex,newNote){
    return knex
    .insert(newNote)
    .into('noteful_notes')
    .returning('*')
    .then(row=>{
      return row[0]
    })

  },
  deleteNote(knex,id){
    return knex.from('noteful_notes')
    .where({id}).delete()
  }
  ,
  updateNote(knex,id,updateNoteField){
    return knex('noteful_notes')
    .where({id})
    .update(updateNoteField)
  },
  
  getById(knex,id){
    return knex
      .select('*')
      .from('noteful_notes')
      .where('id',id)
      .first()
  },

}

module.exports = NoteService