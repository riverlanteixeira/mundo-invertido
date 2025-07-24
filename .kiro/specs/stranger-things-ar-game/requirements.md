# Documento de Requisitos

## Introdução

Este documento descreve os requisitos para um jogo de realidade aumentada baseado na série Stranger Things, desenvolvido para dispositivos móveis Samsung S20 FE. O jogo utiliza geolocalização para ativar missões em locais específicos do bairro Pedra Branca, incorporando elementos de AR, sensores do dispositivo e será hospedado no GitHub Pages como uma Progressive Web App.

## Requisitos

### Requisito 1 - Interface Inicial e Hospedagem

**História do Usuário:** Como jogador, eu quero acessar o jogo através de uma página web hospedada no GitHub Pages, para que eu possa jogar diretamente no meu navegador móvel.

#### Critérios de Aceitação

1. QUANDO o usuário acessa a URL do GitHub Pages ENTÃO o sistema DEVE exibir uma página inicial com o logo da série Stranger Things usando a fonte "fonts/stranger-things.ttf"
2. QUANDO a página inicial carrega ENTÃO o sistema DEVE exibir um botão "Iniciar Jogo" abaixo do logo
3. QUANDO o usuário clica no botão "Iniciar Jogo" ENTÃO o sistema DEVE carregar todos os arquivos necessários para funcionamento offline
4. QUANDO todos os arquivos são carregados ENTÃO o sistema DEVE iniciar a primeira sequência do jogo
5. O sistema DEVE ser responsivo e funcionar adequadamente em dispositivos móveis Samsung S20 FE na orientação retrato
6. O sistema DEVE funcionar offline após o carregamento inicial completo

### Requisito 2 - Sistema de Ligação e Áudio

**História do Usuário:** Como jogador, eu quero receber ligações do personagem Dustin com instruções de missão, para que eu possa entender o contexto e objetivos do jogo.

#### Critérios de Aceitação

1. QUANDO o jogo inicia ENTÃO o sistema DEVE exibir uma simulação de ligação com a imagem "assets/img/dustin-call.png"
2. QUANDO o usuário clica na imagem da ligação ENTÃO o sistema DEVE reproduzir o áudio "sounds/call/dustin-intro.wav"
3. QUANDO o áudio termina de tocar ENTÃO o sistema DEVE ativar a câmera do dispositivo
4. O sistema DEVE suportar reprodução de múltiplos arquivos de áudio em diferentes momentos do jogo
5. QUANDO uma nova ligação é recebida ENTÃO o sistema DEVE pausar outras atividades e exibir a interface de ligação

### Requisito 3 - Sistema de Navegação e Geolocalização

**História do Usuário:** Como jogador, eu quero ser guiado até locais específicos usando uma seta direcional e bússola, para que eu possa encontrar os pontos de missão no mundo real.

#### Critérios de Aceitação

1. QUANDO a câmera é ativada ENTÃO o sistema DEVE solicitar permissão de geolocalização
2. QUANDO a geolocalização é obtida ENTÃO o sistema DEVE calcular a direção para o próximo objetivo
3. QUANDO há um objetivo ativo ENTÃO o sistema DEVE exibir uma seta direcional criada com HTML/CSS ou SVG indicando a direção
4. QUANDO o jogador está a mais de 20 metros do objetivo ENTÃO o sistema DEVE manter a seta visível
5. QUANDO o jogador chega a 20 metros ou menos do objetivo ENTÃO o sistema DEVE fazer o dispositivo vibrar duas vezes e ocultar a seta
6. O sistema DEVE atualizar a direção da seta em tempo real conforme o jogador se move
7. A seta DEVE ser implementada sem necessidade de imagens externas, usando apenas código

### Requisito 4 - Missão 1: Floresta das Trevas

**História do Usuário:** Como jogador, eu quero encontrar a bicicleta do Will na Floresta das Trevas usando realidade aumentada, para que eu possa coletar a primeira pista.

#### Critérios de Aceitação

1. QUANDO o jogador chega na localização (-27.63054776462635, -48.681133649550205) ENTÃO o sistema DEVE ativar o modo AR
2. QUANDO o modo AR está ativo ENTÃO o sistema DEVE exibir o modelo 3D "assets/models/bicicleta-will.glb" no chão
3. QUANDO o jogador clica no modelo 3D da bicicleta ENTÃO o sistema DEVE coletar a pista e marcar a missão como completa
4. QUANDO a missão é completa ENTÃO o sistema DEVE reproduzir "sounds/call/dustin-missao-1-completa.wav"
5. QUANDO o áudio termina ENTÃO o sistema DEVE ativar a navegação para a próxima missão

### Requisito 5 - Missão 2: Casa do Will

**História do Usuário:** Como jogador, eu quero usar rastreamento de imagem para encontrar pistas na casa do Will, para que eu possa descobrir sinais do Demogorgon.

#### Critérios de Aceitação

1. QUANDO o jogador chega na localização (-27.630903061716687, -48.67974685847095) ENTÃO o sistema DEVE ativar o rastreamento de imagem
2. QUANDO a câmera detecta a imagem "assets/img/the-big-bang-theory.jpg" ENTÃO o sistema DEVE exibir o gif "assets/gif/luzes-piscando.gif" sobre a imagem
3. QUANDO o gif aparece ENTÃO o sistema DEVE aguardar 10 segundos antes de reproduzir "sounds/call/dustin-missao-2-completa.wav"
4. QUANDO o áudio termina ENTÃO o sistema DEVE ativar a navegação para fugir do Demogorgon

### Requisito 6 - Missão 3: Fuga do Demogorgon

**História do Usuário:** Como jogador, eu quero fugir do Demogorgon seguindo as instruções de navegação, para que eu possa escapar do perigo.

#### Critérios de Aceitação

1. QUANDO a missão 2 é completa ENTÃO o sistema DEVE ativar navegação para (-27.630111492213196, -48.67959126452254)
2. QUANDO o jogador chega no local de fuga ENTÃO o sistema DEVE reproduzir "sounds/call/dustin-missao-3-completa.wav"
3. QUANDO o áudio termina ENTÃO o sistema DEVE ativar navegação para a loja Melvald's

### Requisito 7 - Missão 4: Loja Melvald's General Store

**História do Usuário:** Como jogador, eu quero coletar suprimentos (taco e gasolina) na loja usando AR, para que eu possa me preparar para lutar contra o Demogorgon.

#### Critérios de Aceitação

1. QUANDO o jogador chega na localização (-27.62568754766323, -48.679824079211336) ENTÃO o sistema DEVE ativar o modo AR para coleta
2. QUANDO o modo AR está ativo ENTÃO o sistema DEVE exibir os objetos "assets/img/taco.png" e "assets/img/gasolina.png" no chão
3. QUANDO o jogador clica em cada objeto ENTÃO o sistema DEVE coletar o item e adicioná-lo ao inventário
4. QUANDO ambos os objetos são coletados ENTÃO o sistema DEVE reproduzir "sounds/call/dustin-missao-4-completa.wav"
5. O sistema DEVE manter registro dos itens coletados para uso posterior

### Requisito 8 - Missão 5: Laboratório Nacional de Hawkins

**História do Usuário:** Como jogador, eu quero encontrar a entrada para o mundo invertido no laboratório, para que eu possa acessar a dimensão alternativa.

#### Critérios de Aceitação

1. QUANDO o jogador chega na localização (-27.624056768580015, -48.68124296486716) ENTÃO o sistema DEVE ativar rastreamento de imagem
2. QUANDO a câmera detecta "assets/img/bloco-h.jpg" ENTÃO o sistema DEVE exibir "assets/gif/portal.gif" sobre a imagem
3. QUANDO o jogador clica no portal ENTÃO o sistema DEVE ativar o modo "mundo invertido"
4. QUANDO o modo mundo invertido está ativo ENTÃO o sistema DEVE aplicar filtro esverdeado à câmera e exibir partículas flutuantes
5. O filtro esverdeado e partículas DEVEM permanecer ativos em todas as missões subsequentes até o final do jogo
6. QUANDO a transformação é completa ENTÃO o sistema DEVE reproduzir "sounds/call/dustin-missao-5-completa.wav"

### Requisito 9 - Missão 6: Encontro com o Demogorgon

**História do Usuário:** Como jogador, eu quero enfrentar o Demogorgon usando os itens coletados, para que eu possa derrotá-lo e continuar a missão.

#### Critérios de Aceitação

1. QUANDO o jogador chega na localização (-27.630116851676945, -48.67954178126999) ENTÃO o sistema DEVE fazer o dispositivo vibrar e reproduzir "sounds/call/dustin-missao-6-completa.wav"
2. QUANDO o áudio termina ENTÃO o sistema DEVE exibir o Demogorgon através da câmera AR
3. QUANDO o Demogorgon aparece ENTÃO o sistema DEVE exibir a imagem do taco na tela
4. QUANDO o jogador clica no taco ENTÃO o sistema DEVE simular o ataque e após 3 segundos exibir a imagem da gasolina
5. QUANDO o jogador clica na gasolina ENTÃO o sistema DEVE fazer o Demogorgon desaparecer e reproduzir "sounds/call/dustin-missao-7-completa.wav"

### Requisito 10 - Missão Final: Resgate do Will

**História do Usuário:** Como jogador, eu quero resgatar o Will na casa dele usando rastreamento de imagem, para que eu possa completar o jogo.

#### Critérios de Aceitação

1. QUANDO o jogador chega na casa do Will ENTÃO o sistema DEVE ativar rastreamento de imagem
2. QUANDO a câmera detecta a imagem marcador ENTÃO o sistema DEVE exibir o modelo 3D "src/models/castle_byers.glb"
3. QUANDO o modelo aparece ENTÃO o sistema DEVE reproduzir "sounds/call/dustin-missao-8-completa.wav"
4. QUANDO o áudio final termina ENTÃO o sistema DEVE exibir tela de conclusão do jogo

### Requisito 11 - Compatibilidade e Performance

**História do Usuário:** Como jogador usando Samsung S20 FE, eu quero que o jogo funcione suavemente no meu dispositivo, para que eu tenha uma experiência de jogo fluida.

#### Critérios de Aceitação

1. O sistema DEVE ser compatível com navegadores móveis do Samsung S20 FE
2. O sistema DEVE utilizar WebXR ou bibliotecas AR compatíveis com navegadores móveis
3. QUANDO recursos intensivos são usados ENTÃO o sistema DEVE otimizar performance para manter 30+ FPS
4. O sistema DEVE funcionar offline após carregamento inicial quando possível
5. QUANDO há erro de conectividade ENTÃO o sistema DEVE exibir mensagens de erro apropriadas

### Requisito 12 - Gerenciamento de Permissões

**História do Usuário:** Como jogador, eu quero que o jogo solicite apenas as permissões necessárias de forma clara, para que eu possa autorizar o acesso aos recursos do dispositivo.

#### Critérios de Aceitação

1. QUANDO o jogo inicia ENTÃO o sistema DEVE solicitar permissão para câmera
2. QUANDO a navegação é ativada ENTÃO o sistema DEVE solicitar permissão para geolocalização
3. QUANDO vibração é necessária ENTÃO o sistema DEVE solicitar permissão para vibração
4. SE alguma permissão é negada ENTÃO o sistema DEVE exibir instruções para habilitar manualmente
5. O sistema DEVE funcionar com funcionalidade reduzida se permissões opcionais forem negadas