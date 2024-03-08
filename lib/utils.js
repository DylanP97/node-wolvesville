
exports.getCurrentTime = () => {
    const currentDate = new Date();

    const options = {
        // year: '2-digit',
        // month: '2-digit',
        // day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    const formattedDateTime = currentDate.toLocaleString('en-US', options);
    return formattedDateTime;
}

