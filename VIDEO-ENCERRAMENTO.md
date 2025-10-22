# Vídeo de encerramento (offline)

Para exibir um vídeo curto de agradecimento no fim da pesquisa e garantir que funcione offline:

1) Coloque o arquivo do vídeo em `public/agradecimento.mp4`.
   - Recomendado: MP4 (H.264 + AAC), tamanho pequeno (até ~5–10 MB) para download rápido em campo.
   - Nome do arquivo deve ser exatamente `agradecimento.mp4` (ou ajuste no código em `src/pages/PesquisaPage.tsx`).

2) O PWA já está configurado para:
   - Pré-cachear arquivos de vídeo (globPatterns inclui `mp4, webm, ogg`).
   - Usar cache-first para `request.destination === 'video'` no Service Worker, permitindo reprodução offline.

3) Build e deploy
   - Gere o build de produção normalmente. Na primeira execução online, o PWA salva o vídeo no cache.
   - Após isso, a reprodução funciona mesmo sem conexão.

4) Alterar o arquivo ou nome do vídeo
   - Se quiser outro nome, mude a referência em `PesquisaPage.tsx` (propriedade `src` do elemento `<video>`).
   - Se quiser usar um link remoto (por exemplo, Supabase Storage), ajuste o Service Worker para cacheá-lo também (roteamento `video` já cobre). 

## Teste rápido
- Rode o build de produção, acesse o app, entre no fluxo até o encerramento e clique em "Assistir vídeo de agradecimento".
- Depois, ative o modo offline no DevTools e reproduza novamente para validar o cache.
