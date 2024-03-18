import React, { useEffect, useState } from 'react';
import { getQuery } from '../Services/API_Service';
import './Home.css'; 

function Home({handleSubmit}) {
    
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMentorid, setSelectedMentorid] = useState(null);
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await getQuery('/mentor/all');
                setMentors(response.data);
            } catch (error) {
                console.error("Error fetching mentors:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        async function fetchStudents() {
            try {
                if (selectedMentorid) {
                    const response = await getQuery(`/mentor/students?mentorId=${selectedMentorid}`);
                    setAssignedStudents(response.data);
                    setAvailableStudents([]);
                } else {
                    const response = await getQuery(`/student/notassigned`);
                    setAvailableStudents(response.data);
                    setAssignedStudents([]);
                }
            } catch (error) {
                console.error("Error fetching students:", error);
            }
        }
        fetchStudents();
    }, [selectedMentorid]);

    const handleSelectChange = (e) => {
        setSelectedMentorid(e.target.value);
    };

    return (
        <div className="home-container">
            <div>    
                <h1>Choose a mentor</h1>
                <select onChange={handleSelectChange} title='mentor'>
                    <option key={null} value={null}>
                        Select Mentor
                    </option>
                    {mentors.map((mentor) => (
                        <option key={mentor.mentor_id} value={mentor.mentor_id}>
                            {mentor.mentor_name}
                        </option>
                    ))}
                </select>
                <button onClick={() => { if (selectedMentorid) handleSubmit(selectedMentorid); }}>Submit</button>
            </div>
            <div className="students-table">
                {selectedMentorid ? (
                    <table>
                        <caption>Assigned Students for selected mentor</caption>
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Student Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignedStudents.map((student) => (
                                <tr key={student.student_id}>
                                    <td>{student.student_id}</td>
                                    <td>{student.student_name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table>
                        <caption>Available Students</caption>
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Student Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {availableStudents.map((student) => (
                                <tr key={student.student_id}>
                                    <td>{student.student_id}</td>
                                    <td>{student.student_name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Home;
