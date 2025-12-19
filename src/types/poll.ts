export type PollOption = {
  id: number
  text: string
  count: number
}

export type Poll = {
  id: string
  question: string
  category: string
  tags: string[]
  options: PollOption[]
  popularity: number
  creatorReputation: number
}
