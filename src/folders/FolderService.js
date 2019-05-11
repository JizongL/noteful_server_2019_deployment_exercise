

const FolderService ={
  getAllFolders(knex){
    return knex
      .select('*')
      .from('noteful_folders')
  },
  insertFolder(knex,newFolder){
    return knex
      .insert(newFolder)
      .into('noteful_folders')
      .returning('*')
      .then(row=>{
        return row[0]
      })
  },
  getById(knex,id){
    return knex
      .select('*')
      .from('noteful_folders')
      .where('id',id)
      .first()
  },
  deleteFolder(knex,id){
    return knex.from('noteful_folders')
    .where({id}).delete()
  },
  updateFolder(knex,id,newUpdatedFolder){
    return knex('noteful_folders')
    .where({id})
    .update(newUpdatedFolder)
  }
}

module.exports = FolderService