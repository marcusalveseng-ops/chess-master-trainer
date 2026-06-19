import axios from 'axios';

const LICHESS_API = 'https://lichess.org/api';
const CHESSCOM_API = 'https://api.chess.com/pub';

// Lichess API interfaces
export interface LichessOpening {
  eco: string;
  name: string;
  ply: number;
}

export interface LichessGameStats {
  white: number;
  black: number;
  draws: number;
}

export interface LichessOpeningExplorerMove {
  uci: string;
  san: string;
  averageRating: number;
  games: number;
  draws: number;
  whiteWins: number;
  blackWins: number;
}

export interface LichessOpeningExplorer {
  moves: LichessOpeningExplorerMove[];
  topGames: any[];
  recentGames: any[];
}

// Chess.com API interfaces
export interface ChessComGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  accuracies?: {
    white: number;
    black: number;
  };
  white: {
    username: string;
    rating: number;
    result: string;
  };
  black: {
    username: string;
    rating: number;
    result: string;
  };
}

export interface ChessComPlayer {
  url: string;
  username: string;
  title?: string;
  status: string;
  name?: string;
  avatar?: string;
  location?: string;
  followers: number;
  country: string;
  last_online: number;
  joined: number;
  stats: {
    chess_blitz?: {
      last: {
        rating: number;
        date: number;
      };
      best: {
        rating: number;
        date: number;
      };
      record: {
        wins: number;
        losses: number;
        draws: number;
      };
    };
    chess_rapid?: any;
    chess_classical?: any;
  };
}

// Lichess functions
export async function getLichessOpeningExplorer(fen: string, speeds: string[] = ['blitz', 'rapid', 'classical'], ratings: string[] = ['2200']): Promise<LichessOpeningExplorer | null> {
  try {
    const params = new URLSearchParams({
      fen,
      speeds: speeds.join(','),
      ratings: ratings.join(','),
    });
    
    const response = await axios.get(`${LICHESS_API}/opening/explorer/masters?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Lichess opening explorer:', error);
    return null;
  }
}

export async function getLichessGamesByOpening(opening: string, limit = 20): Promise<any[]> {
  try {
    const response = await axios.get(`${LICHESS_API}/games/search`, {
      params: {
        opening,
        limit,
        sort: 'rating',
      },
      headers: {
        Accept: 'application/x-ndjson',
      },
    });
    
    // Parse NDJSON response
    const games: any[] = [];
    const lines = response.data.split('\n').filter((line: string) => line.trim());
    for (const line of lines) {
      try {
        games.push(JSON.parse(line));
      } catch (e) {
        // Skip invalid JSON lines
      }
    }
    return games;
  } catch (error) {
    console.error('Error fetching Lichess games:', error);
    return [];
  }
}

export async function getLichessPlayerGames(username: string, limit = 20): Promise<any[]> {
  try {
    const response = await axios.get(`${LICHESS_API}/games/user/${username}`, {
      params: {
        limit,
        sort: 'dateDesc',
      },
      headers: {
        Accept: 'application/x-ndjson',
      },
    });
    
    const games: any[] = [];
    const lines = response.data.split('\n').filter((line: string) => line.trim());
    for (const line of lines) {
      try {
        games.push(JSON.parse(line));
      } catch (e) {
        // Skip invalid JSON lines
      }
    }
    return games;
  } catch (error) {
    console.error('Error fetching Lichess player games:', error);
    return [];
  }
}

// Chess.com functions
export async function getChessComPlayerProfile(username: string): Promise<ChessComPlayer | null> {
  try {
    const response = await axios.get(`${CHESSCOM_API}/player/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Chess.com player profile:', error);
    return null;
  }
}

export async function getChessComPlayerGames(username: string, year?: number, month?: number): Promise<ChessComGame[]> {
  try {
    let url = `${CHESSCOM_API}/player/${username}/games`;
    if (year && month) {
      url += `/${year}/${String(month).padStart(2, '0')}`;
    }
    
    const response = await axios.get(url);
    return response.data.games || [];
  } catch (error) {
    console.error('Error fetching Chess.com player games:', error);
    return [];
  }
}

export async function getChessComGamesByOpening(opening: string, limit = 20): Promise<any[]> {
  try {
    // Chess.com doesn't have a direct opening search API, so we search by player games
    // This is a simplified implementation - in production you might want to use a different approach
    const response = await axios.get(`${CHESSCOM_API}/titled/GM`, {
      params: {
        limit: 10,
      },
    });
    
    const grandmasters = response.data.players || [];
    const games: any[] = [];
    
    for (const gm of grandmasters.slice(0, 3)) {
      const gmName = gm.split('/').pop();
      const gmGames = await getChessComPlayerGames(gmName);
      games.push(...gmGames.slice(0, 5));
    }
    
    return games.slice(0, limit);
  } catch (error) {
    console.error('Error fetching Chess.com games by opening:', error);
    return [];
  }
}

export async function getChessComTitledPlayers(title: string = 'GM'): Promise<string[]> {
  try {
    const response = await axios.get(`${CHESSCOM_API}/titled/${title}`);
    return response.data.players || [];
  } catch (error) {
    console.error('Error fetching Chess.com titled players:', error);
    return [];
  }
}

// Utility function to parse PGN and extract opening
export function extractOpeningFromPGN(pgn: string): { name: string; eco: string } | null {
  const openingMatch = pgn.match(/\[Opening\s"([^"]+)"\]/);
  const ecoMatch = pgn.match(/\[ECO\s"([^"]+)"\]/);
  
  if (openingMatch && ecoMatch) {
    return {
      name: openingMatch[1],
      eco: ecoMatch[1],
    };
  }
  
  return null;
}
