

// Automatic room cleanup function
const cleanupOldRooms = (io, rooms, connectedUsers) => {
    console.log("cleanupOldRooms fn ");

    const now = Date.now();
    const MAX_ROOM_AGE = 30 * 60 * 1000; // 30 minutes in milliseconds
    const MAX_ENDED_ROOM_AGE = 3 * 60 * 1000; // 3 minutes for ended games

    const roomsToDelete = rooms.filter(room => {
        // Only delete launched rooms
        if (!room.isLaunched) return false;

        // Check if room has ended and been ended for more than 3 minutes
        if (room.hasEnded) {
            const endedSince = now - room.hasEnded;
            return endedSince > MAX_ENDED_ROOM_AGE;
        }

        // Check if room has no real users (only CPU players)
        const hasRealUsers = room.usersInTheRoom && room.usersInTheRoom.length > 0;
        if (!hasRealUsers) {
            return true; // Delete immediately if no real users
        }

        // Check if room is older than MAX_ROOM_AGE (30 minutes)
        const roomAge = now - room.id;
        return roomAge > MAX_ROOM_AGE;
    });

    if (roomsToDelete.length > 0) {
        console.log(`Cleaning up ${roomsToDelete.length} old room(s)`);

        roomsToDelete.forEach(room => {
            const reason = room.hasEnded
                ? 'ended more than 3 minutes ago'
                : room.usersInTheRoom?.length === 0
                    ? 'no real users'
                    : 'max age reached';

            console.log(`Deleting room: ${room.name} (ID: ${room.id}) - Reason: ${reason}`);

            // Update users who were in this room
            connectedUsers.forEach((user, index) => {
                if (user.isInRoom === room.id) {
                    connectedUsers[index] = {
                        ...user,
                        isInRoom: null,
                        isPlaying: false
                    };
                }
            });
        });

        // Remove old rooms
        rooms = rooms.filter(room => !roomsToDelete.includes(room));

        io.emit("updateRooms", rooms);
        io.emit("updateUsers", connectedUsers);
    } else if (roomsToDelete.length = 0) {
        console.log("No old rooms to clean up.");
    }
};

module.exports = cleanupOldRooms;