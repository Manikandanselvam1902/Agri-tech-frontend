import { useState, useEffect } from 'react';
import type { FC } from 'react';
import axios from 'axios';
import './DetailedWeatherDialog.css';

interface WeatherCondition {
  text: string;
  icon: string;
}

interface DayWeather {
  date: string;
  day: {
    maxtemp_c: number;
    mintemp_c: number;
    condition: WeatherCondition;
  };
}

interface DetailedWeatherData {
  location: {
    name: string;
    region: string;
    country: string;
  };
  current: {
    temp_c: number;
    condition: WeatherCondition;
    wind_kph: number;
    humidity: number;
  };
  historical: DayWeather[]; // Mocked for previous 3 days
  forecast: DayWeather[]; // Next 3 days (including today)
}

interface DetailedWeatherDialogProps {
  lat: number;
  lon: number;
  onClose: () => void;
}

const DetailedWeatherDialog: FC<DetailedWeatherDialogProps> = ({ lat, lon, onClose }) => {
  const [detailedWeather, setDetailedWeather] = useState<DetailedWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios.get(`${import.meta.env.VITE_API_URL}/api/detailed-weather`, { params: { lat, lon } })
      .then(response => {
        setDetailedWeather(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch detailed weather", err);
        setError('Failed to load detailed weather data. Please try again later.');
        setLoading(false);
      });
  }, [lat, lon]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderDayCard = (dayData: DayWeather, title: string) => (
    <div className="weather-card">
      <h3>{title}</h3>
      <p className="weather-card-date">{formatDate(dayData.date)}</p>
      <img src={dayData.day.condition.icon} alt={dayData.day.condition.text} />
      <p className="weather-card-temp">{Math.round(dayData.day.maxtemp_c)}°C / {Math.round(dayData.day.mintemp_c)}°C</p>
      <p className="weather-card-condition">{dayData.day.condition.text}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="detailed-weather-dialog">
          <p>Loading detailed weather...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="detailed-weather-dialog">
          <p className="error-message">{error}</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  if (!detailedWeather) {
    return null; // Should not happen if not loading and no error
  }

  const { location, current, historical, forecast } = detailedWeather;

  // WeatherAPI.com forecast.json with days=3 returns today + next 2 days.
  // We need previous 3 days (mocked), and next 2 days (from forecast).
  const forecastDays = forecast.slice(1, 3); // Exclude today, take next 2 days
  const todayForecast = forecast[0]; // Today's forecast data from the forecast array

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detailed-weather-dialog" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>
        <h2>Weather for {location.name}, {location.country}</h2>

        <div className="current-weather-summary">
          <img src={current.condition.icon} alt={current.condition.text} />
          <div>
            <p className="current-temp">{Math.round(current.temp_c)}°C</p>
            <p>{current.condition.text}</p>
            <p>Wind: {current.wind_kph} kph, Humidity: {current.humidity}%</p>
          </div>
        </div>

        <h3>Past 3 Days</h3>
        <div className="weather-cards-container">
          {historical.map((day, index) => renderDayCard(day, `Day ${index + 1} Ago`))}
        </div>

        <h3>Next 2 Days Forecast</h3>
        <div className="weather-cards-container">
          {renderDayCard(todayForecast, "Today")} {/* Include today from forecast for consistency */}
          {forecastDays.map((day, index) => renderDayCard(day, `Day ${index + 1} Ahead`))}
        </div>

        <p className="disclaimer">
          Note: Historical weather data is obtained from WeatherAPI.com free tier limitations.
        </p>
      </div>
    </div>
  );
};

export default DetailedWeatherDialog;