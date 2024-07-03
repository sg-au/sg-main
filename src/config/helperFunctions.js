// helpers.js

function createTicketId(prefix, length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomPart = '';
    for (let i = 0; i < length; i++) {
        randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return `${prefix}-${randomPart}`;
  }
  
  function formatDate(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    // Get year, month, day, hours, minutes
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0'); // Add leading zero for single digits
    // Get AM/PM indicator
    const ampm = hours >= 12 ? 'pm' : 'am';
    // Adjust for 12-hour format
    let adjustedHours = hours % 12;
    adjustedHours = adjustedHours === 0 ? 12 : adjustedHours;
    return `${days[date.getDay()]}, ${day} ${months[monthIndex]} ${year} ${adjustedHours}:${minutes} ${ampm}`;
  }


  function borrowDate(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    // Get year, month, day, hours, minutes
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0'); // Add leading zero for single digits
    // Get AM/PM indicator
    const ampm = hours >= 12 ? 'pm' : 'am';
    // Adjust for 12-hour format
    let adjustedHours = hours % 12;
    adjustedHours = adjustedHours === 0 ? 12 : adjustedHours;
    return `${days[date.getDay()]}, ${day} ${months[monthIndex]} ${year}`;
  }
  
  module.exports = { createTicketId, formatDate, borrowDate };