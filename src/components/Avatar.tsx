interface AvatarProps {
  fotoUrl?: string;
  nome: string;
  tamanho?: number;
  className?: string;
  onClick?: () => void;
}

export const Avatar = ({ 
  fotoUrl, 
  nome, 
  tamanho = 48,
  className = '',
  onClick 
}: AvatarProps) => {
  const iniciais = nome
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        width: `${tamanho}px`,
        height: `${tamanho}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        backgroundColor: fotoUrl ? 'transparent' : '#242c30',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: `${tamanho / 2.5}px`,
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0
      }}
    >
      {fotoUrl ? (
        <img 
          src={fotoUrl} 
          alt={nome}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover' 
          }}
          onError={(e) => {
            // Fallback se a imagem não carregar
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <span>{iniciais}</span>
      )}
    </div>
  );
};
