export async function onRequestPost(context: { request: { formData: () => any } }){
    const formdata = await context.request.formData()
    const name = formdata.get('name')
    const email = formdata.get('email')
    return new Response(`${name} and ${email}`)
}