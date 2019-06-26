/**
 * Types for Google's Perspective API.
 */
namespace Perspective {
  // eslint-disable-line no-unused-vars
  interface Attribute {
    scoreType?: 'PROBABILITY';
    scoreThreshold?: number;
  }

  type AttributeMap = { [s: string]: Attribute };

  interface AttributeScore {
    spanScores: ReadonlyArray<SpanScore>;
    summaryScore: Score;
  }

  type AttributeScoreMap = { [s: string]: AttributeScore };

  interface Comment {
    text: string;
    type?: 'HTML' | 'PLAIN_TEXT';
  }

  interface Score {
    type: string;
    value: number;
  }

  interface SpanScore {
    begin: number;
    end: number;
    score: Score;
  }

  /**
   * Format of the Perspective API request.
   *
   * See: https://github.com/conversationai/perspectiveapi/blob/master/api_reference.md#analyzecomment-request
   */
  export interface Request {
    comment: Comment;
    requestedAttributes: AttributeMap;
    languages?: string[];
    doNotStore?: boolean;
    clientToken?: string;
    sessionId?: string;
  }

  /**
   * Format of the Perspective API response.
   *
   * See: https://github.com/conversationai/perspectiveapi/blob/master/api_reference.md#analyzecomment-response
   */
  export interface Response {
    attributeScores: AttributeScoreMap;
    clientToken: string;
    languages: string[];
  }
}
