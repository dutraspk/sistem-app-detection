# Industrial Guardian

Desenvolva um aplicativo moderno e responsivo para celular e computador focado em fiscalização inteligente de uso de EPI (Equipamentos de Proteção Individual) em ambientes industriais, integrado com câmeras e inteligência artificial (YOLOv4).

O aplicativo deve possuir design profissional, industrial e tecnológico, utilizando uma paleta de cores baseada em:

- Azul escuro (#0F172A)

- Azul vibrante (#2563EB)

- Cinza industrial (#1E293B)

- Branco (#F8FAFC)

- Vermelho de alerta (#DC2626)

- Verde de confirmação (#16A34A)

Objetivo do sistema:

Monitorar o uso correto de EPI através de câmeras com IA em áreas de risco, registrar acessos, controlar validade de equipamentos e gerar ocorrências automáticas quando um trabalhador retirar o EPI dentro da área monitorada.

FUNCIONALIDADES PRINCIPAIS:

1. Dashboard Principal

- Exibir estatísticas em tempo real:

  - Trabalhadores ativos na área de risco

  - Número de ocorrências do dia

  - EPIs próximos da validade

  - Câmeras online/offline

- Gráficos modernos mostrando:

  - Ocorrências por dia

  - Setores com mais alertas

  - Uso correto de EPI em porcentagem

- Indicadores em tempo real com atualização automática.

2. Cadastro e Controle de EPIs

Criar uma aba completa para gerenciamento de equipamentos de proteção individual.

Cada EPI deve possuir:

- Nome do equipamento

- Categoria

- Cor do equipamento

- Número RFID

- Data de validade

- Status:

  - Ativo

  - Próximo do vencimento

  - Vencido

- Trabalhador vinculado

- Histórico de uso

Separar os equipamentos por categorias:

- Capacetes

- Luvas

- Botas

- Óculos

- Coletes

- Protetores auriculares

- Máscaras

- Outros

O sistema deve alertar automaticamente quando um EPI estiver próximo do vencimento.

3. Controle de Acesso da Área de Risco

Criar uma aba chamada:

“Acessos à Área de Risco”

Funções:

- Registrar automaticamente:

  - Nome do trabalhador

  - Data

  - Hora

  - Setor

  - Câmera responsável

  - Status da validação da IA

- Mostrar se o acesso foi:

  - Liberado

  - Bloqueado

- Filtros avançados:

  - Dia

  - Semana

  - Mês

  - Funcionário

  - Setor

- Sistema de busca rápida.

4. Monitoramento Inteligente com IA

O aplicativo deve integrar com câmeras usando YOLOv4 para detectar EPIs automaticamente.

Fluxo:

- Câmeras posicionadas entre área segura e área de risco verificam o uso correto dos EPIs.

- Caso esteja correto:

  - Libera acesso

  - Registra entrada no sistema

- Caso esteja incorreto:

  - Bloqueia acesso

  - Gera alerta visual

  - Envia notificação ao administrador

5. Fiscalização Dentro da Área de Risco

Câmeras internas monitoram continuamente os trabalhadores.

Caso um trabalhador retire qualquer EPI:

- Registrar automaticamente uma ocorrência.

- Salvar:

  - Nome do trabalhador

  - EPI removido

  - Data e hora

  - Câmera responsável

  - Imagem/captura do momento

  - Grau de risco

- Enviar notificação em tempo real ao administrador.

- Exibir alerta vermelho no painel principal.

6. Sistema de Ocorrências

Criar uma aba dedicada para ocorrências.

Cada ocorrência deve possuir:

- ID da ocorrência

- Nome do trabalhador

- Tipo da infração

- Nível de gravidade

- Data e hora

- Local

- Status:

  - Aberta

  - Em análise

  - Resolvida

- Opção de excluir ocorrência

- Campo de observações do administrador

Adicionar filtros:

- Por funcionário

- Por gravidade

- Por setor

- Por período

7. Notificações Inteligentes

Sistema completo de notificações push/web:

- Trabalhador sem EPI

- EPI vencido

- Câmera offline

- Tentativa de acesso negada

- Ocorrência registrada

- Alertas críticos em tempo real

8. Gestão de Usuários

Criar níveis de acesso:

- Administrador

- Supervisor

- Segurança do trabalho

- Visualização simples

9. Interface

- Interface moderna estilo sistema industrial premium

- Responsiva para celular e desktop

- Dark mode elegante

- Animações suaves

- Cards modernos

- Tabelas interativas

- Atualização em tempo real

- Ícones industriais e tecnológicos

- Layout limpo e profissional

10. Tecnologias sugeridas

Frontend:

- React

- TailwindCSS

- Framer Motion

- Recharts

Backend:

- Node.js

- Express

Banco:

- PostgreSQL ou Firebase

IA:

- Integração YOLOv4

Extras importantes:

- Sistema em tempo real via WebSocket

- Logs completos

- Histórico de eventos

- Exportação de relatórios PDF/Excel

- Sistema preparado para múltiplas câmeras

- Painel administrativo completo

- Performance otimizada para uso industrial.


O sistema deve ser desenvolvido com arquitetura compatível com:

- Aplicativo Android APK

- Aplicativo Windows Desktop (.exe)

- Aplicação Web responsiva

Utilizar estrutura preparada para conversão via:

- Capacitor para Android

- Electron para Windows

O projeto deve funcionar como:

- PWA

- Aplicativo mobile

- Aplicativo desktop

Garantir:

- Responsividade total

- Notificações push

- Integração com câmera

- Compatibilidade com touch screen

- Interface adaptada para desktop e celular

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://safety-vision-sys.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4d360922-a67f-472c-a735-16cd4efceeef).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
