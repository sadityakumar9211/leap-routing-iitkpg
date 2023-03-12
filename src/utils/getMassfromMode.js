export default function getMassfromMode(temp_mode) {
    if (temp_mode == 'car') {
        return 2500
    } else if (temp_mode == 'truck') {
        return 15000
    } else if (temp_mode == 'scooter') {
        return 150
    } else {
        return 0
    }
}