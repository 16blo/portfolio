export type Project = { id: string; title: string; category: string; summary: string; date: string; tags: string[]; context: string; details: string; learning: string; image: string; link: string; visible: boolean; art: string };
export type Certificate = { id: string; title: string; issuer: string; category: string; date: string; expires: string; link: string; attachment: string; visible: boolean };
export type Profile = { name: string; headline: string; intro: string; about: string; email: string; location: string; linkedin: string; cv: string; photo: string };
export type Timeline = { period: string; label: string; title: string; place: string; text: string; type: string };
export type Skill = { title: string; icon: string; desc: string; items: string[] };
export type Portfolio = { profile: Profile; projects: Project[]; certificates: Certificate[]; timeline: Timeline[]; skills: Skill[] };
