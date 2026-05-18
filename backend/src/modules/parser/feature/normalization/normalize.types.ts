/**
 * The result of running the full normalization pipeline.
 * Carried into the extraction stage — extractors always work on
 * `normalized`, never on raw input.
 */
export interface NormalizationResult {
  /** Exactly what the user submitted — stored verbatim in DB, never modified */
  raw: string;
  /** The preprocessed string passed to all downstream extractors */
  normalized: string;
}

/**
 * A single normalization step: a pure function (string) => string.
 * The pipeline is just an ordered array of these.
 */
export type NormalizationStep = (input: string) => string;
