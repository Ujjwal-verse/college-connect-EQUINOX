export type Role = 'student'|'staff'|'faculty';
export type Account = {id:string;role:Role;name:string;label:string;email?:string;roll?:string;phone?:string;staffId?:string;category?:string;key:string};
// Deliberately public demo credentials. These never authenticate real university users.
export const accounts:Account[] = [
{id:'student-01',role:'student',name:'Aarav Sharma',label:'Student · BTech, Year 2',email:'aarav@demo.university.test',roll:'DEMO2026001',key:'STUDENT-DEMO-26'},
{id:'student-02',role:'student',name:'Meera Rao',label:'Student · BTech, Year 1',email:'meera@demo.university.test',roll:'DEMO2026002',key:'STUDENT-DEMO-26'},
{id:'staff-plumbing',role:'staff',name:'Ravi Kumar',label:'Plumbing technician',phone:'0000000001',staffId:'STAFF-P01',category:'Plumbing',key:'STAFF-DEMO-26'},
{id:'staff-electricity',role:'staff',name:'Priya Singh',label:'Electrical technician',phone:'0000000002',staffId:'STAFF-E01',category:'Electricity',key:'STAFF-DEMO-26'},
{id:'staff-cleanliness',role:'staff',name:'Sana Ali',label:'Housekeeping supervisor',phone:'0000000003',staffId:'STAFF-C01',category:'Cleanliness',key:'STAFF-DEMO-26'},
{id:'staff-internet',role:'staff',name:'Dev Patel',label:'IT support technician',phone:'0000000004',staffId:'STAFF-I01',category:'Internet',key:'STAFF-DEMO-26'},
{id:'faculty-dean',role:'faculty',name:'Dr. Kavya Menon',label:'Dean · Campus operations',email:'dean@demo.university.test',key:'DEAN-DEMO-26'},
{id:'faculty-warden',role:'faculty',name:'Ananya Desai',label:'Warden · Campus operations',email:'warden@demo.university.test',key:'WARDEN-DEMO-26'},
];
export function publicAccount(a:Account){const {key,...user}=a;return user;}
export function matchAccount(b:any){return accounts.find(a=>a.role===b.role&&a.key===b.key&&(a.role==='student'?a.roll===String(b.roll||'').trim().toUpperCase()&&a.email===String(b.email||'').trim().toLowerCase():a.role==='staff'?a.staffId===String(b.staffId||'').trim().toUpperCase()&&a.phone===String(b.phone||'').trim():a.email===String(b.email||'').trim().toLowerCase()));}
