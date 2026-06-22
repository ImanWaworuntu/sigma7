import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDOQpyDBGa722jsLwy94G2aOCFv1Fs8gj0",
  projectId: "sigma7-sman7mks",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const snap = await getDocs(query(collection(db, "students")));
  const classes = {};
  snap.docs.forEach(d => {
    const cls = d.data().classId;
    if (!classes[cls]) classes[cls] = 0;
    classes[cls]++;
  });
  console.log(classes);
  process.exit(0);
}

check().catch(console.error);
