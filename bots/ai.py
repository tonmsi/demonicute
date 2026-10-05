"""Simple AI helpers for building game-playing bots.

The module exposes a :class:`MinimaxBot` that can reason about two-player,
perfect-information games using alpha-beta pruning. Games are described using
lightweight protocol objects so the same bot can be reused across multiple
projects.
"""
from __future__ import annotations

from dataclasses import dataclass
from math import inf
from typing import Iterable, Protocol, TypeVar

Move = TypeVar("Move")


class GameState(Protocol[Move]):
    """Protocol describing a two-player, perfect-information game state.

    Implementations must provide the current player, generate legal moves,
    apply moves to produce successor states, detect terminal conditions, and
    evaluate states from the perspective of a given player.
    """

    @property
    def current_player(self) -> int:
        """The player whose turn it is (commonly ``1`` or ``-1``)."""

    def legal_moves(self) -> Iterable[Move]:
        """Return the set of moves available to ``current_player``."""

    def apply_move(self, move: Move) -> "GameState[Move]":
        """Return the state that results from playing ``move``."""

    def is_terminal(self) -> bool:
        """Whether the game is finished."""

    def evaluate(self, perspective: int) -> float:
        """Score the state from the perspective of ``perspective``.

        Winning states should return positive numbers, losing states negative
        numbers, and neutral/drawn states should be close to zero.
        """


def _negamax(state: GameState[Move], depth: int, alpha: float, beta: float, perspective: int) -> float:
    """Evaluate ``state`` using a depth-limited negamax search.

    The function returns a score from the perspective of ``perspective``.
    """

    if depth == 0 or state.is_terminal():
        return state.evaluate(perspective)

    best = -inf
    for move in state.legal_moves():
        score = -_negamax(state.apply_move(move), depth - 1, -beta, -alpha, perspective)
        best = max(best, score)
        alpha = max(alpha, score)
        if alpha >= beta:
            break
    return best


@dataclass
class MinimaxBot:
    """A depth-limited bot that chooses moves via negamax search."""

    depth: int = 4

    def choose(self, state: GameState[Move]) -> Move:
        """Return the best move available from ``state``.

        Ties are broken in favor of the first best move encountered.
        """

        perspective = state.current_player
        best_score = -inf
        best_move: Move | None = None

        for move in state.legal_moves():
            score = -_negamax(state.apply_move(move), self.depth - 1, -inf, inf, perspective)
            if score > best_score:
                best_score = score
                best_move = move

        if best_move is None:
            raise ValueError("No legal moves available for the current state")

        return best_move
