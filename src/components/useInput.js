import { useState } from 'react'

export default function useInput(initialValue) {
    const [value, setValue] = useState(initialValue)
    const [position, setPosition] = useState([77.20902442, 28.62396379])
    const [suggestions, setSuggestions] = useState([])

    const handleChange = async (e) => {
        setValue(e.target.value)
        try {
            console.log(process.env.MAPBOX_API_KEY)
            const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${e.target.value}.json?access_token=pk.eyJ1Ijoic2FkaXR5YTkyMTEiLCJhIjoiY2xidzNvcWQ2MXlrazNucW5rcGxnc2RncCJ9.1GMKNUsQUmXSxvrOqlDnsw&autocomplete=true&bbox=66,5,98,37&type=address,postcode,district,place,city,locality,neighborhood,block,street`
            const response = await fetch(endpoint)
            const results = await response.json()
            setSuggestions(results?.features)
        } catch (e) {
            console.log({ 'Error Fetching Suggestions': e })
        }
    }

    return {
        value,
        setValue,
        position,
        setPosition,
        suggestions,
        setSuggestions,
        onChange: handleChange,
    }
}
