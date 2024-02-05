// exports.gameTimeCounter = (room) => {

//     setInterval(() => {
//         gameTime -= 1000; // Decrement by 1 second in ms

//         if (gameTime <= 0) {
//             if (room.timeOfTheDay === "nighttime") {
//                 room.timeOfTheDay = "daytime";
//                 room.dayCount += 1;
//                 gameTime = 20000;
//             } else if (room.timeOfTheDay === "daytime") {
//                 room.timeOfTheDay = "votetime";
//                 gameTime = 20000;
//             } else {
//                 room.timeOfTheDay = "nighttime";
//                 gameTime = 20000;
//             }
//         }
//     }, 1000);

//     console.log(gameTime)

//     room.timeCounter = gameTime;
//     return room;
// }
