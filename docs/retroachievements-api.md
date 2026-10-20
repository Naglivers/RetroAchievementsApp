# Guia da API do RetroAchievements

Este documento traduz a [documentação oficial da API](https://api-docs.retroachievements.org/) para uma visão de produto: o que cada recurso entrega e onde ele pode ser usado no Checkpoint.

## Regras gerais

- Os endpoints requerem uma **Web API Key** no parâmetro `y`.
- A chave deve ser tratada como senha; não a coloque em commits, `EXPO_PUBLIC_*` ou em uma URL pública.
- Use o **ULID** do jogador depois da primeira consulta. O nome de usuário pode mudar.
- A API possui limites de uso. Dados estáticos, como detalhes de jogos e sistemas, devem ser mantidos em cache.
- Quando possível, o backend deve usar o pacote oficial [`@retroachievements/api`](https://www.npmjs.com/package/@retroachievements/api), e não montar URLs manualmente.

## Usuário

| API oficial | O que faz | Uso no Checkpoint |
| --- | --- | --- |
| User Profile | Retorna perfil básico: avatar, pontos, lema, último jogo e Rich Presence. | Cabeçalho do perfil e card “jogando agora”. |
| Unlocks (most recent) | Lista as conquistas desbloqueadas mais recentemente por um usuário. | Linha do tempo de atividade. |
| Unlocks (by date range) | Busca desbloqueios em um intervalo de datas. | Resumo semanal/mensal e histórico. |
| Unlocks (on date) | Busca desbloqueios de uma data específica. | Diário de jogo. |
| Game Progress | Retorna o progresso de um usuário em um jogo. | Porcentagem, pontos e conquistas de um jogo. |
| All Completion Progress | Traz o progresso de conclusão de todos os jogos de um jogador. | Biblioteca e filtros “quase completo”. |
| Awards / Badges | Lista medalhas, badges e recompensas do perfil. | Vitrine de perfil. |
| Set Development Claims | Informa conjuntos que um desenvolvedor reivindicou para trabalhar. | Painel opcional para desenvolvedores. |
| Game Rank and Score | Mostra a posição e a pontuação do jogador em um jogo. | Comparação no detalhe do jogo. |
| Point Totals | Fornece totais de pontos e dados relacionados. | Estatísticas rápidas do perfil. |
| Specific Games Progress | Consulta o progresso do usuário em jogos escolhidos. | Carregar apenas os jogos visíveis em uma lista. |
| Recently Played Games | Lista os jogos jogados recentemente, com arte e progresso. | “Continue jogando” e coleção inicial. |
| User Summary | Reúne um resumo de dados do jogador. | Home e perfil com menos chamadas. |
| Completed Games | Lista jogos concluídos ou dominados pelo jogador. | Biblioteca de conquistas. |
| Want to Play Games List | Retorna a lista de jogos que o usuário quer jogar. | Lista “Quero jogar”. |
| Users I Follow | Lista jogadores seguidos pelo usuário. | Aba Amigos. |
| Users Following Me | Lista seguidores do usuário. | Perfil social. |
| User Set Requests | Retorna pedidos de conjuntos de conquistas feitos pelo usuário. | Área de pedidos e comunidade. |

## Jogos

| API oficial | O que faz | Uso no Checkpoint |
| --- | --- | --- |
| Game Summary | Retorna metadados essenciais de um jogo. | Cards no catálogo e resultados de busca. |
| Game Extended Details | Traz detalhes completos, incluindo conquistas, leaderboard e metadados relacionados. | Página de detalhes do jogo. |
| Hashes | Lista hashes reconhecidos de um jogo. | Ferramentas para emuladores; não é necessário na home. |
| Achievement IDs | Retorna somente os IDs de conquistas de um jogo. | Sincronização enxuta ou cache de IDs. |
| Unlocks Distribution | Informa quantos jogadores desbloquearam cada conquista. | Indicador de raridade/dificuldade. |
| High Scores | Lista placares altos de um jogo. | Painel de placares. |
| Progression | Expõe dados de progressão do jogo. | Destaques de progresso e desafios. |

## Leaderboards

| API oficial | O que faz | Uso no Checkpoint |
| --- | --- | --- |
| Leaderboards (by gameID) | Lista leaderboards disponíveis para um jogo. | Aba de desafios no detalhe do jogo. |
| Entries | Retorna as entradas de um leaderboard. | Ranking e posição do usuário. |
| User Leaderboards (by gameID) | Retorna dados de leaderboard associados a um usuário em um jogo. | “Seu melhor resultado”. |

## Sistemas e catálogo

| API oficial | O que faz | Uso no Checkpoint |
| --- | --- | --- |
| All Systems | Lista consoles/sistemas suportados e seus IDs. | Filtro de plataforma e menus. |
| All Games and Hashes | Retorna o catálogo de jogos e hashes de um sistema. | Indexação/cache de catálogo; não chamar a cada busca. |

## Conquistas e comentários

| API oficial | O que faz | Uso no Checkpoint |
| --- | --- | --- |
| All Unlocks | Lista usuários que desbloquearam uma conquista. | Página de conquista e prova social. |
| Comments | Retorna comentários de um recurso suportado. | Comentários em jogos/conquistas, se essa área for implementada. |

## Feed e comunidade

| API oficial | O que faz | Uso no Checkpoint |
| --- | --- | --- |
| All Recent Game Awards | Exibe desbloqueios/recompensas recentes em jogos. | Feed da comunidade. |
| Active Claims | Lista conjuntos em desenvolvimento ativo. | Descobrir conteúdos em produção. |
| Inactive Claims | Lista claims inativos. | Histórico e transparência de desenvolvimento. |
| Top Ten Ranked Users | Retorna os dez jogadores com maior ranking. | Destaque no ranking global. |

## Eventos

| API oficial | O que faz | Uso no Checkpoint |
| --- | --- | --- |
| Achievement of the Week | Retorna a conquista da semana, jogo, console e dados de desbloqueios. | Card de evento na home. |

## Tickets

| API oficial | O que faz | Uso no Checkpoint |
| --- | --- | --- |
| Get Ticket by ID | Consulta os detalhes de um ticket específico. | Tela individual de ticket. |
| Get Most Ticketed Games | Lista jogos com mais tickets. | Priorizar jogos com problemas reportados. |
| Get Most Recent Tickets | Lista tickets mais recentes. | Feed de tickets. |
| Get Game Ticket Stats | Retorna estatísticas de tickets de um jogo. | Aviso de qualidade no detalhe do jogo. |
| Get Developer Ticket Stats | Retorna estatísticas de tickets de um desenvolvedor. | Perfil de desenvolvedor. |
| Get Achievement Ticket Stats | Retorna estatísticas de tickets de uma conquista. | Sinalizar conquista com problema conhecido. |

## Ordem sugerida de integração

1. **Perfil + jogos recentes:** User Profile e Recently Played Games.
2. **Detalhe do jogo:** Game Extended Details e Game Progress.
3. **Descoberta:** All Systems, Game Summary e Achievement of the Week.
4. **Social:** Unlocks recentes, feed e rankings.
5. **Avançado:** Leaderboards, comentários, tickets e recursos de desenvolvimento.

## Referências oficiais

- [Documentação completa](https://api-docs.retroachievements.org/)
- [Começando e autenticação](https://api-docs.retroachievements.org/getting-started.html)
- [Perfil de usuário](https://api-docs.retroachievements.org/v1/get-user-profile.html)
- [Jogos recentes](https://api-docs.retroachievements.org/v1/get-user-recently-played-games.html)
- [Detalhes estendidos de jogo](https://api-docs.retroachievements.org/v1/get-game-extended.html)
