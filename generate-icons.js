import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [192, 512];
const inputFile = 'public/logo.png';
const outputDir = 'public';

// Verifica se o arquivo de entrada existe
if (!fs.existsSync(inputFile)) {
  console.error(`❌ Arquivo ${inputFile} não encontrado!`);
  process.exit(1);
}

console.log(`📦 Gerando ícones PWA a partir de ${inputFile}...`);

// Gera os ícones
Promise.all(
  sizes.map(async (size) => {
    const outputFile = path.join(outputDir, `pwa-${size}x${size}.png`);
    
    try {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputFile);
      
      console.log(`✅ Gerado: ${outputFile}`);
    } catch (error) {
      console.error(`❌ Erro ao gerar ${outputFile}:`, error.message);
    }
  })
)
  .then(() => {
    console.log('🎉 Todos os ícones PWA foram gerados com sucesso!');
  })
  .catch((error) => {
    console.error('❌ Erro geral:', error);
    process.exit(1);
  });
