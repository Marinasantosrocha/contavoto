import './RecordingIndicator.css';

interface RecordingIndicatorProps {
  isRecording: boolean;
  duration?: number; // Mantido por compatibilidade, mas não usado
}

/**
 * Indicador de gravação ativa
 * Bolinha vermelha piscando no canto esquerdo
 */
export default function RecordingIndicator({ isRecording }: RecordingIndicatorProps) {
  if (!isRecording) return null;

  return (
    <div className="recording-indicator">
      <div className="recording-dot"></div>
    </div>
  );
}
