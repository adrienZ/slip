export default defineNitroPlugin((nitroApp) => {
  console.log('Nitro plugin')

  nitroApp.router.add("/yolo", defineEventHandler(event => {
    return { coucou: "ey"}
  }), "get"
)
})