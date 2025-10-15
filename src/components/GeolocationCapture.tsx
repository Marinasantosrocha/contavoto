import React, { useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';

interface GeolocationCaptureProps {
  onLocationCaptured: (lat: number, lng: number, accuracy: number) => void;
  initialLatitude?: number;
  initialLongitude?: number;
}

export function GeolocationCapture({ 
  onLocationCaptured, 
  initialLatitude, 
  initialLongitude 
}: GeolocationCaptureProps) {
  const {
    latitude,
    longitude,
    accuracy,
    isGettingLocation,
    error,
    getCurrentLocation,
    clearLocation,
  } = useGeolocation();

  const [showMap, setShowMap] = useState(false);

  // Usar coordenadas iniciais se fornecidas
  const currentLat = latitude || initialLatitude;
  const currentLng = longitude || initialLongitude;

  const handleLocationCaptured = () => {
    if (currentLat && currentLng && accuracy) {
      onLocationCaptured(currentLat, currentLng, accuracy);
    }
  };

  const formatCoordinate = (coord: number | null) => {
    if (!coord) return 'N/A';
    return coord.toFixed(6);
  };

  const formatAccuracy = (acc: number | null) => {
    if (!acc) return 'N/A';
    if (acc < 10) return `${acc.toFixed(1)}m (Excelente)`;
    if (acc < 50) return `${acc.toFixed(1)}m (Boa)`;
    if (acc < 100) return `${acc.toFixed(1)}m (Aceitável)`;
    return `${acc.toFixed(1)}m (Baixa)`;
  };

  const getAccuracyColor = (acc: number | null) => {
    if (!acc) return '#64748b';
    if (acc < 10) return '#10b981';
    if (acc < 50) return '#3b82f6';
    if (acc < 100) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="geolocation-capture">
      <div className="location-header">
        <h3>📍 Geolocalização da Residência</h3>
        <p>Capture a localização exata da casa para análise geográfica</p>
      </div>

      <div className="location-controls">
        <button
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="btn btn-primary btn-large"
        >
          {isGettingLocation ? (
            <>
              <div className="loading-spinner"></div>
              Obtendo localização...
            </>
          ) : (
            <>
              📍 Capturar Localização Atual
            </>
          )}
        </button>

        {currentLat && currentLng && (
          <button
            onClick={clearLocation}
            className="btn btn-secondary"
          >
            🗑️ Limpar
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      {currentLat && currentLng && (
        <div className="location-info">
          <div className="coordinates">
            <div className="coord-item">
              <span className="coord-label">Latitude:</span>
              <span className="coord-value">{formatCoordinate(currentLat)}</span>
            </div>
            <div className="coord-item">
              <span className="coord-label">Longitude:</span>
              <span className="coord-value">{formatCoordinate(currentLng)}</span>
            </div>
            <div className="coord-item">
              <span className="coord-label">Precisão:</span>
              <span 
                className="coord-value"
                style={{ color: getAccuracyColor(accuracy) }}
              >
                {formatAccuracy(accuracy)}
              </span>
            </div>
          </div>

          <div className="location-actions">
            <button
              onClick={() => setShowMap(!showMap)}
              className="btn btn-secondary"
            >
              {showMap ? '🗺️ Ocultar Mapa' : '🗺️ Ver no Mapa'}
            </button>

            <button
              onClick={handleLocationCaptured}
              className="btn btn-primary"
            >
              ✅ Confirmar Localização
            </button>
          </div>

          {showMap && (
            <div className="map-container">
              <iframe
                src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dOWWgUjJdQzJdQ&center=${currentLat},${currentLng}&zoom=18&maptype=satellite`}
                width="100%"
                height="300"
                style={{ border: 0, borderRadius: '16px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização da Residência"
              />
              <p className="map-note">
                📍 Localização capturada: {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="location-tips">
        <h4>💡 Dicas para melhor precisão:</h4>
        <ul>
          <li>✅ Ative o GPS no seu dispositivo</li>
          <li>✅ Permita acesso à localização no navegador</li>
          <li>✅ Aguarde alguns segundos para estabilizar</li>
          <li>✅ Evite áreas com muitos obstáculos (prédios altos)</li>
        </ul>
      </div>

      <style jsx>{`
        .geolocation-capture {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 32px;
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          margin: 24px 0;
        }

        .location-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .location-header h3 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 12px;
        }

        .location-header p {
          font-size: 16px;
          color: #64748b;
        }

        .location-controls {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          margin: 20px 0;
          padding: 16px;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border: 2px solid #fca5a5;
          border-radius: 16px;
          text-align: center;
        }

        .error-message span {
          color: #dc2626;
          font-weight: 600;
        }

        .location-info {
          background: rgba(248, 250, 252, 0.8);
          backdrop-filter: blur(10px);
          padding: 24px;
          border-radius: 20px;
          margin: 24px 0;
          border: 2px solid rgba(59, 130, 246, 0.1);
        }

        .coordinates {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .coord-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .coord-label {
          font-weight: 600;
          color: #64748b;
          font-size: 14px;
        }

        .coord-value {
          font-weight: 700;
          color: #1e293b;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 14px;
        }

        .location-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .map-container {
          margin-top: 24px;
          text-align: center;
        }

        .map-note {
          margin-top: 12px;
          font-size: 14px;
          color: #64748b;
          font-style: italic;
        }

        .location-tips {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 2px solid #0ea5e9;
          border-radius: 16px;
          padding: 20px;
          margin-top: 24px;
        }

        .location-tips h4 {
          color: #0c4a6e;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .location-tips ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .location-tips li {
          color: #0c4a6e;
          font-size: 14px;
          margin-bottom: 8px;
          padding-left: 8px;
        }

        @media (max-width: 768px) {
          .geolocation-capture {
            padding: 24px;
          }

          .location-controls,
          .location-actions {
            flex-direction: column;
          }

          .coordinates {
            grid-template-columns: 1fr;
          }

          .coord-item {
            flex-direction: column;
            text-align: center;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}
