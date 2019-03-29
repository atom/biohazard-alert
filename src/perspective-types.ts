namespace Perspective {
  interface Attribute {
    scoreType?: "PROBABILITY"
    scoreThreshold?: number
  }

  type AttributeMap = {[s: string]: Attribute}

  interface AttributeScore {
    spanScores: ReadonlyArray<SpanScore>
    summaryScore: Score
  }

  type AttributeScoreMap = {[s: string]: AttributeScore}

  interface Comment {
    text: string
    type?: "HTML" | "PLAIN_TEXT"
  }

  interface Score {
    type: string
    value: number
  }

  interface SpanScore {
    begin: number
    end: number
    score: Score
  }

  export interface Request {
    comment: Comment
    requestedAttributes: AttributeMap
    languages?: string[]
    doNotStore?: boolean
    clientToken?: string
    sessionId?: string
  }

  export interface Response {
    attributeScores: AttributeScoreMap
    clientToken: string
    languages: string[]
  }
}
