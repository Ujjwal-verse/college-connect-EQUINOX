export const rules = [
 {category:'Plumbing',department:'Facilities · Plumbing',rule:'P-01: Water leaks, blocked drains and faulty taps go to the plumbing team.',words:/leak|water|tap|pipe|drain|toilet/i},
 {category:'Electricity',department:'Facilities · Electrical',rule:'E-01: Failed lights, sockets and electrical faults go to the electrical team.',words:/light|electric|socket|power|spark|fan/i},
 {category:'Cleanliness',department:'Campus Housekeeping',rule:'C-01: Litter, overflowing bins and cleaning requests go to housekeeping.',words:/trash|litter|dirty|clean|bin|garbage/i},
 {category:'Internet',department:'IT Helpdesk',rule:'I-01: Wi-Fi, network and internet connectivity problems go to the IT helpdesk.',words:/wifi|wi-fi|internet|network|connect/i}
];
export const statuses=['Submitted','Assigned','In progress','Awaiting verification','Resolved'];
export type Ticket={id:string;title:string;description:string;location:string;mapCoordinates?:string;mapUrl?:string;category:string;department:string;rule:string;status:string;assignee:string;assigneeId?:string;reporterId?:string;reporterName?:string;photo:string;created:string;version:number;demo:boolean;anonymous?:boolean;priority?:'normal'|'emergency'|'fire';fireAlertAt?:string;acknowledgedAt?:string;acknowledgedBy?:string;linkedTo:string|null;history:{status:string;note:string;at:string;actor?:string}[]};
export function validateTicket(b:any){return typeof b?.title==='string'&&b.title.trim().length>=5&&b.title.length<=160&&typeof b.description==='string'&&b.description.trim().length>=10&&b.description.length<=4000&&typeof b.location==='string'&&b.location.trim().length>=3&&b.location.length<=200&&rules.some(r=>r.category===b.category);}
