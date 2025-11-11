import { useState, useEffect } from 'react';
import axios from 'axios';
import './Weather.css';
import DetailedWeatherDialog from './DetailedWeatherDialog'; // New component import

interface CurrentWeatherData {
  name: string;
  location: {
    name: string;
  };
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
    };
  };
  // Removed OpenWeatherMap specific fields
  weather?: { // Keep optional for now, in case old data structure lingers
    icon: string;
    description: string;
  }[];
}

const Weather = () => {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherData | null>(null); // State for current weather
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showDetailedWeather, setShowDetailedWeather] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    const fetchCurrentWeather = (lat: number, lon: number) => {
      axios.get(`${import.meta.env.VITE_API_URL}/api/weather`, { params: { lat, lon } })
        .then(response => {
          setCurrentWeather(response.data);
        })
        .catch(err => {
          console.error("Failed to fetch current weather", err);
          setError('Could not fetch current weather data.');
        });
    };

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lon: longitude });
      fetchCurrentWeather(latitude, longitude);
    };

    const handleError = (error: GeolocationPositionError) => {
      setError(`Location error: ${error.message}`);
      // Fallback to a default location if user denies permission
      // For example, London coordinates
      // setUserLocation({ lat: 51.5074, lon: -0.1278 });
      // fetchCurrentWeather(51.5074, -0.1278);
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError);

  }, []);

  const handleWidgetClick = () => {
    if (userLocation) {
      setShowDetailedWeather(true);
    } else {
      setError("Location not available to show detailed weather.");
    }
  };

  if (error) {
    return <div className="weather-widget error">{error}</div>;
  }

  if (!currentWeather) {
    return <div className="weather-widget">Loading weather...</div>;
  }

  return (
    <>
      <div className="weather-widget" onClick={handleWidgetClick}>
        <img src={currentWeather.current.condition.icon} alt={currentWeather.current.condition.text} className="weather-icon" />
      <div className="weather-details">
          <span className="weather-temp">{Math.round(currentWeather.current.temp_c)}°C</span>
          <span className="weather-city">{currentWeather.location.name}</span>
        </div>
      </div>

      {showDetailedWeather && userLocation && (
        <DetailedWeatherDialog
          lat={userLocation.lat}
          lon={userLocation.lon}
          onClose={() => setShowDetailedWeather(false)}
        />
      )}
    </>
  );
};

export default Weather;