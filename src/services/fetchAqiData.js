export default async function fetchAqiData (coordinate) {
    try {
        const query = await fetch(
            `https://api.waqi.info/feed/geo:${coordinate[1]};${coordinate[0]}/?token=${process.env.REACT_APP_WAQI_API_KEY}`,
            { method: 'GET' }
        )
        const json = await query.json()
        return json
    } catch (e) {
        setIsLoading(false)
        console.log(e)
    }
}
