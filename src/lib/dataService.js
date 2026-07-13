import { supabase } from './supabase';

// --- RULES (Master Pelanggaran & Penghargaan) ---
export const getRules = async (type = null) => {
  let query = supabase.from('rules').select('*');
  
  if (type) {
    query = query.eq('type', type);
    query = query.order('points', { ascending: type !== 'pelanggaran' });
  } else {
    query = query.order('created_at', { ascending: false });
  }
  
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching rules:", error);
    return [];
  }
  
  let rules = data;
  if (!type) {
    rules.sort((a, b) => Math.abs(a.points) - Math.abs(b.points));
  }
  return rules.map(r => ({ ...r, desc: r.name }));
};

export const addRule = async (ruleData) => {
  const payload = { ...ruleData, name: ruleData.desc };
  delete payload.desc;
  const { data, error } = await supabase.from('rules').insert([payload]).select();
  if (error) throw error;
  return { id: data[0].id, ...data[0], desc: data[0].name };
};

export const deleteRule = async (ruleId) => {
  const { error } = await supabase.from('rules').delete().eq('id', ruleId);
  if (error) throw error;
  return true;
};

// --- CLASSES ---
export const getClasses = async () => {
  const { data, error } = await supabase.from('classes').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data;
};

export const addClass = async (classData) => {
  const { data, error } = await supabase.from('classes').insert([classData]).select();
  if (error) throw error;
  return { id: data[0].id, ...data[0] };
};

export const deleteClass = async (classId) => {
  const { error } = await supabase.from('classes').delete().eq('id', classId);
  if (error) throw error;
  return true;
};

// --- STUDENTS ---
export const getStudents = async (className = null) => {
  let query = supabase.from('students').select('*, classes(name)');
  
  if (className) {
    const { data: cls } = await supabase.from('classes').select('id').eq('name', className).single();
    if (cls) {
      query = query.eq('class_id', cls.id);
    } else {
      return [];
    }
  }
  
  query = query.order('name', { ascending: true });
  
  const { data, error } = await query;
  if (error) throw error;
  
  const students = data.map(d => ({
    ...d,
    classId: d.classes?.name || d.class_id, // Map frontend classId to the string name
    poinPelanggaran: d.poin_pelanggaran,
    poinPenghargaan: d.poin_penghargaan,
    spIssuedLevel: d.sp_issued_level,
    parentPhone: d.parent_phone,
    homeroomTeacher: d.homeroom_teacher
  }));
  
  return students;
};

export const getStudentById = async (studentId) => {
  const { data, error } = await supabase
    .from('students')
    .select('*, classes(name)')
    .eq('id', studentId)
    .single();
    
  if (error || !data) return null;
  
  return {
    ...data,
    classId: data.classes?.name || data.class_id,
    poinPelanggaran: data.poin_pelanggaran,
    poinPenghargaan: data.poin_penghargaan,
    spIssuedLevel: data.sp_issued_level,
    parentPhone: data.parent_phone,
    homeroomTeacher: data.homeroom_teacher
  };
};

export const addStudent = async ({ name, classId, nis, nisn, gender, address, phone, parentPhone, homeroomTeacher }) => {
  let actualClassId = null;
  if (classId) {
    const { data: cls } = await supabase.from('classes').select('id').eq('name', classId).single();
    if (cls) actualClassId = cls.id;
  }

  const { data, error } = await supabase.from('students').insert([{
    name, 
    class_id: actualClassId, 
    nis, 
    nisn, 
    gender,
    address: address || "",
    phone: phone || "",
    parent_phone: parentPhone || "",
    homeroom_teacher: homeroomTeacher || "",
    poin_pelanggaran: 0,
    poin_penghargaan: 0,
    sp_issued_level: 0
  }]).select();
  
  if (error) throw error;
  return { id: data[0].id, ...data[0] };
};

export const updateStudent = async (studentId, studentData) => {
  const updateData = { ...studentData };
  if (updateData.classId !== undefined) { 
    const { data: cls } = await supabase.from('classes').select('id').eq('name', updateData.classId).single();
    updateData.class_id = cls ? cls.id : null; 
    delete updateData.classId; 
  }
  if (updateData.parentPhone !== undefined) { updateData.parent_phone = updateData.parentPhone; delete updateData.parentPhone; }
  if (updateData.homeroomTeacher !== undefined) { updateData.homeroom_teacher = updateData.homeroomTeacher; delete updateData.homeroomTeacher; }

  const { error } = await supabase.from('students').update(updateData).eq('id', studentId);
  if (error) throw error;
  return true;
};

export const issueSp = async (studentId, level) => {
  const { error } = await supabase.from('students').update({ sp_issued_level: level }).eq('id', studentId);
  if (error) throw error;
  return true;
};

export const deleteStudent = async (studentId) => {
  const { error } = await supabase.from('students').delete().eq('id', studentId);
  if (error) throw error;
  return true;
};

export const moveStudents = async (studentIds, newClassName) => {
  const { data: cls } = await supabase.from('classes').select('id').eq('name', newClassName).single();
  if (!cls) throw new Error("Kelas tidak ditemukan");
  
  const { error } = await supabase
    .from('students')
    .update({ class_id: cls.id })
    .in('id', studentIds);
  if (error) throw error;
  return true;
};

export const graduateClass12 = async () => {
  const { data: classes } = await supabase.from('classes').select('id, name').like('name', 'XII%');
  if (!classes || classes.length === 0) return;
  
  const classIds = classes.map(c => c.id);
  
  const { error } = await supabase
    .from('students')
    .update({ status: 'graduated', class_id: null })
    .in('class_id', classIds);
    
  if (error) throw error;
  return true;
};

export const cleanAlumniRecords = async () => {
  const { data: alumni } = await supabase.from('students').select('id').eq('status', 'graduated');
  if (!alumni || alumni.length === 0) return;
  
  const alumniIds = alumni.map(a => a.id);
  await supabase.from('records').delete().in('student_id', alumniIds);
  await supabase.from('students').update({ poin_pelanggaran: 0, poin_penghargaan: 0 }).in('id', alumniIds);
};

// --- RECORDS (Pelanggaran & Penghargaan) ---
export const addRecord = async (recordData) => {
  const { photoBase64, studentId, studentName, className, type, action, description, points, notes, date } = recordData;
  const actualAction = action || description || "Tanpa Keterangan";
  let photo_url = null;

  if (photoBase64) {
    try {
      const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      const fileName = `${studentId}-${Date.now()}.jpg`;
      const { data, error: uploadError } = await supabase.storage
        .from('record_photos')
        .upload(fileName, blob, { contentType: 'image/jpeg' });
        
      if (uploadError) {
        console.error("Error uploading photo:", uploadError);
      } else {
        const { data: publicUrlData } = supabase.storage.from('record_photos').getPublicUrl(fileName);
        photo_url = publicUrlData.publicUrl;
      }
    } catch(e) {
      console.error("Failed to parse base64 for storage", e);
    }
  }

  const { data: record, error } = await supabase.from('records').insert([{
    student_id: studentId,
    type,
    action: actualAction,
    points,
    notes: notes || "",
    date,
    photo_url
  }]).select();
  
  if (error) throw error;
  return { id: record[0].id, ...record[0] };
};

export const getTopRecords = async (type = 'pelanggaran', limitCount = 5) => {
  const typeFilter = type === 'pelanggaran' ? 'lt' : 'gt';
  const fieldName = type === 'pelanggaran' ? 'poin_pelanggaran' : 'poin_penghargaan';
  
  const { data, error } = await supabase
    .from('students')
    .select('*, classes(name)')
    .filter(fieldName, typeFilter, 0)
    .order(fieldName, { ascending: type === 'pelanggaran' })
    .limit(limitCount);
    
  if (error) throw error;
  
  return data.map(d => ({
    ...d,
    classId: d.classes?.name || d.class_id,
    poinPelanggaran: d.poin_pelanggaran,
    poinPenghargaan: d.poin_penghargaan
  }));
};

export const getRecords = async (filters = {}) => {
  let query = supabase.from('records').select('*, students(name, class_id, classes(name))');
  
  if (filters.studentId) {
    query = query.eq('student_id', filters.studentId);
  }
  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }
  
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;
  if (error) throw error;
  
  let results = data.map(d => ({
    id: d.id,
    studentId: d.student_id,
    studentName: d.students?.name,
    classId: d.students?.class_id,
    className: d.students?.classes?.name,
    type: d.type,
    action: d.action,
    description: d.action,
    points: d.points,
    notes: d.notes,
    date: d.date,
    photoUrl: d.photo_url,
    createdAt: d.created_at,
    reportedBy: '-'
  }));

  if (filters.classId && filters.classId !== 'all') {
    results = results.filter(r => r.classId === filters.classId);
  }

  if (filters.startDate && filters.endDate) {
    results = results.filter(r => {
      const d = r.date || r.createdAt.split('T')[0];
      return d >= filters.startDate && d <= filters.endDate;
    });
  }
  
  return results;
};

export const deleteRecord = async (recordId) => {
  const { data: record } = await supabase.from('records').select('photo_url').eq('id', recordId).single();
  
  if (record && record.photo_url) {
    try {
      const urlParts = record.photo_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      if (fileName) {
        await supabase.storage.from('record_photos').remove([fileName]);
      }
    } catch(e) {
      console.error("Gagal menghapus foto dari storage", e);
    }
  }
  
  const { error } = await supabase.from('records').delete().eq('id', recordId);
  if (error) throw error;
  return true;
};

export const updateRecord = async (recordId, recordData) => {
  const { photoBase64, action, description, points, notes, date } = recordData;
  const actualAction = action || description;
  
  const updates = {};
  if (actualAction !== undefined) updates.action = actualAction;
  if (points !== undefined) updates.points = points;
  if (notes !== undefined) updates.notes = notes;
  if (date !== undefined) updates.date = date;

  if (photoBase64 && typeof photoBase64 === 'string' && photoBase64.startsWith('data:image')) {
      try {
        // Hapus foto lama jika ada
        const { data: oldRecord } = await supabase.from('records').select('photo_url').eq('id', recordId).single();
        if (oldRecord && oldRecord.photo_url) {
          const urlParts = oldRecord.photo_url.split('/');
          const oldFileName = urlParts[urlParts.length - 1];
          if (oldFileName) {
            await supabase.storage.from('record_photos').remove([oldFileName]);
          }
        }

        const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        
        const fileName = `${recordId}-${Date.now()}.jpg`;
        const { data, error: uploadError } = await supabase.storage
          .from('record_photos')
          .upload(fileName, blob, { contentType: 'image/jpeg' });
          
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('record_photos').getPublicUrl(fileName);
          updates.photo_url = publicUrlData.publicUrl;
        }
      } catch (e) {
         console.error("Gagal mengupload foto baru", e);
      }
  } else if (photoBase64 === null) {
      // If explictly null, delete photo
      updates.photo_url = null;
  }

  const { error } = await supabase.from('records').update(updates).eq('id', recordId);
  if (error) throw error;
  return true;
};

// --- ATTENDANCE (Upacara) ---
export const saveAttendance = async (attendanceData) => {
  const { data: result, error } = await supabase.from('attendance').insert([{
    student_id: attendanceData.studentId,
    status: attendanceData.status,
    date: attendanceData.date
  }]).select();
  
  if (error) throw error;

  if (attendanceData.status === 'Alpa' || attendanceData.status === 'Bolos') {
    let points = attendanceData.status === 'Alpa' ? -10 : -20;
    try {
      const { data: ruleSnap } = await supabase
        .from('rules')
        .select('points')
        .eq('name', attendanceData.status === 'Alpa' ? 'Alpa Upacara' : 'Bolos Upacara')
        .limit(1);
      
      if (ruleSnap && ruleSnap.length > 0) {
        points = ruleSnap[0].points;
      }
    } catch (e) {
      console.error("Error fetching rule for attendance:", e);
    }

    await addRecord({
      studentId: attendanceData.studentId,
      studentName: attendanceData.studentName,
      className: attendanceData.className,
      type: 'pelanggaran',
      action: `${attendanceData.status} Upacara`,
      points: points,
      notes: `Dibuat otomatis dari sistem absensi upacara pada ${attendanceData.date}`,
      date: attendanceData.date
    });
  }

  return result[0];
};

export const getTopAbsences = async (limitCount = 5) => {
  return [];
};
