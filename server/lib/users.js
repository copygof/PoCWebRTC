/* eslint-disable no-await-in-loop */
const haiku = require("./haiku")

const users = {}

// Random ID until the ID is not in use
// async function randomID() {
//   let id = haiku()
//   while (id in users) {
//     await Promise.delay(5)
//     id = haiku()
//   }
//   return id
// }

// exports.create = async (socket) => {
//   const id = await randomID()
//   console.log("users => ", Object.keys(users))
//   users[id] = socket
//   return id
// }

exports.create = async (socket) => {
  users[socket.userId] = socket
  console.log(
    "All users => ",
    Object.keys(users).map((v) => ({
      userId: users[v].userId,
      userName: users[v].userName,
    }))
  )
  return socket
}

exports.get = (id) => users[id]

exports.remove = (id) => delete users[id]
