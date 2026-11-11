const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
export function token() { return typeof window === 'undefined' ? null : localStorage.getItem('tidewrk_token'); }
export async function api<T>(path:string, options:RequestInit={}):Promise<T> {
 const headers=new Headers(options.headers); headers.set('Accept','application/json');
 if(options.body) headers.set('Content-Type','application/json');
 const t=token(); if(t) headers.set('Authorization',`Bearer ${t}`);
 const res=await fetch(`${BASE}${path}`,{...options,headers,cache:'no-store'});
 const data=await res.json().catch(()=>({}));
 if(!res.ok) throw new Error(data.message || Object.values(data.errors||{}).flat().join(' ') || 'API request failed');
 return data as T;
}
