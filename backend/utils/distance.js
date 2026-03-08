/**
 * Calculates the distance between two points on the Earth's surface using the Haversine formula.
 * @param {number} lat1 - Latitude of the first point in decimal degrees
 * @param {number} lon1 - Longitude of the first point in decimal degrees
 * @param {number} lat2 - Latitude of the second point in decimal degrees
 * @param {number} lon2 - Longitude of the second point in decimal degrees
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRadian = angle => (Math.PI / 180) * angle;

    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadian(lat2 - lat1);
    const dLon = toRadian(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadian(lat1)) * Math.cos(toRadian(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

module.exports = { calculateDistance };
