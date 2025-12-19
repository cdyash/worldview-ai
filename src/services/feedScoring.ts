import { Poll } from "../types/poll"

export function scorePoll(
  poll: Poll,
  userInterests: Record<string, number>
) {
  let score = 0

  poll.tags.forEach((tag) => {
    score += userInterests[tag] || 0
  })

  // small boost for popular polls
  score += poll.popularity * 0.1

  return score
}
