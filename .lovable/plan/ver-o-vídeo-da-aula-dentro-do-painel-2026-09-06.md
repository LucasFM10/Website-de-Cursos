# Ver o vídeo da aula dentro do painel

Hoje, na área do ateliê, cada aula só tem os botões "Enviar vídeo" e "Atualizar situação". Não existe nenhum lugar para assistir. O vídeo só pode ser visto abrindo a página da aula, e não há link para ela no painel.

## O que vou fazer

1. Em cada aula do painel, quando já existir vídeo enviado, aparece um botão **"Ver vídeo"**.
2. Ao clicar, o player abre ali mesmo, embaixo da aula (dá para fechar de novo). O vídeo carrega com um endereço temporário e seguro, o mesmo usado pelos alunos.
3. Se o vídeo ainda estiver em processamento, mostro um aviso simples ("o vídeo ainda está sendo preparado, atualize a situação em alguns instantes") em vez de um player vazio.
4. Junto ao botão, um link **"Abrir a página da aula"** para conferir exatamente o que o aluno vê.

Nada muda no envio de vídeos nem nas regras de acesso dos alunos.

## Detalhes técnicos

- `src/routes/_authenticated/admin.cursos.$id.tsx`: no componente `VideoUploader`, adicionar estado `showPlayer` e um `useQuery` (habilitado só quando aberto) chamando `getLessonPlayback` via `useServerFn`, renderizando o `<iframe>` do Bunny em `aspect-video` quando `embedUrl` existir; `Link` para `/aula/$lessonId`.
- `getLessonPlayback` já libera admin (`has_course_access` retorna true para admin), então não é preciso mudar o servidor.
- Sem migração de banco e sem novas dependências.
