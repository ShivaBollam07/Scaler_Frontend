import React, { useState } from 'react'
import Home from './pages/Home'
import Mentor from './pages/Mentor';
import Navbar from './pages/Navbar';




function App() {

  const [currentPage, setCurrentPage] = useState(0);

  const [mentor_id, setMentor_id] = useState(null);
  const HandleHomeSubmit = (mentor_id) => {
    setMentor_id(mentor_id);
    setCurrentPage(1);
  }

  const HandleLogOut = () => {
    setCurrentPage(0);
    setMentor_id(null);
  }

  return (
    <div>
    <div>
      <Navbar />
    </div>
    <div>

      {
        currentPage === 0 
        ? <Home handleSubmit={HandleHomeSubmit} /> 
        : <Mentor mentor_id={mentor_id} handlelogout={HandleLogOut} />
      }
    </div>
    </div>

  )
}

export default App
