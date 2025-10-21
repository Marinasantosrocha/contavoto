import './LoadingScreen.css';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message }: LoadingScreenProps) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner-ring"></div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  );
};
