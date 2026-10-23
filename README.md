# RallyNaVila — Sistema de Vôlei Comunitário

> **"Organize a turma. Monte os times. Jogue."**

O **RallyNaVila** é um aplicativo para organização e gestão de partidas de vôlei em comunidades esportivas locais.

---

## 🚀 Tecnologias Utilizadas

- **React 19**
- **TypeScript 5**
- **Tailwind CSS v4**
- **React Router DOM v7**
- **Firebase Auth & Firestore** (SDK Web v11)
- **Lucide React** (Ícones esportivos)
- **Vite**

---

## 📱 Estrutura de Rotas

| Rota | Acesso | Descrição |
| :--- | :--- | :--- |
| `/` | Público | **Apresentação:** Tela inicial pública de apresentação com atalhos e recursos. |
| `/entrar` | Público Apenas | **Login:** Autenticação por nome de usuário e senha. |
| `/cadastro` | Público Apenas | **Cadastro:** Registro direto com verificação de disponibilidade de username. |
| `/inicio` | Protegido | **Início:** Painel do jogador com perfil real e atalho para Central Administrativa (Owner/Admin). |
| `/admin` | Owner / Admin | **Central Administrativa:** Gestão da comunidade, busca de jogadores e promoção de administradores (Owner). |
| `/jogos` | Protegido | **Jogos:** Próximos jogos agendados e histórico de partidas. |
| `/placar` | Protegido | **Placar:** Visualização do placar ao vivo dos sets. |
| `/regras` | Protegido | **Regras:** Livro de regras da comunidade com busca e categorias. |
| `/perfil` | Protegido | **Perfil:** Perfil do jogador autenticado com estatísticas e logout real. |
| `*` | Público | **Página Não Encontrada (404):** Tratamento de rotas inexistentes. |

---

## 📦 Concluído no Dia 3

- ✅ **Novo Ícone Literal de Vôlei (`BrandMark`):** Design vetorial original com bola de vôlei predominantemente branca, gomos e contornos em azul-marinho, detalhe em vermelho, passando sobre a rede de vôlei em azul-marinho com linhas curtas de trajetória ascendente.
- ✅ **Favicon SVG Literal:** Atualizado no `index.html`.
- ✅ **Atribuição do Primeiro Owner (`Euriko`):** Mapeamento e atribuição segura da role `owner` para a conta `Euriko` sem hardcode em componentes do frontend ou regras do bundle cliente.
- ✅ **Central Administrativa (`/admin`):** Rota autenticada protegida para `owner` e `admin`, bloqueando `player` e redirecionando para `/inicio` com mensagem explicativa em português.
- ✅ **Gerenciamento de Administradores:** Interface exclusiva do `owner` para pesquisa debounced de jogadores no Firestore e atribuição/remoção de função de administrador (`player` ↔ `admin`) com confirmação em modal.
- ✅ **Preservação Total de Contas e Dados:** Nenhuma conta recriada, UUIDs e senhas preservadas, cadastro público mantido criando exclusivamente novos `player`s.
