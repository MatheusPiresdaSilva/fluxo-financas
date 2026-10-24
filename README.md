# 💎 Fluxo 2.0 — Finanças Pessoais

Um app de finanças pessoais bonito, escuro e 100% pensado para o celular. Vai muito além de anotar gastos.

- **🌐 Usar no navegador:** https://matheuspiresdasilva.github.io/fluxo-financas/
- **📱 Baixar o app Android:** https://matheuspiresdasilva.github.io/fluxo-financas/baixar

## ✨ Funcionalidades

### Dia a dia
- **Lançar em 2 toques** — botão **+**, teclado numérico próprio, categorias com ícones e **sugestões** dos gastos que você mais repete
- **Assinaturas e contas fixas** — Netflix, aluguel, salário… cadastre uma vez e o Fluxo **lança sozinho** todo mês, semana ou ano (dá para pausar)
- **Compras parceladas** — lance o valor total em até 24x e cada parcela aparece no mês certo
- **Várias contas** — Carteira, Nubank, Poupança… cada uma com seu saldo, e **transferências** entre elas
- **Agendar** — lance movimentações com data futura
- **Extrato** — busca, filtros por tipo, conta e dia; toque para editar e **arraste para a esquerda para excluir** (com "Desfazer")

### Planejamento
- **Previsão do saldo** no fim do mês, contando as contas fixas que ainda vão cair
- **Próximas cobranças** dos próximos 10 dias na tela inicial
- **Metas** com prazo: o app calcula quanto guardar por mês
- **Limites por categoria** com alerta de cor
- **Empréstimos** — quem te deve e para quem você deve, com pagamentos parciais

### Análise
- **Resumo do mês em stories** ✨ — seu mês contado em telas animadas
- **Regra 50/30/20** — necessidades, desejos e quanto você guardou
- **Calendário de gastos** — veja os dias mais caros e toque para ver o extrato do dia
- Gráficos por categoria e dos últimos 6 meses, e dicas automáticas

### Do seu jeito
- **Conquistas e sequência de dias** 🔥 — 16 medalhas para desbloquear
- **Categorias personalizadas**, **5 cores** para o app e **esconder valores**
- **Bloqueio com PIN** de 4 dígitos
- **Lembrete diário** com notificação (app Android)
- **Backup** em arquivo e **exportação para Excel** (CSV)

Seus dados ficam **só no seu aparelho**. Nada é enviado para servidor nenhum.

## 📱 Instalar no Android

1. Abra https://matheuspiresdasilva.github.io/fluxo-financas/baixar **no Chrome do celular** (não dentro do WhatsApp/Instagram)
2. Toque em **Baixar o app (APK)**; se o Chrome avisar sobre o tipo de arquivo, toque em **Baixar mesmo assim**
3. Abra o arquivo baixado e permita a instalação de apps desta fonte, se o Android pedir
4. Pronto! O Fluxo aparece na sua tela de apps e funciona **sem internet**

As novas versões instalam por cima da anterior, sem perder seus dados.

## 🛠️ Como funciona

- App web em HTML, CSS e JavaScript puro, com [Chart.js](https://www.chartjs.org/) e fontes embutidas (funciona offline)
- `android/` — app nativo leve (WebView) que carrega o Fluxo embutido, com botão voltar, vibração, lembrete diário e salvamento de arquivos
- `.github/workflows/android.yml` — a cada push na `main`, o GitHub Actions compila e assina o APK e publica em **Releases** e no site (junto com o `Fluxo.apk`)
