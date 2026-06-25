import { Chess } from 'chess.js';

// Test 3 simple but valid games
const games = [
  {
    name: 'Game 1: Simple Opening Study - Sicilian Defense',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Be3', 'e5', 'Nb3', 'Be6', 'f3', 'Be7', 'Qd2', 'O-O', 'O-O-O', 'Nbd7'],
  },
  {
    name: 'Game 2: Italian Game - Positional Play',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4', 'exd4', 'cxd4', 'Bb4+', 'Bd2', 'Bxd2+', 'Nbxd2', 'd5', 'exd5', 'Qxd5', 'Qxd5', 'Nxd5', 'O-O', 'O-O', 'Re1', 'Bg4', 'h3', 'Bh5', 'Nxe5'],
  },
  {
    name: 'Game 3: French Defense - Tactical Sequence',
    moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e5', 'Nfd7', 'Bxe7', 'Qxe7', 'f4', 'O-O', 'Nf3', 'c5', 'O-O', 'cxd4', 'Nxd4', 'Nc6', 'Nxc6', 'bxc6', 'a4', 'Bb7', 'Bd3', 'Rfc8', 'Qe2', 'c5', 'Nxe6'],
  },
];

console.log('🎯 Chess Master Trainer - Teste de 3 Partidas Simplificadas\n');
console.log('='.repeat(80));

let successCount = 0;

games.forEach((game, index) => {
  console.log(`\n📋 ${game.name}`);
  console.log('-'.repeat(80));

  try {
    const chess = new Chess();
    
    // Apply all moves
    game.moves.forEach((move, moveIndex) => {
      const result = chess.move(move, { sloppy: true });
      if (!result) {
        throw new Error(`Invalid move: ${move} at position ${moveIndex + 1}`);
      }
    });

    const totalMoves = game.moves.length;
    
    console.log(`✓ PGN processado com sucesso`);
    console.log(`✓ Total de lances: ${totalMoves}`);
    console.log(`✓ Posição final: ${chess.fen().substring(0, 50)}...`);

    // Analyze the game
    console.log(`\n📊 Análise da Partida:`);
    console.log(`  • Número de lances: ${totalMoves}`);
    
    const openingEnd = Math.min(12, Math.floor(totalMoves / 3));
    const middlegameEnd = Math.floor(2 * totalMoves / 3);
    
    console.log(`  • Fases: Abertura (1-${openingEnd}), Meio-jogo (${openingEnd + 1}-${middlegameEnd}), Final (${middlegameEnd + 1}-${totalMoves})`);
    
    // Analyze key positions
    console.log(`\n📍 Posições-chave:`);
    
    const keyMoveNumbers = [10, Math.floor(totalMoves / 2), totalMoves];
    
    keyMoveNumbers.forEach(moveNum => {
      if (moveNum <= totalMoves) {
        const chess2 = new Chess();
        
        // Apply moves up to this point
        for (let i = 0; i < moveNum && i < game.moves.length; i++) {
          chess2.move(game.moves[i], { sloppy: true });
        }
        
        // Calculate material balance
        const board = chess2.board();
        let whiteValue = 0, blackValue = 0;
        const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 };
        
        board.forEach(rank => {
          rank.forEach(piece => {
            if (piece) {
              const value = pieceValues[piece.type] || 0;
              if (piece.color === 'w') whiteValue += value;
              else blackValue += value;
            }
          });
        });
        
        const diff = whiteValue - blackValue;
        const balance = diff > 0 ? `Brancas +${diff}` : diff < 0 ? `Pretas +${-diff}` : 'Equilibrado';
        const turn = chess2.turn() === 'w' ? 'Vez das Brancas' : 'Vez das Pretas';
        
        console.log(`  Lance ${moveNum}: ${balance} (W:${whiteValue} vs P:${blackValue}) - ${turn}`);
      }
    });

    console.log(`\n✅ Partida ${index + 1} analisada com sucesso!`);
    successCount++;

  } catch (error) {
    console.error(`❌ Erro ao processar partida ${index + 1}:`, error.message);
  }

  console.log('');
});

console.log('='.repeat(80));
console.log(`\n✨ Teste completo! ${successCount}/3 partidas foram analisadas com sucesso.\n`);

if (successCount === 3) {
  console.log('📈 Resumo das Partidas Testadas:');
  console.log('  1. Sicilian Defense (Abertura Najdorf) - 20 lances');
  console.log('  2. Italian Game (Giuoco Piano) - 27 lances');
  console.log('  3. French Defense (Winawer) - 29 lances\n');
  
  console.log('🎯 Funcionalidades Demonstradas:');
  console.log('  ✓ Parsing de lances em notação algébrica');
  console.log('  ✓ Validação de movimentos legais');
  console.log('  ✓ Cálculo de balanço material');
  console.log('  ✓ Análise de posições-chave');
  console.log('  ✓ Navegação por lances');
  console.log('  ✓ Detecção de turno (Brancas/Pretas)\n');
  
  console.log('🔧 Como usar no Chess Master Trainer:');
  console.log('  1. Vá para a página "Play & Analyze"');
  console.log('  2. Cole uma das partidas acima no campo "Load PGN"');
  console.log('  3. Use os botões de navegação para revisar cada lance');
  console.log('  4. O painel de análise estratégica fornecerá dicas contextuais');
  console.log('  5. Salve a partida com anotações pessoais\n');
}
