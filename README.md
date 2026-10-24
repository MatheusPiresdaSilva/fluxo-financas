# 💎 Fluxo — Finanças Pessoais

Um app de finanças pessoais simples, bonito e 100% pensado para o celular, com visual escuro.

- **🌐 Usar no navegador:** https://matheuspiresdasilva.github.io/fluxo-financas/
- **📱 Baixar o app Android (APK):** https://github.com/MatheusPiresdaSilva/fluxo-financas/releases/latest/download/Fluxo.apk

## ✨ Funcionalidades

- **Início** — saldo, quanto entrou e saiu no mês, atalhos rápidos, dica inteligente sobre seus gastos, maiores gastos, últimas movimentações e metas
- **Adicionar em 2 toques** — botão **+**, teclado numérico próprio (estilo app de banco), categorias com ícones e datas rápidas (Hoje/Ontem)
- **Extrato** — busca, filtro por entradas/saídas, toque para editar e **arraste para a esquerda para excluir** (com "Desfazer")
- **Análise** — resultado do mês, % guardado, gráfico de categorias (toque numa categoria para ver as movimentações) e os últimos 6 meses
- **Limites** — defina quanto quer gastar no máximo por categoria; a barra muda de cor quando chega perto ou passa do limite
- **Metas** — guarde ou retire dinheiro, acompanhe o progresso e comemore com confete 🎉
- **Privacidade** — botão de olho para esconder os valores; os dados ficam **só no seu aparelho**
- **Backup** — salve e restaure seus dados em um arquivo

Dica: na tela inicial e no extrato, deslize para os lados para trocar de mês.

## 📱 Instalar no Android

1. Abra o link do APK acima no celular e baixe o `Fluxo.apk`
2. Toque no arquivo baixado e permita a instalação de apps desta fonte, se o Android pedir
3. Pronto! O Fluxo aparece na sua tela de apps e funciona **sem internet**

As novas versões instalam por cima da anterior, sem perder seus dados.

## 🛠️ Como funciona

- App web em HTML, CSS e JavaScript puro, com [Chart.js](https://www.chartjs.org/) e fontes embutidas (funciona offline)
- `android/` — app nativo leve (WebView) que carrega o Fluxo embutido, com botão voltar, vibração e backup em arquivo
- `.github/workflows/android.yml` — a cada push na `main`, o GitHub Actions compila e assina o APK e publica em **Releases**
