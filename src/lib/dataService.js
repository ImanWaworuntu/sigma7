import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  writeBatch
} from 'firebase/firestore';

// Collection References
const STUDENTS_COLLECTION = 'students';
const CLASSES_COLLECTION = 'classes';
const RECORDS_COLLECTION = 'records'; // Pelanggaran & Prestasi
const ATTENDANCE_COLLECTION = 'attendance';
const RULES_COLLECTION = 'rules'; // Master Pelanggaran & Penghargaan

// --- RULES (Master Pelanggaran & Penghargaan) ---
export const getRules = async (type = null) => {
  let q;
  if (type) {
    q = query(collection(db, RULES_COLLECTION), where('type', '==', type), orderBy('points', type === 'violation' ? 'desc' : 'asc'));
  } else {
    q = query(collection(db, RULES_COLLECTION));
  }
  const snapshot = await getDocs(q);
  // Sort manually if no type specified to avoid complex index
  let rules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  if (!type) {
    rules.sort((a, b) => Math.abs(a.points) - Math.abs(b.points));
  }
  return rules;
};

export const addRule = async (ruleData) => {
  return await addDoc(collection(db, RULES_COLLECTION), ruleData);
};

export const deleteRule = async (ruleId) => {
  return await deleteDoc(doc(db, RULES_COLLECTION, ruleId));
};

// --- CLASSES ---
export const getClasses = async () => {
  const q = query(collection(db, CLASSES_COLLECTION), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addClass = async (classData) => {
  return await addDoc(collection(db, CLASSES_COLLECTION), classData);
};

export const deleteClass = async (classId) => {
  return await deleteDoc(doc(db, CLASSES_COLLECTION, classId));
};

// --- STUDENTS ---
export const getStudents = async (classId = null) => {
  let q;
  if (classId) {
    q = query(collection(db, STUDENTS_COLLECTION), where('classId', '==', classId));
  } else {
    q = query(collection(db, STUDENTS_COLLECTION), orderBy('name', 'asc'));
  }
  const snapshot = await getDocs(q);
  const students = snapshot.docs.map(doc => {
    const data = doc.data();
    if (data.poinPelanggaran === undefined && data.poinNet !== undefined) {
      data.poinPelanggaran = data.poinNet < 0 ? data.poinNet : 0;
      data.poinPenghargaan = data.poinNet > 0 ? data.poinNet : 0;
    }
    return { id: doc.id, ...data };
  });
  
  if (classId) {
    students.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }
  
  return students;
};

export const getStudentById = async (studentId) => {
  const docSnap = await getDoc(doc(db, STUDENTS_COLLECTION, studentId));
  if (docSnap.exists()) {
    const data = docSnap.data();
    
    // Auto-heal (Read-Repair): Hitung ulang poin berdasarkan rekam jejak
    const qRec = query(collection(db, RECORDS_COLLECTION), where('studentId', '==', studentId));
    const snapRec = await getDocs(qRec);
    let totalPelanggaran = 0;
    let totalPenghargaan = 0;
    
    snapRec.docs.forEach(d => {
        const pts = d.data().points || 0;
        if (pts < 0) totalPelanggaran += pts;
        else if (pts > 0) totalPenghargaan += pts;
    });

    // Jika terjadi miss-match akibat migrasi legacy, perbaiki secara asinkron
    if (data.poinPelanggaran !== totalPelanggaran || data.poinPenghargaan !== totalPenghargaan) {
        updateDoc(doc(db, STUDENTS_COLLECTION, studentId), {
            poinPelanggaran: totalPelanggaran,
            poinPenghargaan: totalPenghargaan
        }).catch(console.error);
        
        data.poinPelanggaran = totalPelanggaran;
        data.poinPenghargaan = totalPenghargaan;
    }

    return { id: docSnap.id, ...data };
  }
  return null;
};

export const addStudent = async (studentData) => {
  return await addDoc(collection(db, STUDENTS_COLLECTION), {
    ...studentData,
    poinPelanggaran: 0,
    poinPenghargaan: 0,
    spIssuedLevel: 0,
    createdAt: new Date().toISOString()
  });
};

export const updateStudent = async (studentId, studentData) => {
  return await updateDoc(doc(db, STUDENTS_COLLECTION, studentId), studentData);
};

export const issueSp = async (studentId, level) => {
  return await updateDoc(doc(db, STUDENTS_COLLECTION, studentId), { spIssuedLevel: level });
};

export const deleteStudent = async (studentId) => {
  return await deleteDoc(doc(db, STUDENTS_COLLECTION, studentId));
};

export const moveStudents = async (studentIds, newClassId) => {
  const batch = writeBatch(db);
  studentIds.forEach(id => {
    const studentRef = doc(db, STUDENTS_COLLECTION, id);
    batch.update(studentRef, { classId: newClassId });
  });
  await batch.commit();
};

export const graduateClass12 = async () => {
  const q = query(collection(db, STUDENTS_COLLECTION), where('classId', '>=', 'XII'), where('classId', '<=', 'XII\uf8ff'));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach(document => {
    const studentRef = doc(db, STUDENTS_COLLECTION, document.id);
    batch.update(studentRef, { status: 'graduated', classId: 'ALUMNI' }); // Or delete: batch.delete(studentRef);
  });
  await batch.commit();
};

// --- RECORDS (Pelanggaran & Penghargaan) ---
export const addRecord = async (recordData) => {
  const record = await addDoc(collection(db, RECORDS_COLLECTION), {
    ...recordData,
    createdAt: new Date().toISOString()
  });
  
  // Update student total points dengan recalculation penuh untuk menjamin integritas
  const studentRef = doc(db, STUDENTS_COLLECTION, recordData.studentId);
  const qRec = query(collection(db, RECORDS_COLLECTION), where('studentId', '==', recordData.studentId));
  const snapRec = await getDocs(qRec);
  
  let totalPelanggaran = 0;
  let totalPenghargaan = 0;
  
  snapRec.docs.forEach(d => {
      const pts = d.data().points || 0;
      if (pts < 0) totalPelanggaran += pts;
      else if (pts > 0) totalPenghargaan += pts;
  });

  await updateDoc(studentRef, { 
      poinPelanggaran: totalPelanggaran,
      poinPenghargaan: totalPenghargaan 
  });
  
  return record;
};

export const getTopRecords = async (type = 'pelanggaran', limitCount = 5) => {
  const typeFilter = type === 'pelanggaran' ? '<' : '>';
  const fieldName = type === 'pelanggaran' ? 'poinPelanggaran' : 'poinPenghargaan';
  
  const q = query(
    collection(db, STUDENTS_COLLECTION), 
    where(fieldName, typeFilter, 0),
    orderBy(fieldName, type === 'pelanggaran' ? 'asc' : 'desc'), 
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getRecords = async (filters = {}) => {
  const queryConstraints = [];
  if (filters.classId && filters.classId !== 'all') {
    queryConstraints.push(where('classId', '==', filters.classId));
  }
  if (filters.type && filters.type !== 'all') {
    queryConstraints.push(where('type', '==', filters.type));
  }
  if (filters.studentId) {
    queryConstraints.push(where('studentId', '==', filters.studentId));
  }
  const q = query(collection(db, RECORDS_COLLECTION), ...queryConstraints);
  const snapshot = await getDocs(q);
  let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Fix composite index issues by sorting client-side
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (filters.startDate && filters.endDate) {
    results = results.filter(r => {
      const d = r.date || r.createdAt.split('T')[0];
      return d >= filters.startDate && d <= filters.endDate;
    });
  }
  return results;
};

// --- ATTENDANCE (Upacara) ---
export const saveAttendance = async (attendanceData) => {
  return await addDoc(collection(db, ATTENDANCE_COLLECTION), {
    ...attendanceData,
    createdAt: new Date().toISOString()
  });
};

export const getTopAbsences = async (limitCount = 5) => {
    // This requires aggregation which Firestore doesn't natively do easily without Cloud Functions.
    // For now, we will fetch all attendance records and aggregate client-side or use a summary collection.
    // As a shortcut for this demo, returning empty or dummy.
    return [];
};
