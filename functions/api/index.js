export async function onRequestGet(context){
    return new Response('Hello Workers!', {status:200})
}