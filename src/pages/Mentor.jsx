import React, { useEffect, useState } from 'react';
import { getQuery, putQuery } from '../Services/API_Service';
import { IoMdAdd } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { IoIosRemoveCircleOutline } from "react-icons/io";
import { FaPen } from "react-icons/fa";
import { IoCheckmarkDoneCircle } from "react-icons/io5";
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import './Mentor.css';

export default function Mentor({ mentor_id, handlelogout, handleBack }) {
    const [vivaMarks, setVivaMarks] = useState(null);
    const [execMarks, setExecMarks] = useState(null);
    const [ideationMarks, setIdeationMarks] = useState(null);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [stagedStudents, setStagedStudents] = useState([]);
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState({});
    const [isLocked, setIsLocked] = useState(false);
    const [submitDisabled, setSubmitDisabled] = useState(false);
    const [editMarksDisabled, setEditMarksDisabled] = useState(false);
    const [deleteDisabled, setDeleteDisabled] = useState(false);

    const handleAddition = (student_id) => {
        if (stagedStudents.length >= 4) {
            alert("Cannot stage more than 4 students");
            return;
        }
        const studentToAdd = availableStudents.find(student => student.student_id === student_id);
        setStagedStudents([...stagedStudents, studentToAdd]);
        setAvailableStudents(availableStudents.filter(student => student.student_id !== student_id));
    };

    const handleAssignment = async () => {
        if (stagedStudents.length < 3) {
            alert("Cannot assign less than 3 students");
            return;
        }
        try {
            for (let i = 0; i < stagedStudents.length; i++) {
                await putQuery(`/student/assign`, {
                    'mentorId': mentor_id,
                    'studentId': stagedStudents[i].student_id
                });
                setAssignedStudents(prevAssignedStudents => [...prevAssignedStudents, stagedStudents[i]]);
            }
            setStagedStudents([]);
        } catch (error) {
            console.error("Error assigning students:", error);
            alert("Error assigning students");
        }
    };

    const handleUnassignment = async (student_id) => {
        try {
            await putQuery(`/student/delete`, {
                mentorId: mentor_id,
                studentId: student_id
            });
            const studentToUnassign = assignedStudents.find(student => student.student_id === student_id);
            setAvailableStudents([...availableStudents, studentToUnassign]);
            setAssignedStudents(assignedStudents.filter(student => student.student_id !== student_id));
        } catch (error) {
            console.error("Error unassigning student:", error);
            alert("Error unassigning student");
        }
    };

    const handleUnstaging = (student_id) => {
        const studentToUnstage = stagedStudents.find(student => student.student_id === student_id);
        setStagedStudents(stagedStudents.filter(student => student.student_id !== student_id));
        setAvailableStudents([...availableStudents, studentToUnstage]);
    };

    const handleEditMarks = (student) => {
        setSelectedStudent(student);
        setShowPopup(true);
    };

    const handleClosePopup = () => {
        setSelectedStudent({});
        setShowPopup(false);
    };

    const handleLockButton = async () => {
        if (assignedStudents.length === 0) {
            alert("Please assign students before submitting.");
            return;
        }

        for (let i = 0; i < assignedStudents.length; i++) {
            if (assignedStudents[i].ideation_marks === null || assignedStudents[i].execution_marks === null || assignedStudents[i].viva_marks === null) {
                alert("Please fill all the marks before submitting.");
                return;
            } else if (assignedStudents[i].ideation_marks < 0 || assignedStudents[i].execution_marks < 0 || assignedStudents[i].viva_marks < 0) {
                alert("To submit, fill in all the students' marks.");
                return;
            }
            else {
                const response1 = await putQuery(`/student/lock`, { "studentId": assignedStudents[i].student_id });
                console.log("Locking student:", response1);
            }
        }

        setIsLocked(true);
        setEditMarksDisabled(true);
        setSubmitDisabled(true);
        setDeleteDisabled(true);

    };

    const handleSubmitMarks = async () => {
        if(selectedStudent.ideationMarks == '' || selectedStudent.executionMarks == '' || selectedStudent.vivaMarks == '') {
            alert("Please fill all the marks.");
        }
        // Parse the input values
        let ideationMarks = selectedStudent.ideation_marks !== null ? parseFloat(selectedStudent.ideation_marks) : null;
        let executionMarks = selectedStudent.execution_marks !== null ? parseFloat(selectedStudent.execution_marks) : null;
        let vivaMarks = selectedStudent.viva_marks !== null ? parseFloat(selectedStudent.viva_marks) : null;

        // Check if any value is null
        if (ideationMarks === null || executionMarks === null || vivaMarks === null) {
            alert("Please fill all the marks.");
            return;
        }

        // Ensure that the values are not null, assign 0 if null
        ideationMarks = ideationMarks || 0;
        executionMarks = executionMarks || 0;
        vivaMarks = vivaMarks || 0;

        // Calculate total marks
        let totalMarks = ideationMarks + executionMarks + vivaMarks;

        const totalMarksFromStudent = parseFloat(selectedStudent.total_marks);

        // Validate marks range
        if (ideationMarks < 0 || ideationMarks > 10 ||
            executionMarks < 0 || executionMarks > 10 ||
            vivaMarks < 0 || vivaMarks > 10) {
            alert("Marks should be between 0 and 10.");
            return;
        } else if (totalMarks !== totalMarksFromStudent) {
            alert("Sum of marks should be equal to Total Marks.");
            return;
        } else if (totalMarks < 0 || totalMarks > 30) {
            alert("Total Marks should be between 0 and 30.");
            return;
        }

        try {
            // Update student marks
            const response1 = await putQuery(`/student/update`, {
                "vivaMarks": vivaMarks,
                "executionMarks": executionMarks,
                "ideationMarks": ideationMarks,
                "totalMarks": totalMarks,
                "studentId": selectedStudent.student_id
            });
            // Update state with the updated student marks
            setAssignedStudents(assignedStudents.map(obj => {
                if (obj.student_id === selectedStudent.student_id) {
                    return selectedStudent;
                }
                return obj;
            }));
            console.log("Submitting marks:", selectedStudent);
        } catch (error) {
            console.error("Error submitting marks:", error);
            alert("Error submitting marks");
        }

        handleClosePopup();
    };

    const generatePDF = (assignedStudents) => {
        const pdf = new jsPDF();

        // Header
        pdf.setFontSize(18);
        pdf.text(`Assigned Students - Mentor ID: ${mentor_id}`, 14, 22);

        // Table header
        const headers = [['Student ID', 'Student Name', 'Ideation Marks', 'Execution Marks', 'Viva Marks', 'Total Marks']];
        const data = assignedStudents.map(({ student_id, student_name, ideation_marks, execution_marks, viva_marks, total_marks }) => [student_id, student_name, ideation_marks || 'null', execution_marks || 'null', viva_marks || 'null', total_marks || 'null']);

        pdf.autoTable({
            startY: 30,
            head: headers,
            body: data,
            didDrawPage: function (data) {
                // Footer
                const pageCount = pdf.internal.getNumberOfPages();
                pdf.setFontSize(12);
                pdf.text('Page ' + pageCount, data.settings.margin.left, pdf.internal.pageSize.height - 10);
            }
        });

        pdf.save('Student marks.pdf');
    };

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await getQuery(`/student/notassigned`);
                setAvailableStudents(response.data);
                const response1 = await getQuery(`/mentor/students?mentorId=${mentor_id}`);
                setAssignedStudents(response1.data);
                const lockedStatus = response1.data.length > 0 ? response1.data[0].is_locked : false;
                setIsLocked(lockedStatus);
                setEditMarksDisabled(lockedStatus);
                setDeleteDisabled(lockedStatus);
                const allStudentsLocked = response1.data.every(student => student.ideation_marks > 0 && student.execution_marks > 0 && student.viva_marks > 0);
                setSubmitDisabled(!allStudentsLocked);
            } catch (error) {
                console.error("Error fetching data:", error);
                alert("Error fetching data");
            }
        }
        fetchData();
    }, [mentor_id]);

    return (
        <div className="container">
            <h1>Mentor ID: {mentor_id}</h1>

            <h2>Assigned Students</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Student Name</th>
                            <th>Ideation Marks</th>
                            <th>Execution Marks</th>
                            <th>Viva Marks</th>
                            <th>Total Marks</th>
                            {!deleteDisabled && <th>Unassign</th>}
                            {!editMarksDisabled && <th>Edit Marks</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {assignedStudents.map((student) => (
                            <tr key={student.student_id}>
                                <td>{student.student_id}</td>
                                <td>{student.student_name}</td>
                                <td>{student.ideation_marks || 'null'}</td>
                                <td>{student.execution_marks || 'null'}</td>
                                <td>{student.viva_marks || 'null'}</td>
                                <td>{student.total_marks || 'null'}</td>
                                {!deleteDisabled && <td>
                                    <button className="button" onClick={() => handleUnassignment(student.student_id)} disabled={isLocked}>

                                        <MdDelete />
                                    </button>
                                </td>}

                                {!editMarksDisabled &&
                                    <td>
                                        <button className="button" onClick={() => { handleEditMarks(student) }} disabled={isLocked}>
                                            <FaPen />
                                        </button>
                                    </td>
                                }
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!isLocked && !editMarksDisabled && <button className="Lock" onClick={handleLockButton}>Submit</button>}
                {isLocked && (
                    <button className="button" onClick={() => generatePDF(assignedStudents)}>Download marks</button>
                )}
            </div>



            <hr />

            {!isLocked && !editMarksDisabled && (
                <>
                    <h2>Staged Students</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Student Name</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stagedStudents.map((student) => (
                                <tr key={student.student_id}>
                                    <td>{student.student_id}</td>
                                    <td>{student.student_name}</td>
                                    <td>
                                        <button className="button" onClick={() => handleUnstaging(student.student_id)}>
                                            <IoIosRemoveCircleOutline />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <button className="button" onClick={handleAssignment}>Assign</button>
                </>
            )}

            {!isLocked && !editMarksDisabled && (
                <>
                    <h2>Available Students</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Student Name</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {availableStudents.map((student) => (
                                <tr key={student.student_id}>
                                    <td>{student.student_id}</td>
                                    <td>{student.student_name}</td>
                                    <td>
                                        <button className="button" onClick={() => handleAddition(student.student_id)}>
                                            <IoMdAdd />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            <button className="button" onClick={handlelogout}>Logout</button>

            {showPopup && (
                <div className="popup">
                    <div className="popup-inner">
                        <h2>Edit Marks</h2>
                        <div>
                            <label>Ideation:</label>
                            <input
                                type="text"
                                value={selectedStudent?.ideation_marks || ''}
                                onChange={(e) => setSelectedStudent({ ...selectedStudent, ideation_marks: e.target.value })}
                                disabled={isLocked}
                            />
                        </div>
                        <div>
                            <label>Execution:</label>
                            <input
                                type="text"
                                value={selectedStudent?.execution_marks || ''}
                                onChange={(e) => setSelectedStudent({ ...selectedStudent, execution_marks: e.target.value })}
                                disabled={isLocked}
                            />
                        </div>
                        <div>
                            <label>Viva:</label>
                            <input
                                type="text"
                                value={selectedStudent?.viva_marks || ''}
                                onChange={(e) => setSelectedStudent({ ...selectedStudent, viva_marks: e.target.value })}
                                disabled={isLocked}
                            />
                        </div>
                        <div>
                            <label>Total Marks:</label>
                            <input
                                type="text"
                                value={selectedStudent?.total_marks || ''}
                                onChange={(e) => setSelectedStudent({ ...selectedStudent, total_marks: e.target.value })}
                                disabled={true}
                            />
                        </div>
                        <button onClick={handleSubmitMarks} disabled={isLocked}>Submit</button>
                        <button onClick={handleClosePopup}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
