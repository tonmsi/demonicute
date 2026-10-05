from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List

from bots.ai import GameState, MinimaxBot


@dataclass(frozen=True)
class TicTacToe(GameState[int]):
    board: List[int]  # 1 for X, -1 for O, 0 for empty
    _turn: int

    @property
    def current_player(self) -> int:
        return self._turn

    def legal_moves(self) -> Iterable[int]:
        return [idx for idx, value in enumerate(self.board) if value == 0]

    def apply_move(self, move: int) -> "TicTacToe":
        next_board = self.board.copy()
        next_board[move] = self.current_player
        return TicTacToe(next_board, -self.current_player)

    def is_terminal(self) -> bool:
        return self._winner() is not None or all(cell != 0 for cell in self.board)

    def _winner(self) -> int | None:
        lines = [
            (0, 1, 2), (3, 4, 5), (6, 7, 8),  # rows
            (0, 3, 6), (1, 4, 7), (2, 5, 8),  # columns
            (0, 4, 8), (2, 4, 6),  # diagonals
        ]
        for a, b, c in lines:
            total = self.board[a] + self.board[b] + self.board[c]
            if total == 3:
                return 1
            if total == -3:
                return -1
        return None

    def evaluate(self, perspective: int) -> float:
        winner = self._winner()
        if winner is None:
            score = 0.0
            for a, b, c in [
                (0, 1, 2), (3, 4, 5), (6, 7, 8),
                (0, 3, 6), (1, 4, 7), (2, 5, 8),
                (0, 4, 8), (2, 4, 6),
            ]:
                line = [self.board[a], self.board[b], self.board[c]]
                count_self = line.count(perspective)
                count_opponent = line.count(-perspective)
                empties = line.count(0)

                if count_self and count_opponent:
                    continue
                if count_self == 2 and empties == 1:
                    score += 1.0
                elif count_opponent == 2 and empties == 1:
                    score -= 1.0
                else:
                    score += 0.1 * (count_self - count_opponent)

            return score / 4.0

        return 1.0 if winner == perspective else -1.0


def test_minimax_picks_winning_move():
    # X to move with a winning play at position 2
    state = TicTacToe([1, 1, 0, 0, -1, 0, -1, 0, 0], _turn=1)
    move = MinimaxBot(depth=3).choose(state)
    assert move == 2


def test_minimax_blocks_loss():
    # O to move must block X at position 2 to prevent an immediate loss
    state = TicTacToe([1, 1, 0, -1, 0, 0, 0, 0, 0], _turn=-1)
    move = MinimaxBot(depth=3).choose(state)
    assert move == 2
