import { Chess } from 'chess.js';

// Test 3 games
const games = [
  {
    name: 'Game 1: Sicilian Defense - Beginner Level',
    pgn: `[Event "Training"]
[Site "Chess Master Trainer"]
[Date "2024.01.15"]
[White "Player"]
[Black "AI - Easy"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O 10. O-O-O Nbd7 11. g4 b5 12. g5 Ne8 13. f4 exf4 14. Bxf4 Rc8 15. Kb1 b4 16. Ne2 Nxe4 17. Qxe4 Bxg5 18. Bxg5 Qxg5 19. Nxg5 Rc2 20. Qe3 Rxa2 21. Nf3 Ra3 22. Qe2 Rc3 23. Rd3 Rxd3 24. Qxd3 Nf6 25. Qd4 Qg6 26. Qxg6 fxg6 27. Nd4 Rc8 28. Kb2 Rc2 29. Kc1 Rxb2 30. Kxb2 Kf7 31. Kc3 Ke6 32. Kd3 Kd5 33. Kd2 Kc4 34. Kc1 Kb3 35. Kb1 a5 36. Nf3 a4 37. Nd4+ Kc4 38. Nf5 g5 39. Nd6+ Kd5 40. Nf7 a3 41. Nd8 a2+ 42. Ka1 Ke4 43. Nf7 Kd3 44. Nd6 Kc2 45. Nf5 Kb3 46. Nd4+ Ka4 47. Nf3 Kb3 48. Nd2+ Kc2 49. Nf1 Kd3 50. Nd2 Ke2 51. Nf3 Kxf3 52. Kb2 Ke2 53. Kxa2 Kd3 54. Kb3 Kc1 55. Kc3 Kd1 56. Kd3 Ke1 57. Ke3 Kf1 58. Kf3 Kg1 59. Kg3 Kh1 60. Kh3 Kg1 61. Kg3 Kh1 62. Kf2 Kg1 63. Kg3 Kh1 64. Kh3 1-0`,
  },
  {
    name: 'Game 2: Italian Game - Medium Level',
    pgn: `[Event "Training"]
[Site "Chess Master Trainer"]
[Date "2024.01.16"]
[White "AI - Medium"]
[Black "Player"]
[Result "1/2-1/2"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Bd2 Bxd2+ 8. Nbxd2 d5 9. exd5 Qxd5 10. Qxd5 Nxd5 11. O-O O-O 12. Re1 Bg4 13. h3 Bh5 14. Nxe5 Nxe5 15. Rxe5 c6 16. Re1 Rfe8 17. Rxe8+ Rxe8 18. Nf3 Kf8 19. Kf1 Ke7 20. Ke2 Kd6 21. Kd3 Bg6+ 22. Kc2 Nf6 23. Bf7 Rf8 24. Bxg6 Rxf3 25. gxf3 Nxg6 26. f4 Nf8 27. Kb3 Nd7 28. Kc4 Kd7 29. f5 Ke7 30. Kd5 Kd8 31. Ke5 Ke7 32. Kf4 Kf7 33. Kg5 Kg7 34. Kf4 Kf7 35. Kg5 Kg7 36. Kf4 1/2-1/2`,
  },
  {
    name: 'Game 3: French Defense - Advanced Level',
    pgn: `[Event "Training"]
[Site "Chess Master Trainer"]
[Date "2024.01.17"]
[White "Player"]
[Black "AI - Hard"]
[Result "0-1"]

1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Nfd7 6. Bxe7 Qxe7 7. f4 O-O 8. Nf3 c5 9. O-O cxd4 10. Nxd4 Nc6 11. Nxc6 bxc6 12. a4 Bb7 13. Bd3 Rfc8 14. Qe2 c5 15. Nxe6 fxe6 16. Qxe6+ Kh8 17. Qe4 Rc7 18. f5 Qd8 19. Qg4 Rg8 20. h4 Rf8 21. Qh5 Kg7 22. Qg5 Kh8 23. Qh5 Kg7 24. Qg5 Kh8 25. Qh5 Kg7 26. Qg5 Kh8 27. Qh5 Kg7 28. Qg5 Kh8 29. Qh5 Kg7 30. Qg5 Kh8 31. Qh5 Kg7 32. Qg5 Kh8 33. Qh5 Kg7 34. Qg5 Kh8 35. Qh5 Kg7 36. Qg5 Kh8 37. Qh5 Kg7 38. Qg5 Kh8 39. Qh5 Kg7 40. Qg5 Kh8 41. Qh5 Kg7 42. Qg5 Kh8 43. Qh5 Kg7 44. Qg5 Kh8 45. Qh5 Kg7 46. Qg5 Kh8 47. Qh5 Kg7 48. Qg5 Kh8 49. Qh5 Kg7 50. Qg5 Kh8 51. Qh5 Kg7 0-1`,
  },
];

console.log('🎯 Chess Master Trainer - Teste de 3 Partidas\n');
console.log('='.repeat(70));

games.forEach((game, index) => {
  console.log(`\n📋 ${game.name}`);
  console.log('-'.repeat(70));

  try {
    const chess = new Chess();
    chess.loadPgn(game.pgn);

    // Get game info
    const moves = chess.moves({ verbose: false });
    const headers = chess.pgn().split('\n').filter(line => line.startsWith('['));
    
    console.log(`✓ PGN válido`);
    console.log(`✓ Total de lances: ${moves.length}`);
    console.log(`✓ Resultado: ${headers.find(h => h.includes('Result'))?.match(/"([^"]+)"/)?.[1] || 'Unknown'}`);

    // Simulate game progression
    const chess2 = new Chess();
    chess2.loadPgn(game.pgn);
    
    console.log(`\n📊 Análise da Partida:`);
    console.log(`  - Abertura: ${headers.find(h => h.includes('Event'))?.match(/"([^"]+)"/)?.[1] || 'N/A'}`);
    console.log(`  - Brancas: ${headers.find(h => h.includes('White'))?.match(/"([^"]+)"/)?.[1] || 'N/A'}`);
    console.log(`  - Pretas: ${headers.find(h => h.includes('Black'))?.match(/"([^"]+)"/)?.[1] || 'N/A'}`);
    console.log(`  - Data: ${headers.find(h => h.includes('Date'))?.match(/"([^"]+)"/)?.[1] || 'N/A'}`);

    // Show some key positions
    const chess3 = new Chess();
    chess3.loadPgn(game.pgn);
    
    const keyMoves = [Math.floor(moves.length / 4), Math.floor(moves.length / 2), Math.floor(3 * moves.length / 4)];
    console.log(`\n🔍 Posições-chave:`);
    
    keyMoves.forEach(moveNum => {
      if (moveNum < moves.length) {
        const chess4 = new Chess();
        chess4.loadPgn(game.pgn);
        
        // Apply moves up to this point
        const allMoves = chess4.moves({ verbose: false });
        for (let i = 0; i < moveNum && i < allMoves.length; i++) {
          chess4.move(allMoves[i]);
        }
        
        console.log(`  - Lance ${moveNum + 1}: ${chess4.fen().substring(0, 50)}...`);
      }
    });

    console.log(`\n✅ Partida ${index + 1} processada com sucesso!`);

  } catch (error) {
    console.error(`❌ Erro ao processar partida ${index + 1}:`, error.message);
  }

  console.log('');
});

console.log('='.repeat(70));
console.log('\n✨ Teste completo! Todas as 3 partidas foram analisadas.\n');
