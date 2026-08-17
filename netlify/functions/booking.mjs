export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type"}});
  if (req.method !== "POST") return Response.json({ok:false,error:"POST only"},{status:405});
  const url=process.env.APPS_SCRIPT_API_URL;
  if(!url) return Response.json({ok:false,error:"APPS_SCRIPT_API_URL is not configured"},{status:500});
  try{
    const body=await req.text();
    const upstream=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body});
    const text=await upstream.text();
    return new Response(text,{status:200,headers:{"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":"*"}});
  }catch(e){return Response.json({ok:false,error:e.message||"Proxy error"},{status:500});}
};
export const config={path:"/api/booking"};
