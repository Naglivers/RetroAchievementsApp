# Checkpoint

Um cliente **Expo / React Native** para transformar o RetroAchievements em uma experiência de acompanhamento mais simples no celular: saber qual jogo retomar, enxergar o progresso, descobrir desafios e acompanhar a comunidade. Ele funciona em Android, iOS e web a partir da mesma base de código.

> O app não é afiliado ao RetroAchievements. Ele usa a API pública oficial como fonte de dados.

## O que existe nesta primeira versão

- Home otimizada para celular e adaptável para a web.
- Busca por jogos, jogadores e conquistas.
- Área de continuidade para o jogo atual.
- Coleção de jogos e progresso de conquistas.
- Indicador de atividade da comunidade em tempo real.
- Navegação por Início, Explorar, Atividade e Perfil.

Os dados na tela inicial são de demonstração enquanto a conexão de conta ainda não foi implementada.

## Visão do produto

O Checkpoint não emula jogos nem substitui o site oficial. Ele é um painel pessoal para jogadores do RetroAchievements:

| Área | Objetivo | Dados da API |
| --- | --- | --- |
| Início | Exibir o jogo atual, jogos recentes e uma visão rápida do progresso. | Perfil e jogos jogados recentemente |
| Explorar | Encontrar jogos por plataforma e abrir seus detalhes. | Sistemas, catálogo e detalhes do jogo |
| Atividade | Acompanhar desbloqueios, eventos e destaques da comunidade. | Unlocks, feed e achievement da semana |
| Perfil | Mostrar pontos, avatar, presença e histórico do usuário. | Perfil, totais e progresso |

## Tecnologias

- [Expo](https://expo.dev/)
- React Native
- Expo Router
- TypeScript

Um único código atende **Android**, **iOS** e **web**.

## Como executar

### Pré-requisitos

- Node.js 20 ou mais recente
- npm
- Para executar no celular: [Expo Go](https://expo.dev/go)

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
# Abre o menu do Expo e mostra o QR Code
npm start

# Abre a versão web
npm run web

# Abre no Android
npm run android

# Abre no simulador do iOS (requer macOS)
npm run ios
```

No celular, execute `npm start` e escaneie o QR Code com o Expo Go.

## Estrutura

```text
app/
  _layout.tsx    # Configuração de navegação e barra de status
  index.tsx      # Home do Checkpoint
app.json         # Identidade e plataformas do Expo
package.json     # Dependências e comandos
```

## Integração com a API do RetroAchievements

A [API oficial do RetroAchievements](https://api-docs.retroachievements.org/) disponibiliza informações de usuários, jogos, conquistas, rankings, sistemas e eventos. Para qualquer endpoint autenticado, são usados o nome/ULID do usuário e uma Web API Key. A documentação alerta que essa chave deve ser tratada como uma senha e nunca enviada ao repositório. [Guia de início da API](https://api-docs.retroachievements.org/getting-started.html)

Consulte também o [guia em tabela de todos os recursos da API](docs/retroachievements-api.md) para entender onde cada endpoint se encaixa no app.

### Dados planejados por tela

| Necessidade | Recurso da API | Observação |
| --- | --- | --- |
| Cabeçalho do perfil | [User Profile](https://api-docs.retroachievements.org/v1/get-user-profile.html) | Retorna avatar, pontos, presença e último jogo. Depois da primeira busca, guardar o ULID em vez de depender do nome, que pode mudar. |
| “Continue jogando” e coleção | [Recently Played Games](https://api-docs.retroachievements.org/v1/get-user-recently-played-games.html) | Aceita paginação; o máximo é 50 itens por solicitação. |
| Tela de um jogo | [Game Extended Details](https://api-docs.retroachievements.org/v1/get-game-extended.html) | Base para arte, lista de conquistas e detalhes do conjunto. |
| Filtros por console | [All Systems](https://api-docs.retroachievements.org/v1/get-console-ids.html) | Alimenta a lista de plataformas em Explorar. |
| Descoberta e atividade | [Recent Game Awards](https://api-docs.retroachievements.org/v1/get-recent-game-awards.html), desbloqueios e Achievement of the Week | Dados ideais para cache curto e atualização manual. |

### Arquitetura segura

O app Expo não deve chamar a API do RetroAchievements diretamente com a chave do usuário: ela ficaria acessível no bundle web, em logs ou em um dispositivo comprometido. A arquitetura recomendada é:

```text
Expo (Android / iOS / web)
            │ HTTPS + sessão do Checkpoint
            ▼
     Backend do Checkpoint
       ├─ guarda a Web API Key cifrada
       ├─ aplica cache e limites
       └─ chama a API RetroAchievements
            ▼
     retroachievements.org/API
```

O backend recebe a chave uma única vez durante a conexão, armazena-a de forma cifrada e entrega ao Expo apenas os dados já normalizados. A API possui limitação de requisições e recomenda cache, especialmente para dados estáticos de jogos; atualizações devem ser puxadas sob demanda ou em intervalos moderados. [Política de uso da API](https://api-docs.retroachievements.org/)

### Exemplo de rota no backend

O SDK oficial JavaScript/TypeScript pode ser usado no backend. O pacote é `@retroachievements/api`; ele cria uma autorização a partir do usuário e da chave e oferece funções tipadas, como `getUserProfile` e `getUserRecentlyPlayedGames`. [Exemplos oficiais](https://api-docs.retroachievements.org/getting-started.html)

```ts
import {
  buildAuthorization,
  getUserProfile,
  getUserRecentlyPlayedGames,
} from '@retroachievements/api';

export async function getHome(username: string, webApiKey: string) {
  const authorization = buildAuthorization({ username, webApiKey });
  const [profile, recentlyPlayed] = await Promise.all([
    getUserProfile(authorization, { username }),
    getUserRecentlyPlayedGames(authorization, { username, count: 10 }),
  ]);

  return { profile, recentlyPlayed };
}
```

No Expo, a tela consome uma rota própria — por exemplo, `GET /v1/me/home` — e nunca recebe nem armazena a Web API Key.

### Variáveis de ambiente do backend

```bash
# Nunca use este valor no app Expo ou em EXPO_PUBLIC_*
RETROACHIEVEMENTS_WEB_API_KEY=chave-secreta-do-usuario
```

Para vários usuários, a chave deve ser associada à conta no banco de dados, e não compartilhada como uma variável global.

## Próximas telas

- Autenticação e conexão de perfil.
- Catálogo com filtros por plataforma.
- Página de detalhes do jogo e lista de conquistas.
- Histórico de desbloqueios.
- Perfil, ranking e amigos.

## Licença

Projeto em desenvolvimento privado.
