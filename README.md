# MONARCH Private Finance — v1.2 (Supabase)

Aplicativo pessoal mobile-first em React + Vite, com receitas, despesas, contas recorrentes, metas e sincronização opcional por Supabase. Visual dark/chrome da versão 1.1 mantido.

## Instalação (Windows / VS Code)

1. Extraia este ZIP; abra a pasta `monarch-finance` no VS Code.
2. Execute `npm install`.
3. **ANTES DE CONFIGURAR A NUVEM, EXPORTe UM BACKUP JSON NO APP ANTIGO**, especialmente no iPhone instalado como app. O PWA do iPhone pode ter armazenamento separado do Safari.
4. Crie um **projeto novo** no [Supabase](https://supabase.com/dashboard) (sugestão: `monarch-private`). Não reutilize um projeto de clientes.
5. No Supabase: **SQL Editor > New query**. Cole e execute o conteúdo de `supabase/MONARCH_SETUP.sql` (somente uma vez).
6. No Supabase, obtenha os dados em **Project Settings > API Keys** ou no painel **Connect**:
   - Project URL, ex.: `https://abcxyz.supabase.co`
   - **Publishable key** (`sb_publishable_...`) ou `anon` pública (legada).
   - **NÃO use** `service_role`, `sb_secret` ou senhas nessa configuração.
7. Copie `.env.example` como `.env.local`, no mesmo nível de `package.json`, e substitua pelos seus valores:

   ```env
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_SUA_CHAVE_PUBLICA
   ```

8. Execute `npm run dev -- --host 0.0.0.0` (acesso no iPhone pela rede local) ou `npm run build` para compilar. Reinicie o Vite **depois de alterar `.env.local`**.
9. Faça login ou crie conta. Se a confirmação por e-mail estiver habilitada, confirme o e-mail antes de entrar.
10. Se já tinha dados na versão antiga, entre em **Mais > Configurações > Importar backup** e selecione o JSON que exportou. Se estiver no *mesmo armazenamento* antigo, use o botão **Importar meus dados** exibido na tela. Aguarde **Dados sincronizados**.

## Configurações de login (especialmente depois de publicar na Vercel)

No Supabase, em **Authentication > URL Configuration**, defina o **Site URL** como o endereço real onde publicou, ex.: `https://monarch-exemplo.vercel.app`, e adicione a mesma URL à lista de **Redirect URLs**. Para testes no PC/celular, adicione URLs de teste quando o painel exigir.

Se usar **e-mail de confirmação**, verifique a caixa de entrada/spam. O cadastro não libera acesso antes da confirmação quando esse recurso está ativo.

## Publicar na Vercel

- Importe a pasta `monarch-finance` como projeto Vite.
- Em **Settings > Environment Variables**, configure as mesmas 2 variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (apenas chave pública). Faça novo deploy para incorporá-las no JavaScript compilado.
- Atualize **Authentication > URL Configuration** do Supabase com o domínio final.
- Abra o site HTTPS no Safari e use **Compartilhar > Adicionar à Tela de Início**.
- Os dados da conta serão os mesmos no PC e no celular depois de entrar com o **mesmo e-mail**.

## Como a sincronização funciona

- Cada usuário tem seu próprio documento financeiro em `public.finance_documents`.
- O acesso é protegido por autenticação e **Row Level Security (RLS)**. O aplicativo usa apenas a chave pública.
- Mudanças locais sincronizam automaticamente quando há internet. O app mostra **salvando**, **sincronizado** ou **falha**.
- Alterações ainda não sincronizadas ficam como **rascunho local neste aparelho** para tentar novamente. Por segurança, faça backup regularmente.
- Dois aparelhos não sobrescrevem um ao outro silenciosamente: existe verificação de **versão do documento** e aviso de conflito. O usuário escolhe qual versão manter. Este MVP **não combina automaticamente edições simultâneas**.
- Em primeiro acesso, seus lançamentos locais NÃO são enviados automaticamente. A importação é explícita.
- Se `.env.local` não estiver configurado, o app permanece no **modo local** compatível com v1.1.
- Os dados podem ser exportados/importados em arquivo JSON a qualquer momento.
- Não há integração bancária nem transferência automática de dinheiro.

## Comandos úteis

```powershell
npm install
npm run dev -- --host 0.0.0.0
npm run build
```

## Segurança e cuidados

- **Nunca compartilhe** sua senha, chaves secretas do Supabase ou token de acesso.
- A chave publishable/anon é feita para o frontend; a proteção depende da RLS criada pelo SQL.
- Os registros também podem ficar em rascunho no armazenamento local do navegador; use um aparelho de confiança.
- Não limpe os dados do PWA antes de **exportar um backup** e confirmar a sincronização.
- Em caso de falha de conexão ou conflito, espere resolver o aviso antes de abrir a mesma conta em outro aparelho.
