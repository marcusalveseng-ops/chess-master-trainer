# Proteções do Chess Master Trainer

A página Tess executa xadrez e análise no navegador. O servidor Node do repositório é um modo de hospedagem separado. O HTML da Tess já inclui o motor, o catálogo e o código do aplicativo. Sua política de segurança só aceita o script com o hash gerado no build.

## Operação do servidor Node

- A escuta padrão usa 127.0.0.1. Defina HOST explicitamente quando o ambiente exigir acesso de um proxy ou contêiner. O modo de desenvolvimento sempre usa 127.0.0.1.
- Configure APP_ORIGIN com a origem HTTPS pública, sem barra no fim. O provedor Manus deve aceitar o callback `/api/oauth/callback` nessa origem. Troque o endereço inicial de login no cliente para `/api/oauth/start`.
- Mantenha JWT_SECRET com pelo menos 32 bytes aleatórios no gerenciador de segredos. O login precisa também de OAUTH_PORTAL_URL (ou VITE_OAUTH_PORTAL_URL), OAUTH_SERVER_URL, VITE_APP_ID e DATABASE_URL. A sessão dura oito horas. Atualizar este código exige novo login.
- Aplique a migração `drizzle/0003_revoked_sessions.sql` via histórico do Drizzle antes de ligar o servidor atualizado. Use uma conta de migração e uma credencial de operação com acesso mínimo. Valide a migração e restauração em ambiente de teste antes da produção.
- O login usa um estado de uso único válido por cinco minutos. Estado de login e limites de requisições ficam na memória do processo. Em mais de uma instância, compartilhe o estado e as quotas e valide a identificação de IP no proxy. O callback e o início do login precisam alcançar a mesma instância até essa mudança. A revogação das sessões usa MySQL.
- A IA online exige conta. O limite inicial por processo é de dez chamadas por minuto e 50 por dia por conta, 30 por minuto por IP, 500 por dia no total e quatro solicitações simultâneas. O provedor pode receber novas tentativas quando falhar. Configure também teto de gastos no provedor para proteger contra reinícios e múltiplas instâncias.
- O proxy `/manus-storage/*` devolve 404. Para reativar entregas privadas, crie um registro de propriedade e autorize cada objeto antes de emitir uma URL assinada. Separe o bucket privado de recursos públicos.
- Limite a origem e o acesso ao banco e ao armazenamento no provedor. Revise privilégios, TLS, auditoria, backup e retenção. Faça o teste de isolamento com duas contas e um objeto de teste.
- Guarde o endereço de origem e os parâmetros de OAuth apenas na configuração dos serviços. Exclua códigos de retorno, cookies e detalhes de requisições dos logs. Expire os logs antigos conforme a política de retenção do ambiente.

## Verificação antes de publicar

Execute `pnpm check`, `pnpm test`, `pnpm build` e `pnpm release:tess` com o lockfile. A verificação no GitHub usa Gitleaks, testes de acesso e auditoria do pnpm.

A versão do HTML para publicação está em `dist/tess/release/Chess-Unificado-Tess.html`. Preserve uma cópia da versão servida antes da atualização. Depois de substituir o HTML na página existente, confirme que a Tess preservou a política e o conteúdo do script. Teste bot, biblioteca, análise e importação no endereço público. Uma modificação do JavaScript pela hospedagem invalida o hash da política. Siga o procedimento em [RELEASE_TESS.md](RELEASE_TESS.md).

O login com o provedor real, suporte a PKCE no fluxo WebDev e as permissões do MySQL e do armazenamento precisam de validação no ambiente que efetivamente hospedará a API. O teste local usa um provedor simulado e não aplica a migração em produção.
