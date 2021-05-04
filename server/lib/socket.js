const io = require("socket.io")
// const io = require("socket.io")(80)
const users = require("./users")

/**
 * Initialize when a connection is made
 * @param {SocketIO.Socket} socket
 */
function initSocket(socket) {
  let user

  console.log("Call initSocket")

  socket
    .on("init", async (data) => {
      console.log("INIT ========", data)
      try {
        user = await users.create({
          ...data,
          socket,
        })
        socket.emit("init", data)
        console.log("Create user success ", data)
      } catch (error) {
        console.log("Crearte user failure ", error)
      }
    })
    .on("request", (data) => {
      // console.log("request ========")
      if (data.to && user) {
        const receiver = users.get(data.to)
        // console.log("receiver => ", receiver)
        // console.log("data.to => ", data.to)
        if (receiver) {
          receiver.socket.emit("request", {
            from: user.userId,
            fromName: user.userName,
          })
        }
      }
    })
    .on("call", (data) => {
      // console.log("call ========", data)
      if (data.to && user) {
        const receiver = users.get(data.to) // TODO
        if (receiver) {
          receiver.socket.emit("call", {
            ...data,
            from: user.userId,
            fromName: user.userName,
          })
        } else {
          socket.emit("failed")
        }
      }
    })
    .on("end", (data) => {
      // console.log("end ========", data)
      if (data.to && user) {
        const receiver = users.get(data.to)
        if (receiver) {
          receiver.socket.emit("end")
        }
      }
    })
    .on("disconnect", () => {
      console.log("disconnect ========")
      if (user) {
        users.remove(user.userId)
        console.log(user.userId, user.userName, "disconnected")
      }
    })
}

// io.on("connection", initSocket)

// module.exports = initSocket

module.exports = (server) => {
  io({ path: "/bridge", serveClient: true })
    .listen(server, { log: true })
    .on("connection", initSocket)
}

// const io = require("socket.io")
// const users = require("./users")

// /**
//  * Initialize when a connection is made
//  * @param {SocketIO.Socket} socket
//  */
// function initSocket(socket) {
//   let id

//   socket
//     .on("init", async (data) => {
//       id = await users.create(socket)
//       console.log("server init", data)
//       socket.emit("init", { id })
//     })
//     .on("request", (data) => {
//       const receiver = users.get(data.to)
//       if (receiver) {
//         receiver.emit("request", { from: id })
//       }
//     })
//     .on("call", (data) => {
//       const receiver = users.get(data.to)
//       if (receiver) {
//         receiver.emit("call", { ...data, from: id })
//       } else {
//         socket.emit("failed")
//       }
//     })
//     .on("end", (data) => {
//       const receiver = users.get(data.to)
//       if (receiver) {
//         receiver.emit("end")
//       }
//     })
//     .on("disconnect", () => {
//       users.remove(id)
//       console.log(id, "disconnected")
//     })
// }

// module.exports = (server) => {
//   io({ path: "/bridge", serveClient: true })
//     .listen(server, { log: true })
//     .on("connection", initSocket)
// }
