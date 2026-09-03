import { supabase } from './supabase';

let cachedRules = null;
let cachedClasses = null;

// --- RULES (Master Pelanggaran & Penghargaan) ---
export const getRules = async (type = null) => {
  if (!cachedRules) {
    const { data, error } = await supabase.from('rules').select('id, name, type, points, category, created_at');
    if (error) {
      console.error("Error fetching rules:", error);
      return [];
    }
    cachedRules = data;
  }
  
  let rules = [...cachedRules];
  if (type) {
    rules = rules.filter(r => r.type === type);
    rules.sort((a, b) => type !== 'pelanggaran' ? a.points - b.points : b.points - a.points);
  } else {
    rules.sort((a, b) => Math.abs(a.points) - Math.abs(b.points));
  }
  
  return rules.map(r => ({ ...r, desc: r.name }));
};

export const addRule = async (ruleData) => {
  const payload = { ...ruleData, name: ruleData.desc };
  delete payload.desc;
  const { data, error } = await supabase.from('rules').insert([payload]).select();
  if (error) throw error;
  cachedRules = null;
  return { id: data[0].id, ...data[0], desc: data[0].name };
};

export const deleteRule = async (ruleId) => {
  const { error } = await supabase.from('rules').delete().eq('id', ruleId);
  if (error) throw error;
  cachedRules = null;
  return true;
};

// --- CLASSES ---
export const getClasses = async () => {
  if (cachedClasses) return cachedClasses;
  const { data, error } = await supabase.from('classes').select('id, name');
  if (error) throw error;
  
  data.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  
  cachedClasses = data;
  return data;
};

export const addClass = async (classData) => {
  const { data: existing } = await supabase.from('classes').select('id').eq('name', classData.name).maybeSingle();
  if (existing) {
    throw new Error("Kelas dengan nama tersebut sudah ada!");
  }
  
  const { data, error } = await supabase.from('classes').insert([classData]).select();
  if (error) throw error;
  cachedClasses = null;
  return { id: data[0].id, ...data[0] };
};

export const deleteClass = async (classId) => {
  const { error } = await supabase.from('classes').delete().eq('id', classId);
  if (error) throw error;
  cachedClasses = null;
  return true;
};

// --- STUDENTS ---
export const getStudents = async (className = null) => {
  let actualClassId = null;
  if (className) {
    const { data: cls } = await supabase.from('classes').select('id').eq('name', className).single();
    if (cls) {
      actualClassId = cls.id;
    } else {
      return [];
    }
  }
  
  let allData = [];
  let from = 0;
  const step = 1000;
  
  while (true) {
    let query = supabase.from('students').select('id, name, class_id, gender, agama, poin_pelanggaran, poin_penghargaan, sp_issued_level, classes(name)');
    if (actualClassId) {
      query = query.eq('class_id', actualClassId);
    }
    
    query = query.order('name', { ascending: true }).range(from, from + step - 1);
    
    const { data, error } = await query;
    if (error) throw error;
    
    if (data && data.length > 0) {
      allData = [...allData, ...data];
    }
    
    if (!data || data.length < step) {
      break;
    }
    
    from += step;
  }
  
  const students = allData.map(d => ({
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
  let actualClassId = null;
  if (cls) {
    actualClassId = cls.id;
  } else {
    const { data: newCls } = await supabase.from('classes').insert([{ name: newClassName }]).select();
    if (newCls && newCls.length > 0) actualClassId = newCls[0].id;
  }

  const { error } = await supabase
    .from('students')
    .update({ class_id: actualClassId })
    .in('id', studentIds);
  if (error) throw error;
  return true;
};

export const checkClassXEmpty = async () => {
  const { data, error } = await supabase.from('students').select('id, classes!inner(name)');
  if (error) return false;
  const hasClassX = data.some(s => s.classes?.name?.toUpperCase().startsWith('X.'));
  return !hasClassX;
};

export const resetAllStudentData = async () => {
  await supabase.from('attendance').delete().not('id', 'is', null);
  await supabase.from('records').delete().not('id', 'is', null);
  const { error } = await supabase.from('students').delete().not('id', 'is', null);
  if (error) throw error;
  return true;
};

export const importStudentsFromCSV = async (csvText) => {
  const parseCSV = (text) => {
    const firstLineEnd = text.indexOf('\n');
    const firstLine = firstLineEnd > -1 ? text.substring(0, firstLineEnd) : text;
    const sep = firstLine.includes(';') ? ';' : ',';
    
    const res = [];
    let line = [];
    let val = '';
    let inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const nc = text[i + 1];
      if (inQ) {
        if (c === '"' && nc === '"') { val += '"'; i++; }
        else if (c === '"') { inQ = false; }
        else { val += c; }
      } else {
        if (c === '"') { inQ = true; }
        else if (c === sep) { line.push(val.trim()); val = ''; }
        else if (c === '\n' || (c === '\r' && nc === '\n')) {
          line.push(val.trim()); res.push(line); line = []; val = '';
          if (c === '\r') i++;
        }
        else if (c !== '\r') { val += c; }
      }
    }
    if (val !== '' || line.length > 0) { line.push(val.trim()); res.push(line); }
    return res.filter(r => r.join('').trim() !== '');
  };

  const parsedRows = parseCSV(csvText);
  if (parsedRows.length < 2) throw new Error("CSV kosong atau tidak ada data");
  
  const headers = parsedRows[0].map(h => h.toLowerCase());
  
  const nameIdx = headers.findIndex(h => h.includes('nama'));
  const classIdx = headers.findIndex(h => h === 'kelas');
  const nisnIdx = headers.findIndex(h => h === 'nisn');
  const nisIdx = headers.findIndex(h => h === 'nis');
  const genderIdx = headers.findIndex(h => h.includes('kelamin') || h === 'jk');
  const waliIdx = headers.findIndex(h => h.includes('wali'));
  const agamaIdx = headers.findIndex(h => h === 'agama');

  if (nameIdx === -1 || classIdx === -1) {
    throw new Error("Format CSV salah. Harus ada kolom 'Nama Murid' dan 'Kelas'.");
  }

  const { data: existingClasses } = await supabase.from('classes').select('id, name');
  const classMap = {};
  if (existingClasses) {
      existingClasses.forEach(c => classMap[c.name.toUpperCase()] = c.id);
  }

  const studentsToInsert = [];
  const newClassesToCreate = new Set();

  for (let i = 1; i < parsedRows.length; i++) {
    const cols = parsedRows[i];
    
    const name = cols[nameIdx];
    const className = cols[classIdx];
    
    if (!name || !className) continue;

    const nis = nisIdx > -1 ? cols[nisIdx] : '';
    const nisn = nisnIdx > -1 ? cols[nisnIdx] : '';
    let gender = genderIdx > -1 ? (cols[genderIdx] || '') : '';
    
    const gUpper = gender.trim().toUpperCase();
    if (gUpper === 'L') {
        gender = 'Pria';
    } else if (gUpper === 'P') {
        gender = 'Wanita';
    } else {
        gender = '';
    }

    const wali = waliIdx > -1 ? cols[waliIdx] : '';

    let agamaRaw = agamaIdx > -1 ? (cols[agamaIdx] || '').trim().toUpperCase() : '';
    let agama = '';
    if (agamaRaw === 'I') agama = 'Islam';
    else if (agamaRaw === 'K') agama = 'Kristen';
    else if (agamaRaw === 'KK') agama = 'Katholik';
    else if (agamaRaw === 'H') agama = 'Hindu';
    else if (agamaRaw === 'B') agama = 'Buddha';
    else agama = agamaRaw || null;

    if (!classMap[className.toUpperCase()]) {
      newClassesToCreate.add(className);
    }

    studentsToInsert.push({
      name,
      tempClassName: className,
      nis,
      nisn,
      gender,
      agama,
      homeroom_teacher: wali,
      poin_pelanggaran: 0,
      poin_penghargaan: 0,
      sp_issued_level: 0
    });
  }

  for (const newClass of newClassesToCreate) {
    const { data: insertedClass } = await supabase.from('classes').insert([{ name: newClass }]).select();
    if (insertedClass && insertedClass.length > 0) {
      classMap[newClass.toUpperCase()] = insertedClass[0].id;
    }
  }

  const finalInsertData = studentsToInsert.map(s => {
    const class_id = classMap[s.tempClassName.toUpperCase()];
    delete s.tempClassName;
    return { ...s, class_id };
  });

  if (finalInsertData.length === 0) return 0;

  const BATCH_SIZE = 500;
  for (let i = 0; i < finalInsertData.length; i += BATCH_SIZE) {
    const batch = finalInsertData.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('students').insert(batch);
    if (error) throw error;
  }
  
  return finalInsertData.length;
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
  const { photoBase64, studentId, studentName, className, type, action, description, points, notes, date, reportedBy } = recordData;
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
    photo_url,
    reported_by: reportedBy
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
  let allData = [];
  let from = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = supabase.from('records').select('*, students(name, class_id, classes(name))');
    
    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }
    
    if (filters.startDate && filters.endDate) {
      query = query.gte('date', filters.startDate).lte('date', filters.endDate);
    }
    
    if (filters.reportedBy && filters.reportedBy !== 'all') {
      query = query.eq('reported_by', filters.reportedBy);
    }
    
    query = query.order('created_at', { ascending: false }).range(from, from + limit - 1);
    
    const { data, error } = await query;
    if (error) throw error;
    
    allData = [...allData, ...data];
    if (data.length < limit) {
      hasMore = false;
    } else {
      from += limit;
    }
  }
  
  let results = allData.map(d => ({
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
    reportedBy: d.reported_by || '-'
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
      const fileName = decodeURIComponent(urlParts[urlParts.length - 1].split('?')[0]);
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
          const oldFileName = decodeURIComponent(urlParts[urlParts.length - 1].split('?')[0]);
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

// --- APP USERS (Manajemen Akun Guru & OSIS) ---
export const getAppUsers = async () => {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  return data;
};

export const addAppUser = async (userData) => {
  const { data, error } = await supabase.from('users').insert([userData]).select();
  if (error) throw error;
  return data;
};

export const deleteAppUser = async (id) => {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const updateAppUser = async (id, userData) => {
  const { data, error } = await supabase.from('users').update(userData).eq('id', id).select();
  if (error) throw error;
  return data;
};
