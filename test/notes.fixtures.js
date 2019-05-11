function makeNotesArray() {
  return [
    { id:1,
      note_name:'note 1',
      content:'note 1 content',    
      date_added: "2019-04-27T21:53:58.309Z",  
      folder:1
    },
    { 
    id:2,  
    note_name:'note 2',
    content:'note 2 content',      
    date_added: "2019-04-27T21:53:58.309Z",  
    folder:1
    },
    { id:3,  
      note_name:'note 3',
      content:'note 3 content',      
      date_added: "2019-04-27T21:53:58.309Z",  
      folder:1
    }
  ]
}

module.exports ={
  makeNotesArray,
}