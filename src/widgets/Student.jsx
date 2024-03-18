import React from 'react'

const Student = ({student_name, student_id, handleButton, type}) => {

  return (
    <div>
        <h3>{student_name}</h3>
        <h3>{student_id}</h3>
        <button onClick={() => handleButton(student_id)}>{type}</button>
    </div>
  )
}

export default Student;
