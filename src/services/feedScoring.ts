import { Poll } from "../types/poll"

/**
 * Score a poll for a specific user using:
 * - Tag-based interest matching
 * - Diminishing returns (sqrt)
 * - Soft category boost
 */
export function scorePollV2(
  poll: Poll,
  userInterests: Record<string, number>
): number {
  if (!userInterests) return 0

  let rawTagScore = 0

  // 1️⃣ Tag-based scoring (main signal)
  if (poll.tags && Array.isArray(poll.tags)) {
    const uniqueTags = new Set(poll.tags)

    uniqueTags.forEach((tag) => {
      rawTagScore += userInterests[tag] || 0
    })
  }

  // 2️⃣ Diminishing returns
  const tagScore = Math.sqrt(rawTagScore)

  // 3️⃣ Soft category boost (lower weight)
  const categoryScore = userInterests[poll.category] || 0
  const weightedCategoryScore = categoryScore * 0.5

  // 4️⃣ Final score
  return tagScore + weightedCategoryScore
}
